import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { billingEvents, users, type User } from "../db/schema.js";
import { jsonError } from "../lib/http.js";
import type { BillingService, BillingWebhookEvent } from "../services/billing.js";

const TelemetryKeySchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9_-]+$/)
  .nullable()
  .optional()
  .transform((value) => value || null);

const CheckoutSchema = z.object({
  plan: z.enum(["plus", "pro"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  source: TelemetryKeySchema,
  triggerSurface: TelemetryKeySchema,
  checkoutFlow: TelemetryKeySchema
});

interface BillingRouteDeps {
  auth?: Auth;
  billing: BillingService;
  client: DatabaseClient;
}

type BillingEventType =
  | "checkout_created"
  | "checkout_failed"
  | "checkout_retry_succeeded"
  | "webhook_subscription_updated"
  | "webhook_subscription_deleted"
  | "webhook_ignored";

interface BillingEventInput {
  userId?: string | null;
  eventType: BillingEventType;
  plan?: "free" | "plus" | "pro" | null;
  billingCycle?: "monthly" | "annual" | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
  source?: string | null;
  triggerSurface?: string | null;
  checkoutFlow?: string | null;
  errorCode?: string | null;
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
    await recordBillingEvent(client, {
      eventType: "webhook_ignored",
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
      stripeSubscriptionId: event.stripeSubscriptionId,
      source: event.source,
      triggerSurface: event.triggerSurface,
      checkoutFlow: event.checkoutFlow
    });
    return;
  }

  const plan = event.type === "subscription_deleted" ? "free" : event.plan;
  const eventType: BillingEventType =
    event.type === "subscription_deleted"
      ? "webhook_subscription_deleted"
      : "webhook_subscription_updated";
  const updates = {
    plan,
    stripeCustomerId: event.stripeCustomerId ?? undefined,
    stripeSubscriptionId: event.stripeSubscriptionId ?? undefined,
    planRenewsAt: event.planRenewsAt ?? null
  };

  if (event.userId) {
    await client.db.update(users).set(updates).where(eq(users.id, event.userId)).run();
    await recordBillingEvent(client, {
      eventType,
      userId: event.userId,
      plan,
      stripeCustomerId: event.stripeCustomerId,
      stripeSubscriptionId: event.stripeSubscriptionId,
      source: event.source,
      triggerSurface: event.triggerSurface,
      checkoutFlow: event.checkoutFlow
    });
    return;
  }

  let matchedUserId: string | null = event.userId ?? null;

  if (event.stripeCustomerId) {
    const matchedUser = await client.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, event.stripeCustomerId))
      .get();
    matchedUserId = matchedUser?.id ?? null;
    await client.db
      .update(users)
      .set(updates)
      .where(eq(users.stripeCustomerId, event.stripeCustomerId))
      .run();
  }
  await recordBillingEvent(client, {
    eventType,
    userId: matchedUserId,
    plan,
    stripeCustomerId: event.stripeCustomerId,
    stripeSubscriptionId: event.stripeSubscriptionId,
    source: event.source,
    triggerSurface: event.triggerSurface,
    checkoutFlow: event.checkoutFlow
  });
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
    let recoveredFromStaleCustomer = false;
    try {
      session = await deps.billing.createCheckoutSession({
        userId: user.id,
        email: user.email,
        plan: parsed.data.plan,
        billingCycle: parsed.data.billingCycle,
        source: parsed.data.source,
        triggerSurface: parsed.data.triggerSurface,
        checkoutFlow: parsed.data.checkoutFlow,
        stripeCustomerId: user.stripeCustomerId
      });
    } catch (error) {
      console.warn(
        "Stripe checkout failed",
        checkoutErrorDetails(error, parsed.data.plan, parsed.data.billingCycle, true)
      );
      if (!user.stripeCustomerId) {
        await recordBillingEvent(deps.client, {
          eventType: "checkout_failed",
          userId: user.id,
          plan: parsed.data.plan,
          billingCycle: parsed.data.billingCycle,
          source: parsed.data.source,
          triggerSurface: parsed.data.triggerSurface,
          checkoutFlow: parsed.data.checkoutFlow,
          stripeCustomerId: user.stripeCustomerId,
          errorCode: checkoutErrorCode(error)
        });
        return jsonError(c, 502, "checkout_unavailable");
      }

      try {
        session = await deps.billing.createCheckoutSession({
          userId: user.id,
          email: user.email,
          plan: parsed.data.plan,
          billingCycle: parsed.data.billingCycle,
          source: parsed.data.source,
          triggerSurface: parsed.data.triggerSurface,
          checkoutFlow: parsed.data.checkoutFlow,
          stripeCustomerId: null
        });
        recoveredFromStaleCustomer = true;
      } catch (retryError) {
        console.warn(
          "Stripe checkout retry failed",
          checkoutErrorDetails(retryError, parsed.data.plan, parsed.data.billingCycle, false)
        );
        await recordBillingEvent(deps.client, {
          eventType: "checkout_failed",
          userId: user.id,
          plan: parsed.data.plan,
          billingCycle: parsed.data.billingCycle,
          source: parsed.data.source,
          triggerSurface: parsed.data.triggerSurface,
          checkoutFlow: parsed.data.checkoutFlow,
          stripeCustomerId: user.stripeCustomerId,
          errorCode: checkoutErrorCode(retryError)
        });
        return jsonError(c, 502, "checkout_unavailable");
      }
    }

    if (session.customerId && session.customerId !== user.stripeCustomerId) {
      await deps.client.db
        .update(users)
        .set({ stripeCustomerId: session.customerId })
        .where(eq(users.id, user.id))
        .run();
    }

    await recordBillingEvent(deps.client, {
      eventType: recoveredFromStaleCustomer ? "checkout_retry_succeeded" : "checkout_created",
      userId: user.id,
      plan: parsed.data.plan,
      billingCycle: parsed.data.billingCycle,
      source: parsed.data.source,
      triggerSurface: parsed.data.triggerSurface,
      checkoutFlow: parsed.data.checkoutFlow,
      stripeCustomerId: session.customerId ?? user.stripeCustomerId,
      stripeCheckoutSessionId: session.id
    });

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

function checkoutErrorDetails(
  error: unknown,
  plan: "plus" | "pro",
  billingCycle: "monthly" | "annual",
  usedExistingCustomer: boolean
): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { plan, billingCycle, usedExistingCustomer, message: String(error) };
  }

  const details = error as Record<string, unknown>;
  return {
    plan,
    billingCycle,
    usedExistingCustomer,
    type: details.type,
    rawType: details.rawType,
    code: details.code,
    param: details.param,
    statusCode: details.statusCode,
    message: details.message
  };
}

function checkoutErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const details = error as Record<string, unknown>;
  if (typeof details.code === "string") {
    return details.code;
  }
  if (typeof details.type === "string") {
    return details.type;
  }
  return "unknown";
}

async function recordBillingEvent(client: DatabaseClient, input: BillingEventInput): Promise<void> {
  try {
    await client.db
      .insert(billingEvents)
      .values({
        id: randomUUID(),
        userId: input.userId ?? null,
        eventType: input.eventType,
        plan: input.plan ?? null,
        billingCycle: input.billingCycle ?? null,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        stripeCheckoutSessionId: input.stripeCheckoutSessionId ?? null,
        source: input.source ?? null,
        triggerSurface: input.triggerSurface ?? null,
        checkoutFlow: input.checkoutFlow ?? null,
        errorCode: input.errorCode ?? null,
        createdAt: Math.floor(Date.now() / 1000)
      })
      .run();
  } catch (error) {
    console.warn("Billing telemetry failed", {
      eventType: input.eventType,
      errorCode: checkoutErrorCode(error)
    });
  }
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
