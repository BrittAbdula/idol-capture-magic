import { Hono } from "hono";
import { cors } from "hono/cors";

import type { GoogleOAuthService } from "./auth/google.js";
import type { Auth } from "./auth/lucia.js";
import type { DatabaseClient } from "./db/client.js";
import type { BillingService } from "./services/billing.js";
import type { GenerationProvider } from "./services/generation/provider.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createBinderRoutes } from "./routes/binder.js";
import { createBillingRoutes, createStripeWebhookRoutes } from "./routes/billing.js";
import { createDomainRoutes } from "./routes/domain.js";
import { createGenerateRoutes } from "./routes/generate.js";
import type { StorageService } from "./services/storage.js";

export interface CreateAppOptions {
  publicAppOrigin: string;
  auth?: Auth;
  client?: DatabaseClient;
  google?: GoogleOAuthService;
  billing?: BillingService;
  generationProvider?: GenerationProvider;
  storage?: StorageService;
  secureCookies?: boolean;
  tempDir?: string;
  publicDir?: string;
}

export function createApp(options: CreateAppOptions): Hono {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: options.publicAppOrigin,
      credentials: true
    })
  );

  app.get("/health", (c) => c.json({ ok: true }));
  if (options.storage) {
    app.get("/storage/*", async (c) => {
      const key = c.req.path.replace(/^\/storage\//, "");
      try {
        const buffer = await options.storage?.readBuffer(key);
        if (!buffer) {
          return c.notFound();
        }
        return new Response(buffer, {
          headers: {
            "Content-Type": contentTypeForKey(key),
            "Cache-Control": "public, max-age=31536000, immutable"
          }
        });
      } catch {
        return c.notFound();
      }
    });
  }
  if (options.client) {
    app.route("/api", createDomainRoutes({ client: options.client, storage: options.storage }));
    app.route(
      "/api/binder",
      createBinderRoutes({
        auth: options.auth,
        client: options.client,
        storage: options.storage
      })
    );
  }
  if (options.client && options.generationProvider && options.storage) {
    app.route(
      "/api",
      createGenerateRoutes({
        client: options.client,
        provider: options.generationProvider,
        storage: options.storage,
        auth: options.auth
      })
    );
  }
  if (options.client && options.billing) {
    app.route(
      "/api/billing",
      createBillingRoutes({
        auth: options.auth,
        billing: options.billing,
        client: options.client
      })
    );
    app.route(
      "/webhooks",
      createStripeWebhookRoutes({
        billing: options.billing,
        client: options.client
      })
    );
  }
  app.route(
    "/auth",
    createAuthRoutes({
      auth: options.auth,
      client: options.client,
      google: options.google,
      publicAppOrigin: options.publicAppOrigin,
      secureCookies: options.secureCookies
    })
  );

  return app;
}

function contentTypeForKey(key: string): string {
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (key.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/png";
}
