import { Hono } from "hono";
import { cors } from "hono/cors";

import type { GoogleOAuthService } from "./auth/google.js";
import type { Auth } from "./auth/lucia.js";
import type { DatabaseClient } from "./db/client.js";
import { createAuthRoutes } from "./routes/auth.js";

export interface CreateAppOptions {
  publicAppOrigin: string;
  auth?: Auth;
  client?: DatabaseClient;
  google?: GoogleOAuthService;
  secureCookies?: boolean;
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
