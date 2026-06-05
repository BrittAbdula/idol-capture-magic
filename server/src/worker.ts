import { createApp } from "./app.js";
import { GoogleOAuthService } from "./auth/google.js";
import { createLucia } from "./auth/lucia.js";
import { resolveGoogleRedirectUri } from "./auth/redirect.js";
import { parseWorkerEnv } from "./config/worker-env.js";
import { createDatabaseClientFromD1Binding } from "./db/client.js";
import type { D1DatabaseBinding } from "./db/d1-binding.js";
import { StripeBillingService } from "./services/billing.js";
import { KieImageProvider } from "./services/generation/kie.js";
import { reconcileRunningGenerations } from "./services/generation/reconcile.js";
import { cleanupStaleGenerations } from "./services/generation/stale.js";
import { createR2StorageService } from "./services/storage.js";

export interface WorkerBindings {
  DB: D1Database;
  STORAGE: R2Bucket;
  NODE_ENV?: string;
  PUBLIC_APP_ORIGIN?: string;
  PUBLIC_STORAGE_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  KIE_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PLUS_PRICE_ID?: string;
  STRIPE_PRO_PRICE_ID?: string;
  STRIPE_PLUS_MONTHLY_PRICE_ID?: string;
  STRIPE_PLUS_ANNUAL_PRICE_ID?: string;
  STRIPE_PRO_MONTHLY_PRICE_ID?: string;
  STRIPE_PRO_ANNUAL_PRICE_ID?: string;
}

export default {
  async fetch(request: Request, env: WorkerBindings, executionContext: ExecutionContext) {
    const config = parseWorkerEnv(env as unknown as Record<string, unknown>);
    const client = createDatabaseClientFromD1Binding(env.DB as unknown as D1DatabaseBinding);
    const auth = createLucia(client, config.NODE_ENV === "production");
    const google = new GoogleOAuthService({
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      redirectUri: resolveGoogleRedirectUri({
        configuredRedirectUri: config.GOOGLE_REDIRECT_URI,
        publicAppOrigin: config.PUBLIC_APP_ORIGIN,
        requestUrl: request.url
      })
    });
    const storage = createR2StorageService({
      bucket: env.STORAGE,
      publicBasePath: config.PUBLIC_STORAGE_ORIGIN
    });
    const billing = new StripeBillingService({
      secretKey: config.STRIPE_SECRET_KEY,
      webhookSecret: config.STRIPE_WEBHOOK_SECRET,
      appOrigin: config.PUBLIC_APP_ORIGIN,
      plusPriceId: config.STRIPE_PLUS_PRICE_ID,
      proPriceId: config.STRIPE_PRO_PRICE_ID,
      plusMonthlyPriceId: config.STRIPE_PLUS_MONTHLY_PRICE_ID,
      plusAnnualPriceId: config.STRIPE_PLUS_ANNUAL_PRICE_ID,
      proMonthlyPriceId: config.STRIPE_PRO_MONTHLY_PRICE_ID,
      proAnnualPriceId: config.STRIPE_PRO_ANNUAL_PRICE_ID
    });
    const generationProvider = new KieImageProvider({
      apiKey: config.KIE_API_KEY
    });
    const app = createApp({
      publicAppOrigin: config.PUBLIC_APP_ORIGIN,
      auth,
      client,
      google,
      billing,
      generationProvider,
      storage,
      secureCookies: config.NODE_ENV === "production"
    });

    return app.fetch(request, env, executionContext);
  },

  async scheduled(_event: ScheduledController, env: WorkerBindings) {
    const config = parseWorkerEnv(env as unknown as Record<string, unknown>);
    const client = createDatabaseClientFromD1Binding(env.DB as unknown as D1DatabaseBinding);
    const storage = createR2StorageService({
      bucket: env.STORAGE,
      publicBasePath: config.PUBLIC_STORAGE_ORIGIN
    });
    const generationProvider = new KieImageProvider({
      apiKey: config.KIE_API_KEY
    });
    const reconcileResult = await reconcileRunningGenerations({
      client,
      provider: generationProvider,
      storage
    });
    if (
      reconcileResult.succeeded > 0 ||
      reconcileResult.failed > 0 ||
      reconcileResult.errors > 0
    ) {
      console.warn("Reconciled running generations", reconcileResult);
    }

    const result = await cleanupStaleGenerations(client);
    if (result.staleGenerations > 0) {
      console.warn("Cleaned up stale generations", result);
    }
  }
};
