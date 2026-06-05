import { Hono } from "hono";

import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { jsonError } from "../lib/http.js";
import { cleanupStaleGenerations } from "../services/generation/stale.js";
import type { StorageService } from "../services/storage.js";

const ADMIN_EMAIL = "auroroa@gmail.com";

interface AdminRouteDeps {
  auth?: Auth;
  client: DatabaseClient;
  storage?: StorageService;
}

interface CountStatsRow {
  total: number | null;
  last24h: number | null;
  last7d: number | null;
  paidTotal?: number | null;
}

interface GenerationStatsRow extends CountStatsRow {
  succeededLast7d: number | null;
  failedLast7d: number | null;
  publicLast7d: number | null;
  costUsdLast7d: number | null;
}

interface GenerationReliabilityRow {
  runningTotal: number | null;
  stalePendingTotal: number | null;
}

interface BillingStatsRow {
  checkoutCreatedLast7d: number | null;
  checkoutFailedLast7d: number | null;
  checkoutRecoveredLast7d: number | null;
  checkoutUpgradeDialogLast7d: number | null;
  checkoutPricingPageLast7d: number | null;
  checkoutResumedAfterSignInLast7d: number | null;
  checkoutWatermarkLast7d: number | null;
  checkoutHdDownloadLast7d: number | null;
  checkoutQuotaLast7d: number | null;
  subscriptionUpdatedLast7d: number | null;
  subscriptionDeletedLast7d: number | null;
  webhookIgnoredLast7d: number | null;
}

interface ActiveUserRow {
  id: string;
  email: string;
  handle: string;
  plan: "free" | "plus" | "pro";
  createdAt: number;
  lastActiveAt: number;
  generationCount: number;
  succeededCount: number | null;
  failedCount: number | null;
  recentOutputRef: string | null;
}

interface AdminAssetRow {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  format: string;
  createdAt: number;
  inputImageRef: string | null;
  inputImageRefs: string | null;
  outputImageRef: string | null;
  cost: number | null;
  watermarkLevel: string;
  isPublic: number | boolean;
  conceptName: string | null;
  memberName: string | null;
}

interface AdminUserRow {
  id: string;
  email: string;
  handle: string;
  plan: "free" | "plus" | "pro";
  createdAt: number;
}

interface AdminEmailRow {
  email: string;
}

function asNumber(value: number | null | undefined): number {
  return Number(value ?? 0);
}

function storageUrl(ref: string | null, storage?: StorageService): string | null {
  if (!ref) {
    return null;
  }
  if (ref.startsWith("/") || /^https?:\/\//i.test(ref)) {
    return ref;
  }
  return storage?.publicUrlFor(ref) ?? `/storage/${ref}`;
}

function inputUrlsFor(
  row: Pick<AdminAssetRow, "inputImageRef" | "inputImageRefs">,
  storage?: StorageService
): string[] {
  const refs = inputRefsFor(row);
  return refs.map((ref) => storageUrl(ref, storage)).filter((url): url is string => Boolean(url));
}

function inputRefsFor(row: Pick<AdminAssetRow, "inputImageRef" | "inputImageRefs">): string[] {
  if (row.inputImageRefs) {
    try {
      const parsed = JSON.parse(row.inputImageRefs) as unknown;
      if (Array.isArray(parsed)) {
        const refs = parsed.filter(
          (value): value is string => typeof value === "string" && value.length > 0
        );
        if (refs.length) {
          return refs;
        }
      }
    } catch {
      // Fall back to the legacy single-image column below.
    }
  }

  return row.inputImageRef ? [row.inputImageRef] : [];
}

function limitFromQuery(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

async function requireAdmin(deps: AdminRouteDeps, cookieHeader: string | undefined) {
  if (!deps.auth || !cookieHeader) {
    return false;
  }

  const sessionId = deps.auth.readSessionCookie(cookieHeader);
  if (!sessionId) {
    return false;
  }

  const { user } = await deps.auth.validateSession(sessionId);
  if (!user) {
    return false;
  }

  const dbUser = await deps.client.d1.get<AdminEmailRow>("SELECT email FROM users WHERE id = ?", [
    user.id
  ]);
  return dbUser?.email.toLowerCase() === ADMIN_EMAIL;
}

export function createAdminRoutes(deps: AdminRouteDeps): Hono {
  const app = new Hono();

  app.use("*", async (c, next) => {
    const admin = await requireAdmin(deps, c.req.header("Cookie"));
    if (!admin) {
      return c.req.header("Cookie")
        ? jsonError(c, 403, "admin_required")
        : jsonError(c, 401, "auth_required");
    }

    await next();
  });

  app.get("/overview", async (c) => {
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86_400;
    const weekAgo = now - 7 * 86_400;
    const staleCutoff = now - 3_600;
    const activeLimit = limitFromQuery(c.req.query("limit"), 20, 50);

    const [userStats, generationStats, generationReliability, billingStats, activeUsers] =
      await Promise.all([
        deps.client.d1.get<CountStatsRow>(
          `
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last24h,
            SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last7d,
            SUM(CASE WHEN plan IN ('plus', 'pro') THEN 1 ELSE 0 END) AS paidTotal
          FROM users
        `,
          [dayAgo, weekAgo]
        ),
        deps.client.d1.get<GenerationStatsRow>(
          `
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last24h,
            SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last7d,
            SUM(CASE WHEN created_at >= ? AND status = 'succeeded' THEN 1 ELSE 0 END) AS succeededLast7d,
            SUM(CASE WHEN created_at >= ? AND status = 'failed' THEN 1 ELSE 0 END) AS failedLast7d,
            SUM(CASE WHEN created_at >= ? AND is_public = 1 THEN 1 ELSE 0 END) AS publicLast7d,
            SUM(CASE WHEN created_at >= ? THEN COALESCE(cost, 0) ELSE 0 END) AS costUsdLast7d
          FROM generations
        `,
          [dayAgo, weekAgo, weekAgo, weekAgo, weekAgo, weekAgo]
        ),
        deps.client.d1.get<GenerationReliabilityRow>(
          `
          SELECT
            SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) AS runningTotal,
            SUM(CASE WHEN status IN ('queued', 'running') AND created_at <= ? THEN 1 ELSE 0 END) AS stalePendingTotal
          FROM generations
        `,
          [staleCutoff]
        ),
        deps.client.d1.get<BillingStatsRow>(
          `
          SELECT
            SUM(CASE WHEN event_type = 'checkout_created' AND created_at >= ? THEN 1 ELSE 0 END) AS checkoutCreatedLast7d,
            SUM(CASE WHEN event_type = 'checkout_failed' AND created_at >= ? THEN 1 ELSE 0 END) AS checkoutFailedLast7d,
            SUM(CASE WHEN event_type = 'checkout_retry_succeeded' AND created_at >= ? THEN 1 ELSE 0 END) AS checkoutRecoveredLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND source = 'upgrade_dialog' THEN 1 ELSE 0 END) AS checkoutUpgradeDialogLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND source = 'pricing_page' THEN 1 ELSE 0 END) AS checkoutPricingPageLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND checkout_flow = 'resumed_after_sign_in' THEN 1 ELSE 0 END) AS checkoutResumedAfterSignInLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND trigger_surface = 'result_watermark' THEN 1 ELSE 0 END) AS checkoutWatermarkLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND trigger_surface = 'result_hd_download' THEN 1 ELSE 0 END) AS checkoutHdDownloadLast7d,
            SUM(CASE WHEN event_type IN ('checkout_created', 'checkout_retry_succeeded') AND created_at >= ? AND trigger_surface IN ('result_quota', 'photo_step_quota', 'quota_exhausted_pre_generate', 'quota_exhausted_error') THEN 1 ELSE 0 END) AS checkoutQuotaLast7d,
            SUM(CASE WHEN event_type = 'webhook_subscription_updated' AND created_at >= ? THEN 1 ELSE 0 END) AS subscriptionUpdatedLast7d,
            SUM(CASE WHEN event_type = 'webhook_subscription_deleted' AND created_at >= ? THEN 1 ELSE 0 END) AS subscriptionDeletedLast7d,
            SUM(CASE WHEN event_type = 'webhook_ignored' AND created_at >= ? THEN 1 ELSE 0 END) AS webhookIgnoredLast7d
          FROM billing_events
        `,
          [
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo,
            weekAgo
          ]
        ),
        deps.client.d1.getAll<ActiveUserRow>(
          `
          SELECT
            u.id AS id,
            u.email AS email,
            u.handle AS handle,
            u.plan AS plan,
            u.created_at AS createdAt,
            MAX(g.created_at) AS lastActiveAt,
            COUNT(g.id) AS generationCount,
            SUM(CASE WHEN g.status = 'succeeded' THEN 1 ELSE 0 END) AS succeededCount,
            SUM(CASE WHEN g.status = 'failed' THEN 1 ELSE 0 END) AS failedCount,
            (
              SELECT recent.output_image_ref
              FROM generations recent
              WHERE recent.user_id = u.id AND recent.output_image_ref IS NOT NULL
              ORDER BY recent.created_at DESC
              LIMIT 1
            ) AS recentOutputRef
          FROM users u
          INNER JOIN generations g ON g.user_id = u.id
          GROUP BY u.id
          ORDER BY lastActiveAt DESC
          LIMIT ?
        `,
          [activeLimit]
        )
      ]);

    return c.json({
      stats: {
        registeredLast24h: asNumber(userStats?.last24h),
        registeredLast7d: asNumber(userStats?.last7d),
        registeredTotal: asNumber(userStats?.total),
        paidUsersTotal: asNumber(userStats?.paidTotal),
        generationsLast24h: asNumber(generationStats?.last24h),
        generationsLast7d: asNumber(generationStats?.last7d),
        generationsTotal: asNumber(generationStats?.total),
        succeededLast7d: asNumber(generationStats?.succeededLast7d),
        failedLast7d: asNumber(generationStats?.failedLast7d),
        publicGenerationsLast7d: asNumber(generationStats?.publicLast7d),
        costUsdLast7d: asNumber(generationStats?.costUsdLast7d),
        runningGenerationsTotal: asNumber(generationReliability?.runningTotal),
        stalePendingGenerationsTotal: asNumber(generationReliability?.stalePendingTotal),
        checkoutCreatedLast7d: asNumber(billingStats?.checkoutCreatedLast7d),
        checkoutFailedLast7d: asNumber(billingStats?.checkoutFailedLast7d),
        checkoutRecoveredLast7d: asNumber(billingStats?.checkoutRecoveredLast7d),
        checkoutUpgradeDialogLast7d: asNumber(billingStats?.checkoutUpgradeDialogLast7d),
        checkoutPricingPageLast7d: asNumber(billingStats?.checkoutPricingPageLast7d),
        checkoutResumedAfterSignInLast7d: asNumber(billingStats?.checkoutResumedAfterSignInLast7d),
        checkoutWatermarkLast7d: asNumber(billingStats?.checkoutWatermarkLast7d),
        checkoutHdDownloadLast7d: asNumber(billingStats?.checkoutHdDownloadLast7d),
        checkoutQuotaLast7d: asNumber(billingStats?.checkoutQuotaLast7d),
        subscriptionUpdatedLast7d: asNumber(billingStats?.subscriptionUpdatedLast7d),
        subscriptionDeletedLast7d: asNumber(billingStats?.subscriptionDeletedLast7d),
        billingWebhookIgnoredLast7d: asNumber(billingStats?.webhookIgnoredLast7d)
      },
      activeUsers: activeUsers.map((row) => ({
        id: row.id,
        email: row.email,
        handle: row.handle,
        plan: row.plan,
        createdAt: row.createdAt,
        lastActiveAt: row.lastActiveAt,
        generationCount: asNumber(row.generationCount),
        succeededCount: asNumber(row.succeededCount),
        failedCount: asNumber(row.failedCount),
        recentOutputUrl: storageUrl(row.recentOutputRef, deps.storage)
      }))
    });
  });

  app.post("/maintenance/cleanup-stale-generations", async (c) => {
    const result = await cleanupStaleGenerations(deps.client);
    return c.json(result);
  });

  app.get("/users/:userId/assets", async (c) => {
    const limit = limitFromQuery(c.req.query("limit"), 24, 50);
    const userId = c.req.param("userId");
    const user = await deps.client.d1.get<AdminUserRow>(
      `
        SELECT
          id,
          email,
          handle,
          plan,
          created_at AS createdAt
        FROM users
        WHERE id = ?
      `,
      [userId]
    );
    if (!user) {
      return jsonError(c, 404, "user_not_found");
    }

    const rows = await deps.client.d1.getAll<AdminAssetRow>(
      `
        SELECT
          g.id AS id,
          g.status AS status,
          g.format AS format,
          g.created_at AS createdAt,
          g.input_image_ref AS inputImageRef,
          g.input_image_refs AS inputImageRefs,
          g.output_image_ref AS outputImageRef,
          g.cost AS cost,
          g.watermark_level AS watermarkLevel,
          g.is_public AS isPublic,
          concepts.name AS conceptName,
          members.name AS memberName
        FROM generations g
        LEFT JOIN concepts ON g.concept_id = concepts.id
        LEFT JOIN members ON g.member_id = members.id
        WHERE g.user_id = ?
        ORDER BY g.created_at DESC
        LIMIT ?
      `,
      [userId, limit]
    );

    return c.json({
      user,
      items: rows.map((row) => {
        const inputUrls = inputUrlsFor(row, deps.storage);
        return {
          id: row.id,
          status: row.status,
          format: row.format,
          createdAt: row.createdAt,
          inputUrl: inputUrls[0] ?? null,
          inputUrls,
          outputUrl: storageUrl(row.outputImageRef, deps.storage),
          costUsd: row.cost,
          watermarkLevel: row.watermarkLevel,
          isPublic: Boolean(row.isPublic),
          conceptName: row.conceptName ?? "Unknown concept",
          memberName: row.memberName ?? "Unknown member"
        };
      })
    });
  });

  return app;
}
