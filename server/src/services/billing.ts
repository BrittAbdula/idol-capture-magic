import Stripe from "stripe";

export type PaidPlan = "plus" | "pro";
export type BillingCycle = "monthly" | "annual";
export type Plan = "free" | PaidPlan;

export interface CheckoutInput {
  userId: string;
  email: string;
  plan: PaidPlan;
  billingCycle: BillingCycle;
  source?: string | null;
  triggerSurface?: string | null;
  checkoutFlow?: string | null;
  stripeCustomerId?: string | null;
}

export interface PortalInput {
  stripeCustomerId: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
  customerId?: string | null;
}

export interface PortalSessionResult {
  url: string;
}

export interface BillingWebhookEvent {
  type: "subscription_updated" | "subscription_deleted" | "ignored";
  userId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  source?: string | null;
  triggerSurface?: string | null;
  checkoutFlow?: string | null;
  plan?: Plan;
  planRenewsAt?: number | null;
}

export interface BillingService {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult>;
  createPortalSession(input: PortalInput): Promise<PortalSessionResult>;
  parseWebhook(payload: string, signature: string): Promise<BillingWebhookEvent>;
}

export interface StripeBillingConfig {
  secretKey: string;
  webhookSecret: string;
  appOrigin: string;
  plusPriceId?: string | null;
  proPriceId?: string | null;
  plusMonthlyPriceId?: string | null;
  plusAnnualPriceId?: string | null;
  proMonthlyPriceId?: string | null;
  proAnnualPriceId?: string | null;
}

export class StripeBillingService implements BillingService {
  private readonly stripe: Stripe;
  private readonly priceByPlan: Record<PaidPlan, Record<BillingCycle, string | null>>;
  private readonly planByPrice: Map<string, PaidPlan>;

  constructor(private readonly config: StripeBillingConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2024-09-30.acacia",
      httpClient: Stripe.createFetchHttpClient()
    });
    this.priceByPlan = {
      plus: {
        monthly: config.plusMonthlyPriceId ?? config.plusPriceId ?? null,
        annual: config.plusAnnualPriceId ?? null
      },
      pro: {
        monthly: config.proMonthlyPriceId ?? config.proPriceId ?? null,
        annual: config.proAnnualPriceId ?? null
      }
    };
    this.planByPrice = new Map(
      Object.entries(this.priceByPlan).flatMap(([plan, prices]) =>
        Object.values(prices)
          .filter((priceId): priceId is string => Boolean(priceId))
          .map((priceId) => [priceId, plan as PaidPlan])
      )
    );
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult> {
    const priceId = this.priceByPlan[input.plan][input.billingCycle];
    if (!priceId) {
      throw new Error(`Missing Stripe price id for ${input.plan} ${input.billingCycle}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: input.stripeCustomerId ?? undefined,
      customer_email: input.stripeCustomerId ? undefined : input.email,
      client_reference_id: input.userId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata: {
        userId: input.userId,
        plan: input.plan,
        billingCycle: input.billingCycle,
        source: input.source ?? "",
        triggerSurface: input.triggerSurface ?? "",
        checkoutFlow: input.checkoutFlow ?? ""
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          plan: input.plan,
          billingCycle: input.billingCycle,
          source: input.source ?? "",
          triggerSurface: input.triggerSurface ?? "",
          checkoutFlow: input.checkoutFlow ?? ""
        }
      },
      success_url: `${this.config.appOrigin}/me?billing=success`,
      cancel_url: `${this.config.appOrigin}/pricing?billing=cancelled`
    });

    return {
      id: session.id,
      url: session.url ?? `${this.config.appOrigin}/pricing`,
      customerId: typeof session.customer === "string" ? session.customer : null
    };
  }

  async createPortalSession(input: PortalInput): Promise<PortalSessionResult> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.stripeCustomerId,
      return_url: `${this.config.appOrigin}/me/settings`
    });

    return { url: session.url };
  }

  async parseWebhook(payload: string, signature: string): Promise<BillingWebhookEvent> {
    const event = await this.stripe.webhooks.constructEventAsync(
      payload,
      signature,
      this.config.webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = toPlan(session.metadata?.plan);
      return {
        type: plan ? "subscription_updated" : "ignored",
        userId: session.client_reference_id ?? session.metadata?.userId ?? null,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : null,
        source: safeMetadataValue(session.metadata?.source),
        triggerSurface: safeMetadataValue(session.metadata?.triggerSurface),
        checkoutFlow: safeMetadataValue(session.metadata?.checkoutFlow),
        plan: plan ?? undefined
      };
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const plan = this.planByPrice.get(subscription.items.data[0]?.price.id ?? "");
      return {
        type: plan ? "subscription_updated" : "ignored",
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        source: safeMetadataValue(subscription.metadata?.source),
        triggerSurface: safeMetadataValue(subscription.metadata?.triggerSurface),
        checkoutFlow: safeMetadataValue(subscription.metadata?.checkoutFlow),
        plan,
        planRenewsAt: subscription.current_period_end ?? null
      };
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      return {
        type: "subscription_deleted",
        stripeCustomerId:
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        source: safeMetadataValue(subscription.metadata?.source),
        triggerSurface: safeMetadataValue(subscription.metadata?.triggerSurface),
        checkoutFlow: safeMetadataValue(subscription.metadata?.checkoutFlow),
        plan: "free",
        planRenewsAt: null
      };
    }

    return { type: "ignored" };
  }
}

function toPlan(value: string | undefined): PaidPlan | null {
  return value === "plus" || value === "pro" ? value : null;
}

function safeMetadataValue(value: string | undefined): string | null {
  if (!value || !/^[a-z0-9_-]{1,80}$/.test(value)) {
    return null;
  }

  return value;
}
