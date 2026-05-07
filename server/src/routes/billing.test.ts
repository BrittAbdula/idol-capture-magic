import { readFile } from "node:fs/promises";

import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { createDatabaseClient, type DatabaseClient } from "../db/client.js";
import { users } from "../db/schema.js";
import type {
  BillingService,
  CheckoutInput,
  PortalInput,
  BillingWebhookEvent
} from "../services/billing.js";

class FakeBillingService implements BillingService {
  async createCheckoutSession(input: CheckoutInput) {
    return {
      id: "cs_test_123",
      url: `https://checkout.stripe.test/${input.plan}`,
      customerId: input.stripeCustomerId ?? "cus_test_123"
    };
  }

  async createPortalSession(_input: PortalInput) {
    return {
      url: "https://billing.stripe.test/portal"
    };
  }

  async parseWebhook(_payload: string, _signature: string): Promise<BillingWebhookEvent> {
    return {
      type: "subscription_updated",
      stripeCustomerId: "cus_test_123",
      stripeSubscriptionId: "sub_test_123",
      plan: "plus",
      planRenewsAt: 1_800_000_000
    };
  }
}

describe("billing routes", () => {
  let client: DatabaseClient;

  beforeEach(async () => {
    client = createDatabaseClient(":memory:");
    client.sqlite.exec(await readFile(new URL("../db/migrations/0000_dizzy_karnak.sql", import.meta.url), "utf8"));
    client.db.insert(users).values({
      id: "user_123",
      email: "fan@example.com",
      handle: "fan-123",
      googleId: "google_123",
      locale: "en",
      plan: "free",
      dailyQuotaUsed: 0,
      dailyQuotaResetAt: 1_800_000_000,
      createdAt: 1_700_000_000
    }).run();
  });

  test("creates a checkout session for the authenticated user", async () => {
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      billing: new FakeBillingService()
    });

    const response = await app.request("/api/billing/checkout", {
      method: "POST",
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan: "plus" })
    });
    const json = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(json.url).toBe("https://checkout.stripe.test/plus");
    const user = client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.stripeCustomerId).toBe("cus_test_123");
  });

  test("syncs subscription status from Stripe webhooks", async () => {
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      billing: new FakeBillingService()
    });
    client.db
      .update(users)
      .set({ stripeCustomerId: "cus_test_123" })
      .where(eq(users.id, "user_123"))
      .run();

    const response = await app.request("/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "test_signature" },
      body: "{}"
    });

    expect(response.status).toBe(200);
    const user = client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.plan).toBe("plus");
    expect(user?.stripeSubscriptionId).toBe("sub_test_123");
  });
});
