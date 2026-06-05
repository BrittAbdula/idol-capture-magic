import type { DatabaseClient } from "../../db/client.js";

const DEFAULT_STALE_AFTER_SECONDS = 60 * 60;
const STALE_ERROR_MESSAGE = "Generation timed out before completion";

interface StaleGenerationRow {
  id: string;
  userId: string | null;
}

interface UserQuotaRow {
  dailyQuotaUsed: number;
  dailyQuotaResetAt: number;
}

export interface CleanupStaleGenerationsOptions {
  nowUnix?: number;
  staleAfterSeconds?: number;
}

export interface CleanupStaleGenerationsResult {
  cutoffUnix: number;
  staleGenerations: number;
  refundedCredits: number;
  refundedUsers: number;
}

export async function cleanupStaleGenerations(
  client: DatabaseClient,
  options: CleanupStaleGenerationsOptions = {}
): Promise<CleanupStaleGenerationsResult> {
  const nowUnix = options.nowUnix ?? Math.floor(Date.now() / 1000);
  const staleAfterSeconds = options.staleAfterSeconds ?? DEFAULT_STALE_AFTER_SECONDS;
  const cutoffUnix = nowUnix - staleAfterSeconds;
  const staleRows = await client.d1.getAll<StaleGenerationRow>(
    `
      SELECT id, user_id AS userId
      FROM generations
      WHERE status IN ('queued', 'running') AND created_at <= ?
    `,
    [cutoffUnix]
  );

  if (!staleRows.length) {
    return {
      cutoffUnix,
      staleGenerations: 0,
      refundedCredits: 0,
      refundedUsers: 0
    };
  }

  await client.d1.execute(
    `
      UPDATE generations
      SET
        status = 'failed',
        error_message = CASE
          WHEN error_message IS NULL OR error_message = '' THEN ?
          ELSE error_message
        END
      WHERE status IN ('queued', 'running') AND created_at <= ?
    `,
    [STALE_ERROR_MESSAGE, cutoffUnix]
  );

  const staleByUser = new Map<string, number>();
  for (const row of staleRows) {
    if (!row.userId) {
      continue;
    }
    staleByUser.set(row.userId, (staleByUser.get(row.userId) ?? 0) + 1);
  }

  let refundedCredits = 0;
  let refundedUsers = 0;
  for (const [userId, staleCount] of staleByUser) {
    const quota = await client.d1.get<UserQuotaRow>(
      `
        SELECT
          daily_quota_used AS dailyQuotaUsed,
          daily_quota_reset_at AS dailyQuotaResetAt
        FROM users
        WHERE id = ?
      `,
      [userId]
    );
    if (!quota || quota.dailyQuotaResetAt <= nowUnix || quota.dailyQuotaUsed <= 0) {
      continue;
    }

    const refund = Math.min(staleCount, quota.dailyQuotaUsed);
    if (!refund) {
      continue;
    }

    await client.d1.execute(
      "UPDATE users SET daily_quota_used = MAX(0, daily_quota_used - ?) WHERE id = ?",
      [refund, userId]
    );
    refundedCredits += refund;
    refundedUsers += 1;
  }

  return {
    cutoffUnix,
    staleGenerations: staleRows.length,
    refundedCredits,
    refundedUsers
  };
}
