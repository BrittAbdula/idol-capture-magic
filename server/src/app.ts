import { Hono } from "hono";
import { cors } from "hono/cors";

import type { GoogleOAuthService } from "./auth/google.js";
import type { Auth } from "./auth/lucia.js";
import type { DatabaseClient } from "./db/client.js";
import type { GenerationProvider } from "./services/generation/provider.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createGenerateRoutes } from "./routes/generate.js";
import type { StorageService } from "./services/storage.js";

export interface CreateAppOptions {
  publicAppOrigin: string;
  auth?: Auth;
  client?: DatabaseClient;
  google?: GoogleOAuthService;
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
  if (options.client && options.generationProvider && options.storage) {
    app.route(
      "/api",
      createGenerateRoutes({
        client: options.client,
        provider: options.generationProvider,
        storage: options.storage,
        auth: options.auth,
        tempDir: options.tempDir,
        publicDir: options.publicDir
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
