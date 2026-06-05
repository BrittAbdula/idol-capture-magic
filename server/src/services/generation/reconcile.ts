import type { DatabaseClient } from "../../db/client.js";
import { refundUserQuota } from "../quota.js";
import type { StorageService } from "../storage.js";
import {
  isAsyncGenerationProvider,
  type GenerationProvider,
  type GenerationPollResult
} from "./provider.js";
import { applyWatermark, type WatermarkLevel } from "./watermark.js";

interface RunningGenerationRow {
  id: string;
  userId: string | null;
  providerJobId: string;
  watermarkLevel: WatermarkLevel;
}

export interface ReconcileGenerationDeps {
  client: DatabaseClient;
  provider: GenerationProvider;
  storage: StorageService;
}

export interface ReconcileGenerationResult {
  inspected: number;
  succeeded: number;
  failed: number;
  stillRunning: number;
  errors: number;
  refundedCredits: number;
}

export async function reconcileGenerationById(
  deps: ReconcileGenerationDeps,
  id: string
): Promise<ReconcileGenerationResult> {
  const row = await deps.client.d1.get<RunningGenerationRow>(
    `
      SELECT
        id,
        user_id AS userId,
        provider_job_id AS providerJobId,
        watermark_level AS watermarkLevel
      FROM generations
      WHERE id = ? AND status = 'running' AND provider_job_id IS NOT NULL
    `,
    [id]
  );

  if (!row) {
    return emptyResult();
  }

  return reconcileRows(deps, [row]);
}

export async function reconcileRunningGenerations(
  deps: ReconcileGenerationDeps,
  options: { limit?: number } = {}
): Promise<ReconcileGenerationResult> {
  const limit = Math.max(1, Math.min(options.limit ?? 25, 100));
  const rows = await deps.client.d1.getAll<RunningGenerationRow>(
    `
      SELECT
        id,
        user_id AS userId,
        provider_job_id AS providerJobId,
        watermark_level AS watermarkLevel
      FROM generations
      WHERE status = 'running' AND provider_job_id IS NOT NULL
      ORDER BY created_at ASC
      LIMIT ?
    `,
    [limit]
  );

  return reconcileRows(deps, rows);
}

async function reconcileRows(
  deps: ReconcileGenerationDeps,
  rows: RunningGenerationRow[]
): Promise<ReconcileGenerationResult> {
  const result = emptyResult();
  if (!isAsyncGenerationProvider(deps.provider)) {
    return result;
  }

  for (const row of rows) {
    result.inspected += 1;
    let pollResult: GenerationPollResult;
    try {
      pollResult = await deps.provider.poll(row.providerJobId);
    } catch (error) {
      result.errors += 1;
      console.warn("Unable to poll generation provider", {
        generationId: row.id,
        providerJobId: row.providerJobId,
        error: error instanceof Error ? error.message : "unknown"
      });
      continue;
    }

    if (pollResult.status === "queued" || pollResult.status === "running") {
      result.stillRunning += 1;
      continue;
    }

    if (pollResult.status === "failed") {
      await deps.client.d1.execute(
        `
          UPDATE generations
          SET
            status = 'failed',
            error_message = ?
          WHERE id = ? AND status = 'running'
        `,
        [pollResult.errorMessage, row.id]
      );
      result.failed += 1;
      if (row.userId) {
        await refundUserQuota(deps.client, row.userId);
        result.refundedCredits += 1;
      }
      continue;
    }

    if (pollResult.status !== "succeeded") {
      result.stillRunning += 1;
      continue;
    }

    try {
      const watermarkedImage = await applyWatermark({
        input: pollResult.image,
        level: row.watermarkLevel
      });
      const outputObject = await deps.storage.putBuffer(watermarkedImage, {
        extension: "png",
        contentType: "image/png"
      });

      await deps.client.d1.execute(
        `
          UPDATE generations
          SET
            status = 'succeeded',
            output_image_ref = ?,
            cost = ?,
            error_message = NULL
          WHERE id = ? AND status = 'running'
        `,
        [outputObject.key, pollResult.costUsd, row.id]
      );
      result.succeeded += 1;
    } catch (error) {
      result.errors += 1;
      console.warn("Unable to finalize generation result", {
        generationId: row.id,
        providerJobId: row.providerJobId,
        error: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  return result;
}

function emptyResult(): ReconcileGenerationResult {
  return {
    inspected: 0,
    succeeded: 0,
    failed: 0,
    stillRunning: 0,
    errors: 0,
    refundedCredits: 0
  };
}
