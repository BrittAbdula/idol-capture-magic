import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { billingEvents, concepts, generations, groups, members, users } from "../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../db/test-d1.js";

describe("admin APIs", () => {
  let client: TestDatabaseClient;
  let cookieFor: (userId: string) => Promise<string>;

  beforeEach(async () => {
    client = await createTestD1DatabaseClient();
    const auth = createLucia(client, false);
    cookieFor = async (userId: string) => {
      const session = await auth.createSession(userId, {});
      return auth.createSessionCookie(session.id).serialize();
    };

    const now = Math.floor(Date.now() / 1000);

    await client.db
      .insert(groups)
      .values({
        id: "group_admin_test",
        slug: "admin-test",
        name: "Admin Test",
        themeColor: "#111111",
        popularityRank: 1
      })
      .run();
    await client.db
      .insert(members)
      .values({
        id: "member_admin_test",
        groupId: "group_admin_test",
        slug: "member",
        name: "Member",
        silhouetteImage: "/placeholders/silhouette_1.png",
        todoLicensedAsset: true
      })
      .run();
    await client.db
      .insert(concepts)
      .values({
        id: "concept_admin_test",
        slug: "admin-test-concept",
        name: "Admin Test Concept",
        format: "selca",
        promptTemplate: "A safe test prompt.",
        styleTokens: JSON.stringify(["studio"]),
        sampleOutputUrl: "/samples/polaroid-selca.png",
        premium: false
      })
      .run();
    await client.db
      .insert(users)
      .values([
        {
          id: "admin_user",
          email: "auroroa@gmail.com",
          handle: "auroroa",
          locale: "en",
          plan: "pro",
          dailyQuotaUsed: 0,
          dailyQuotaResetAt: now + 86_400,
          createdAt: now - 3_600
        },
        {
          id: "active_user",
          email: "active@example.com",
          handle: "active",
          locale: "en",
          plan: "free",
          dailyQuotaUsed: 1,
          dailyQuotaResetAt: now + 86_400,
          createdAt: now - 7_200
        },
        {
          id: "older_user",
          email: "older@example.com",
          handle: "older",
          locale: "en",
          plan: "plus",
          dailyQuotaUsed: 0,
          dailyQuotaResetAt: now + 86_400,
          createdAt: now - 12 * 86_400
        }
      ])
      .run();
    await client.db
      .insert(generations)
      .values([
        {
          id: "generation_recent_success",
          userId: "active_user",
          conceptId: "concept_admin_test",
          memberId: "member_admin_test",
          format: "selca",
          status: "succeeded",
          inputImageRef: "uploads/recent-input.png",
          inputImageRefs: JSON.stringify([
            "uploads/recent-input.png",
            "uploads/recent-input-2.png"
          ]),
          outputImageRef: "outputs/recent-output.png",
          cost: 0.04,
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: now - 600
        },
        {
          id: "generation_recent_failed",
          userId: "active_user",
          conceptId: "concept_admin_test",
          memberId: "member_admin_test",
          format: "photocard",
          status: "failed",
          inputImageRef: "uploads/failed-input.png",
          outputImageRef: null,
          cost: null,
          watermarkLevel: "visible",
          isPublic: false,
          createdAt: now - 1_200
        },
        {
          id: "generation_stale_running",
          userId: "active_user",
          conceptId: "concept_admin_test",
          memberId: "member_admin_test",
          format: "selca",
          status: "running",
          inputImageRef: "uploads/running-input.png",
          outputImageRef: null,
          cost: null,
          watermarkLevel: "visible",
          isPublic: false,
          createdAt: now - 7_200
        },
        {
          id: "generation_old",
          userId: "older_user",
          conceptId: "concept_admin_test",
          memberId: "member_admin_test",
          format: "strip",
          status: "succeeded",
          inputImageRef: "uploads/old-input.png",
          outputImageRef: "outputs/old-output.png",
          cost: 0.03,
          watermarkLevel: "small",
          isPublic: false,
          createdAt: now - 10 * 86_400
        }
      ])
      .run();
    await client.db
      .insert(billingEvents)
      .values([
        {
          id: "billing_checkout_created",
          userId: "active_user",
          eventType: "checkout_created",
          plan: "plus",
          billingCycle: "monthly",
          source: "upgrade_dialog",
          triggerSurface: "result_watermark",
          checkoutFlow: "resumed_after_sign_in",
          stripeCheckoutSessionId: "cs_admin_test",
          createdAt: now - 900
        },
        {
          id: "billing_checkout_failed",
          userId: "active_user",
          eventType: "checkout_failed",
          plan: "pro",
          billingCycle: "annual",
          source: "pricing_page",
          triggerSurface: "pricing_page",
          errorCode: "checkout_unavailable",
          createdAt: now - 800
        },
        {
          id: "billing_checkout_recovered",
          userId: "active_user",
          eventType: "checkout_retry_succeeded",
          plan: "plus",
          billingCycle: "monthly",
          source: "upgrade_dialog",
          triggerSurface: "result_quota",
          stripeCheckoutSessionId: "cs_admin_recovered",
          createdAt: now - 700
        },
        {
          id: "billing_checkout_hd_download",
          userId: "active_user",
          eventType: "checkout_created",
          plan: "pro",
          billingCycle: "monthly",
          source: "upgrade_dialog",
          triggerSurface: "result_hd_download",
          stripeCheckoutSessionId: "cs_admin_hd",
          createdAt: now - 650
        },
        {
          id: "billing_subscription_updated",
          userId: "active_user",
          eventType: "webhook_subscription_updated",
          plan: "plus",
          stripeCustomerId: "cus_admin_test",
          stripeSubscriptionId: "sub_admin_test",
          createdAt: now - 600
        },
        {
          id: "billing_webhook_ignored",
          eventType: "webhook_ignored",
          createdAt: now - 500
        }
      ])
      .run();
  });

  afterEach(async () => {
    await client.dispose();
  });

  test("rejects non-admin users", async () => {
    const auth = createLucia(client, false);
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/api/admin/overview", {
      headers: { Cookie: await cookieFor("active_user") }
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "admin_required" });
  });

  test("returns admin overview metrics and recent active users", async () => {
    const auth = createLucia(client, false);
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/api/admin/overview", {
      headers: { Cookie: await cookieFor("admin_user") }
    });
    const body = (await response.json()) as {
      stats: {
        registeredLast24h: number;
        registeredLast7d: number;
        registeredTotal: number;
        paidUsersTotal: number;
        generationsLast24h: number;
        generationsLast7d: number;
        generationsTotal: number;
        succeededLast7d: number;
        failedLast7d: number;
        publicGenerationsLast7d: number;
        costUsdLast7d: number;
        runningGenerationsTotal: number;
        stalePendingGenerationsTotal: number;
        checkoutCreatedLast7d: number;
        checkoutFailedLast7d: number;
        checkoutRecoveredLast7d: number;
        checkoutUpgradeDialogLast7d: number;
        checkoutPricingPageLast7d: number;
        checkoutResumedAfterSignInLast7d: number;
        checkoutWatermarkLast7d: number;
        checkoutHdDownloadLast7d: number;
        checkoutQuotaLast7d: number;
        subscriptionUpdatedLast7d: number;
        subscriptionDeletedLast7d: number;
        billingWebhookIgnoredLast7d: number;
      };
      activeUsers: Array<{
        id: string;
        email: string;
        generationCount: number;
        succeededCount: number;
        failedCount: number;
        recentOutputUrl: string | null;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.stats.registeredLast24h).toBe(2);
    expect(body.stats.registeredLast7d).toBe(2);
    expect(body.stats.registeredTotal).toBe(3);
    expect(body.stats.paidUsersTotal).toBe(2);
    expect(body.stats.generationsLast24h).toBe(3);
    expect(body.stats.generationsLast7d).toBe(3);
    expect(body.stats.generationsTotal).toBe(4);
    expect(body.stats.succeededLast7d).toBe(1);
    expect(body.stats.failedLast7d).toBe(1);
    expect(body.stats.publicGenerationsLast7d).toBe(1);
    expect(body.stats.costUsdLast7d).toBe(0.04);
    expect(body.stats.runningGenerationsTotal).toBe(1);
    expect(body.stats.stalePendingGenerationsTotal).toBe(1);
    expect(body.stats.checkoutCreatedLast7d).toBe(2);
    expect(body.stats.checkoutFailedLast7d).toBe(1);
    expect(body.stats.checkoutRecoveredLast7d).toBe(1);
    expect(body.stats.checkoutUpgradeDialogLast7d).toBe(3);
    expect(body.stats.checkoutPricingPageLast7d).toBe(0);
    expect(body.stats.checkoutResumedAfterSignInLast7d).toBe(1);
    expect(body.stats.checkoutWatermarkLast7d).toBe(1);
    expect(body.stats.checkoutHdDownloadLast7d).toBe(1);
    expect(body.stats.checkoutQuotaLast7d).toBe(1);
    expect(body.stats.subscriptionUpdatedLast7d).toBe(1);
    expect(body.stats.subscriptionDeletedLast7d).toBe(0);
    expect(body.stats.billingWebhookIgnoredLast7d).toBe(1);
    expect(body.activeUsers[0]).toMatchObject({
      id: "active_user",
      email: "active@example.com",
      generationCount: 3,
      succeededCount: 1,
      failedCount: 1,
      recentOutputUrl: "/storage/outputs/recent-output.png"
    });
  });

  test("cleans stale generations from the admin maintenance endpoint", async () => {
    const auth = createLucia(client, false);
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/api/admin/maintenance/cleanup-stale-generations", {
      method: "POST",
      headers: { Cookie: await cookieFor("admin_user") }
    });
    const body = (await response.json()) as {
      staleGenerations: number;
      refundedCredits: number;
      refundedUsers: number;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      staleGenerations: 1,
      refundedCredits: 1,
      refundedUsers: 1
    });
    const generation = await client.db
      .select()
      .from(generations)
      .where(eq(generations.id, "generation_stale_running"))
      .get();
    expect(generation?.status).toBe("failed");
    expect(generation?.errorMessage).toBe("Generation timed out before completion");
    const user = await client.db.select().from(users).where(eq(users.id, "active_user")).get();
    expect(user?.dailyQuotaUsed).toBe(0);
  });

  test("returns a selected user's recent uploaded and generated images", async () => {
    const auth = createLucia(client, false);
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/api/admin/users/active_user/assets", {
      headers: { Cookie: await cookieFor("admin_user") }
    });
    const body = (await response.json()) as {
      user: { id: string; email: string };
      items: Array<{
        id: string;
        inputUrl: string | null;
        inputUrls: string[];
        outputUrl: string | null;
        conceptName: string;
        memberName: string;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ id: "active_user", email: "active@example.com" });
    expect(body.items[0]).toMatchObject({
      id: "generation_recent_success",
      inputUrl: "/storage/uploads/recent-input.png",
      inputUrls: ["/storage/uploads/recent-input.png", "/storage/uploads/recent-input-2.png"],
      outputUrl: "/storage/outputs/recent-output.png",
      conceptName: "Admin Test Concept",
      memberName: "Member"
    });
    expect(body.items[1]).toMatchObject({
      id: "generation_recent_failed",
      inputUrl: "/storage/uploads/failed-input.png",
      inputUrls: ["/storage/uploads/failed-input.png"],
      outputUrl: null
    });
  });
});
