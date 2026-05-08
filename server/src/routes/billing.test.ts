import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { users } from "../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../db/test-d1.js";
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

class FailingBillingService extends FakeBillingService {
  async createCheckoutSession(_input: CheckoutInput): Promise<never> {
    throw new Error("Stripe checkout failed");
  }
}

class StaleCustomerBillingService extends FakeBillingService {
  calls: CheckoutInput[] = [];

  async createCheckoutSession(input: CheckoutInput) {
    this.calls.push(input);
    if (input.stripeCustomerId) {
      throw new Error("No such customer");
    }

    return {
      id: "cs_test_recovered",
      url: "https://checkout.stripe.test/recovered",
      customerId: "cus_recovered"
    };
  }
}

describe("billing routes", () => {
  let client: TestDatabaseClient;

  beforeEach(async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    client = await createTestD1DatabaseClient();
    await client.db
      .insert(users)
      .values({
        id: "user_123",
        email: "fan@example.com",
        handle: "fan-123",
        googleId: "google_123",
        locale: "en",
        plan: "free",
        dailyQuotaUsed: 0,
        dailyQuotaResetAt: 1_800_000_000,
        createdAt: 1_700_000_000
      })
      .run();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await client.dispose();
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
    const user = await client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.stripeCustomerId).toBe("cus_test_123");
  });

  test("returns a checkout error instead of an internal server error", async () => {
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      billing: new FailingBillingService()
    });

    const response = await app.request("/api/billing/checkout", {
      method: "POST",
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan: "plus" })
    });
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(502);
    expect(json.error).toBe("checkout_unavailable");
  });

  test("recovers checkout by replacing a stale Stripe customer id", async () => {
    await client.db
      .update(users)
      .set({ stripeCustomerId: "cus_stale" })
      .where(eq(users.id, "user_123"))
      .run();
    const billing = new StaleCustomerBillingService();
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      billing
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
    expect(json.url).toBe("https://checkout.stripe.test/recovered");
    expect(billing.calls.map((call) => call.stripeCustomerId ?? null)).toEqual(["cus_stale", null]);
    const user = await client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.stripeCustomerId).toBe("cus_recovered");
  });

  test("syncs subscription status from Stripe webhooks", async () => {
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      billing: new FakeBillingService()
    });
    await client.db
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
    const user = await client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.plan).toBe("plus");
    expect(user?.stripeSubscriptionId).toBe("sub_test_123");
  });
});
