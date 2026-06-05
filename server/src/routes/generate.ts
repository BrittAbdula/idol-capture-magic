import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { concepts, generations, members, users, type Concept } from "../db/schema.js";
import { jsonError } from "../lib/http.js";
import {
  isAsyncGenerationProvider,
  type GenerationProvider,
  type GenerationRequest
} from "../services/generation/provider.js";
import { reconcileGenerationById } from "../services/generation/reconcile.js";
import { applyWatermark, watermarkLevelForPlan } from "../services/generation/watermark.js";
import { consumeUserQuota, refundUserQuota } from "../services/quota.js";
import { checkConcept } from "../services/safety.js";
import type { StorageService } from "../services/storage.js";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ANON_DAILY_LIMIT = 1;
type BodyEntry = string | File;

const GenerateFieldsSchema = z.object({
  conceptId: z.string().min(1),
  memberId: z.string().min(1),
  makePublic: z.boolean().default(false)
});

interface GenerateRouteDeps {
  client: DatabaseClient;
  provider: GenerationProvider;
  storage: StorageService;
  auth?: Auth;
}

const anonQuota = new Map<string, { used: number; resetAt: number }>();

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function nextAnonResetAt(now = new Date()): number {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return Math.floor(reset.getTime() / 1000);
}

function consumeAnonQuota(ip: string): number {
  const now = Math.floor(Date.now() / 1000);
  const quota = anonQuota.get(ip);
  const current = !quota || quota.resetAt <= now ? { used: 0, resetAt: nextAnonResetAt() } : quota;
  if (current.used >= ANON_DAILY_LIMIT) {
    throw new Error("anon_quota_exhausted");
  }

  current.used += 1;
  anonQuota.set(ip, current);
  return ANON_DAILY_LIMIT - current.used;
}

function refundAnonQuota(ip: string): void {
  const quota = anonQuota.get(ip);
  if (!quota) {
    return;
  }

  anonQuota.set(ip, {
    ...quota,
    used: Math.max(0, quota.used - 1)
  });
}

function singleString(value: BodyEntry | BodyEntry[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function boolField(value: BodyEntry | BodyEntry[] | undefined): boolean {
  const text = singleString(value);
  return text === "true" || text === "1" || text === "yes";
}

function extractPhotos(value: BodyEntry | BodyEntry[] | undefined): File[] {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.filter((entry): entry is File => entry instanceof File);
}

function mimeExtension(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "png";
}

function outputSize(format: Concept["format"]): GenerationRequest["size"] {
  if (format === "fancall") {
    return "1536x1024";
  }
  if (format === "photocard" || format === "strip") {
    return "1024x1536";
  }
  return "1024x1024";
}

function safeStyleTokens(concept: Concept): string[] {
  try {
    const parsed = JSON.parse(concept.styleTokens) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

async function getCurrentUser(deps: GenerateRouteDeps, cookieHeader: string | undefined) {
  if (!deps.auth || !cookieHeader) {
    return null;
  }

  const sessionId = deps.auth.readSessionCookie(cookieHeader);
  if (!sessionId) {
    return null;
  }

  const { user } = await deps.auth.validateSession(sessionId);
  return user;
}

async function validatePhoto(photo: File): Promise<Buffer> {
  if (!SUPPORTED_MIME_TYPES.has(photo.type)) {
    throw new Error("unsupported_mime_type");
  }

  if (photo.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("file_too_large");
  }

  const buffer = Buffer.from(await photo.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new Error("empty_file");
  }

  return buffer;
}

export function createGenerateRoutes(deps: GenerateRouteDeps): Hono {
  const app = new Hono();

  app.post("/generate", async (c) => {
    const body = await c.req.parseBody({ all: true });
    const photos = extractPhotos(body.photo as BodyEntry | BodyEntry[] | undefined);
    if (!photos.length) {
      return jsonError(c, 400, "missing_photo");
    }
    if (photos.length > 2) {
      return jsonError(c, 400, "too_many_photos");
    }

    const parsed = GenerateFieldsSchema.safeParse({
      conceptId: singleString(body.conceptId as BodyEntry | BodyEntry[] | undefined),
      memberId: singleString(body.memberId as BodyEntry | BodyEntry[] | undefined),
      makePublic: boolField(body.makePublic as BodyEntry | BodyEntry[] | undefined)
    });
    if (!parsed.success) {
      return jsonError(c, 400, "invalid_generation_request");
    }

    let photoBuffers: Buffer[];
    try {
      photoBuffers = await Promise.all(photos.map(validatePhoto));
    } catch (error) {
      return jsonError(c, 400, error instanceof Error ? error.message : "invalid_photo");
    }
    const primaryPhoto = photos[0];
    const primaryPhotoBuffer = photoBuffers[0];

    const concept = await deps.client.db
      .select()
      .from(concepts)
      .where(eq(concepts.id, parsed.data.conceptId))
      .get();
    const member = await deps.client.db
      .select()
      .from(members)
      .where(eq(members.id, parsed.data.memberId))
      .get();

    if (!concept || !member) {
      return jsonError(c, 400, "unknown_concept_or_member");
    }

    const safety = checkConcept(concept, member);
    if (!safety.ok) {
      return jsonError(c, 400, "safety_block", { reason: safety.reason });
    }

    const user = await getCurrentUser(deps, c.req.header("Cookie"));
    let quotaRemaining = 0;
    let consumedQuota: { type: "user"; userId: string } | { type: "anon"; ip: string } | null =
      null;
    try {
      if (user) {
        quotaRemaining = (await consumeUserQuota(deps.client, user.id)).remaining;
        consumedQuota = { type: "user", userId: user.id };
      } else {
        const ip = getClientIp(c.req.raw);
        quotaRemaining = consumeAnonQuota(ip);
        consumedQuota = { type: "anon", ip };
      }
    } catch {
      return jsonError(c, 402, "quota_exhausted");
    }

    const inputObjects = await Promise.all(
      photos.map((photo, index) =>
        deps.storage.putBuffer(photoBuffers[index], {
          extension: mimeExtension(photo.type),
          contentType: photo.type
        })
      )
    );
    const inputObject = inputObjects[0];

    const generationId = randomUUID();
    const dbUser = user
      ? await deps.client.db.select().from(users).where(eq(users.id, user.id)).get()
      : null;
    const watermarkLevel = watermarkLevelForPlan(dbUser?.plan);
    const createdAt = Math.floor(Date.now() / 1000);
    await deps.client.db
      .insert(generations)
      .values({
        id: generationId,
        userId: user?.id ?? null,
        conceptId: concept.id,
        memberId: member.id,
        format: concept.format,
        status: "queued",
        inputImageRef: inputObject.key,
        inputImageRefs: JSON.stringify(inputObjects.map((object) => object.key)),
        watermarkLevel,
        isPublic: parsed.data.makePublic,
        createdAt
      })
      .run();

    await deps.client.db
      .update(generations)
      .set({ status: "running" })
      .where(eq(generations.id, generationId))
      .run();

    const generationRequest: GenerationRequest = {
      conceptPrompt: concept.promptTemplate,
      styleTokens: safeStyleTokens(concept),
      inputImage: primaryPhotoBuffer,
      inputMimeType: primaryPhoto.type,
      inputImages: photoBuffers.map((buffer, index) => ({
        image: buffer,
        mimeType: photos[index].type
      })),
      outputFormat: "png",
      size: outputSize(concept.format)
    };

    try {
      if (isAsyncGenerationProvider(deps.provider)) {
        const task = await deps.provider.start(generationRequest);
        await deps.client.db
          .update(generations)
          .set({
            providerJobId: task.providerJobId
          })
          .where(eq(generations.id, generationId))
          .run();

        return c.json(
          {
            id: generationId,
            status: "running",
            outputUrl: null,
            watermarkLevel,
            quotaRemaining
          },
          202
        );
      }

      const result = await deps.provider.generate(generationRequest);
      const watermarkedImage = await applyWatermark({
        input: result.image,
        level: watermarkLevel
      });
      const outputObject = await deps.storage.putBuffer(watermarkedImage, {
        extension: "png",
        contentType: "image/png"
      });

      await deps.client.db
        .update(generations)
        .set({
          status: "succeeded",
          providerJobId: result.providerJobId,
          outputImageRef: outputObject.key,
          cost: result.costUsd
        })
        .where(eq(generations.id, generationId))
        .run();

      return c.json({
        id: generationId,
        status: "succeeded",
        outputUrl: outputObject.publicUrl,
        watermarkLevel,
        quotaRemaining
      });
    } catch (error) {
      await Promise.allSettled([
        deps.client.db
          .update(generations)
          .set({
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Generation failed"
          })
          .where(eq(generations.id, generationId))
          .run(),
        refundConsumedQuota(deps, consumedQuota)
      ]);
      return jsonError(c, 422, "provider_rejected");
    }
  });

  app.get("/generations", async (c) => {
    const user = await getCurrentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    const rows = await deps.client.db
      .select({
        id: generations.id,
        status: generations.status,
        format: generations.format,
        outputImageRef: generations.outputImageRef,
        errorMessage: generations.errorMessage,
        cost: generations.cost,
        watermarkLevel: generations.watermarkLevel,
        isPublic: generations.isPublic,
        createdAt: generations.createdAt,
        conceptName: concepts.name,
        memberName: members.name
      })
      .from(generations)
      .leftJoin(concepts, eq(generations.conceptId, concepts.id))
      .leftJoin(members, eq(generations.memberId, members.id))
      .where(eq(generations.userId, user.id))
      .orderBy(desc(generations.createdAt))
      .all();

    return c.json({
      items: rows.map((row) => ({
        id: row.id,
        status: row.status,
        format: row.format,
        conceptName: row.conceptName ?? "Unknown concept",
        memberName: row.memberName ?? "Unknown member",
        outputUrl: row.outputImageRef ? deps.storage.publicUrlFor(row.outputImageRef) : null,
        errorMessage: row.errorMessage,
        watermarkLevel: row.watermarkLevel,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        creditsUsed: 1,
        costUsd: row.cost
      }))
    });
  });

  app.get("/generations/:id", async (c) => {
    const id = c.req.param("id");
    await reconcileGenerationById(deps, id);
    const generation = await deps.client.db
      .select()
      .from(generations)
      .where(eq(generations.id, id))
      .get();
    if (!generation) {
      return jsonError(c, 404, "generation_not_found");
    }

    return c.json({
      id: generation.id,
      status: generation.status,
      outputUrl: generation.outputImageRef
        ? deps.storage.publicUrlFor(generation.outputImageRef)
        : null,
      watermarkLevel: generation.watermarkLevel,
      errorMessage: generation.errorMessage
    });
  });

  return app;
}

async function refundConsumedQuota(
  deps: GenerateRouteDeps,
  consumedQuota: { type: "user"; userId: string } | { type: "anon"; ip: string } | null
): Promise<void> {
  if (!consumedQuota) {
    return;
  }

  if (consumedQuota.type === "user") {
    await refundUserQuota(deps.client, consumedQuota.userId);
    return;
  }

  refundAnonQuota(consumedQuota.ip);
}
