import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { users, type User } from "../db/schema.js";
import { jsonError } from "../lib/http.js";
import type { BillingService, BillingWebhookEvent } from "../services/billing.js";

const CheckoutSchema = z.object({
  plan: z.enum(["plus", "pro"])
});

interface BillingRouteDeps {
  auth?: Auth;
  billing: BillingService;
  client: DatabaseClient;
}

async function currentUser(
  deps: BillingRouteDeps,
  cookieHeader: string | undefined
): Promise<User | null> {
  if (!deps.auth || !cookieHeader) {
    return null;
  }

  const sessionId = deps.auth.readSessionCookie(cookieHeader);
  if (!sessionId) {
    return null;
  }

  const { user } = await deps.auth.validateSession(sessionId);
  if (!user) {
    return null;
  }

  return (await deps.client.db.select().from(users).where(eq(users.id, user.id)).get()) ?? null;
}

async function syncSubscriptionEvent(
  client: DatabaseClient,
  event: BillingWebhookEvent
): Promise<void> {
  if (event.type === "ignored") {
    return;
  }

  const plan = event.type === "subscription_deleted" ? "free" : event.plan;
  const updates = {
    plan,
    stripeCustomerId: event.stripeCustomerId ?? undefined,
    stripeSubscriptionId: event.stripeSubscriptionId ?? undefined,
    planRenewsAt: event.planRenewsAt ?? null
  };

  if (event.userId) {
    await client.db.update(users).set(updates).where(eq(users.id, event.userId)).run();
    return;
  }

  if (event.stripeCustomerId) {
    await client.db
      .update(users)
      .set(updates)
      .where(eq(users.stripeCustomerId, event.stripeCustomerId))
      .run();
  }
}

export function createBillingRoutes(deps: BillingRouteDeps): Hono {
  const app = new Hono();

  app.post("/checkout", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }

    const parsed = CheckoutSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return jsonError(c, 400, "invalid_checkout_request");
    }

    let session;
    try {
      session = await deps.billing.createCheckoutSession({
        userId: user.id,
        email: user.email,
        plan: parsed.data.plan,
        stripeCustomerId: user.stripeCustomerId
      });
    } catch {
      return jsonError(c, 502, "checkout_unavailable");
    }

    if (session.customerId && session.customerId !== user.stripeCustomerId) {
      await deps.client.db
        .update(users)
        .set({ stripeCustomerId: session.customerId })
        .where(eq(users.id, user.id))
        .run();
    }

    return c.json({ id: session.id, url: session.url });
  });

  app.post("/portal", async (c) => {
    const user = await currentUser(deps, c.req.header("Cookie"));
    if (!user) {
      return jsonError(c, 401, "auth_required");
    }
    if (!user.stripeCustomerId) {
      return jsonError(c, 400, "missing_stripe_customer");
    }

    const session = await deps.billing.createPortalSession({
      stripeCustomerId: user.stripeCustomerId
    });

    return c.json({ url: session.url });
  });

  return app;
}

export function createStripeWebhookRoutes(
  deps: Pick<BillingRouteDeps, "billing" | "client">
): Hono {
  const app = new Hono();

  app.post("/stripe", async (c) => {
    const signature = c.req.header("stripe-signature");
    if (!signature) {
      return jsonError(c, 400, "missing_stripe_signature");
    }

    const event = await deps.billing.parseWebhook(await c.req.text(), signature);
    await syncSubscriptionEvent(deps.client, event);

    return c.json({ ok: true });
  });

  return app;
}
