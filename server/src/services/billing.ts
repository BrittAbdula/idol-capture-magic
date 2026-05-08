import Stripe from "stripe";

export type PaidPlan = "plus" | "pro";
export type Plan = "free" | PaidPlan;

export interface CheckoutInput {
  userId: string;
  email: string;
  plan: PaidPlan;
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
  plusPriceId: string;
  proPriceId: string;
}

export class StripeBillingService implements BillingService {
  private readonly stripe: Stripe;
  private readonly priceByPlan: Record<PaidPlan, string>;
  private readonly planByPrice: Map<string, PaidPlan>;

  constructor(private readonly config: StripeBillingConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: "2024-09-30.acacia",
      httpClient: Stripe.createFetchHttpClient()
    });
    this.priceByPlan = {
      plus: config.plusPriceId,
      pro: config.proPriceId
    };
    this.planByPrice = new Map([
      [config.plusPriceId, "plus"],
      [config.proPriceId, "pro"]
    ]);
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: input.stripeCustomerId ?? undefined,
      customer_email: input.stripeCustomerId ? undefined : input.email,
      client_reference_id: input.userId,
      line_items: [
        {
          price: this.priceByPlan[input.plan],
          quantity: 1
        }
      ],
      metadata: {
        userId: input.userId,
        plan: input.plan
      },
      subscription_data: {
        metadata: {
          userId: input.userId,
          plan: input.plan
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
