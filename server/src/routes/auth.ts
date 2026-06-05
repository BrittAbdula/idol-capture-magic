import { eq } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { generateIdFromEntropySize } from "lucia";

import type { GoogleOAuthService, GoogleProfile } from "../auth/google.js";
import type { Auth } from "../auth/lucia.js";
import type { DatabaseClient } from "../db/client.js";
import { users, type User } from "../db/schema.js";
import { jsonError } from "../lib/http.js";
import { getNextQuotaResetAt, getUserQuota } from "../services/quota.js";

const GOOGLE_STATE_COOKIE = "idolbooth_google_oauth_state";
const GOOGLE_VERIFIER_COOKIE = "idolbooth_google_oauth_verifier";

export interface AuthRouteDeps {
  auth?: Auth;
  client?: DatabaseClient;
  google?: GoogleOAuthService;
  publicAppOrigin: string;
  secureCookies?: boolean;
}

function setSerializedCookie(context: Context, cookie: { serialize(): string }) {
  context.header("Set-Cookie", cookie.serialize(), { append: true });
}

function createHandle(email: string): string {
  const prefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${prefix || "fan"}-${generateIdFromEntropySize(6)}`;
}

async function upsertGoogleUser(client: DatabaseClient, profile: GoogleProfile): Promise<User> {
  const byGoogleId = await client.db
    .select()
    .from(users)
    .where(eq(users.googleId, profile.sub))
    .get();
  if (byGoogleId) {
    return byGoogleId;
  }

  const byEmail = await client.db.select().from(users).where(eq(users.email, profile.email)).get();
  if (byEmail) {
    await client.db
      .update(users)
      .set({ googleId: profile.sub })
      .where(eq(users.id, byEmail.id))
      .run();
    return { ...byEmail, googleId: profile.sub };
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const user: User = {
    id: generateIdFromEntropySize(16),
    email: profile.email,
    handle: createHandle(profile.email),
    googleId: profile.sub,
    biasGroupId: null,
    biasMemberId: null,
    locale: "en",
    plan: "free",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    planRenewsAt: null,
    dailyQuotaUsed: 0,
    dailyQuotaResetAt: getNextQuotaResetAt(),
    createdAt: nowUnix
  };

  await client.db.insert(users).values(user).run();
  return user;
}

function requireAuthDeps(
  deps: AuthRouteDeps
): deps is AuthRouteDeps & { auth: Auth; client: DatabaseClient; google: GoogleOAuthService } {
  return Boolean(deps.auth && deps.client && deps.google);
}

export function createAuthRoutes(deps: AuthRouteDeps): Hono {
  const app = new Hono();

  app.get("/google", async (c) => {
    if (!deps.google) {
      return jsonError(c, 503, "auth_unavailable");
    }

    const session = await deps.google.createAuthorizationSession();
    const cookieOptions = {
      httpOnly: true,
      secure: Boolean(deps.secureCookies),
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 10
    };
    setCookie(c, GOOGLE_STATE_COOKIE, session.state, cookieOptions);
    setCookie(c, GOOGLE_VERIFIER_COOKIE, session.codeVerifier, cookieOptions);

    return c.redirect(session.url.toString());
  });

  app.get("/google/callback", async (c) => {
    if (!requireAuthDeps(deps)) {
      return jsonError(c, 503, "auth_unavailable");
    }

    const code = c.req.query("code");
    const state = c.req.query("state");
    const storedState = getCookie(c, GOOGLE_STATE_COOKIE);
    const codeVerifier = getCookie(c, GOOGLE_VERIFIER_COOKIE);

    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
      return jsonError(c, 400, "invalid_oauth_state");
    }

    const profile = await deps.google.exchangeCode(code, codeVerifier);
    const user = await upsertGoogleUser(deps.client, profile);
    const session = await deps.auth.createSession(user.id, {});
    setSerializedCookie(c, deps.auth.createSessionCookie(session.id));

    return c.redirect(`${deps.publicAppOrigin}/me`);
  });

  app.post("/logout", async (c) => {
    if (!deps.auth) {
      return jsonError(c, 503, "auth_unavailable");
    }

    const sessionId = deps.auth.readSessionCookie(c.req.header("Cookie") ?? "");
    if (sessionId) {
      await deps.auth.invalidateSession(sessionId);
    }
    setSerializedCookie(c, deps.auth.createBlankSessionCookie());
    return c.json({ ok: true });
  });

  app.get("/me", async (c) => {
    if (!deps.auth) {
      return c.json({ user: null, quota: null });
    }

    const sessionId = deps.auth.readSessionCookie(c.req.header("Cookie") ?? "");
    if (!sessionId) {
      return c.json({ user: null, quota: null });
    }

    const { user, session } = await deps.auth.validateSession(sessionId);
    if (!session || !user) {
      setSerializedCookie(c, deps.auth.createBlankSessionCookie());
      return c.json({ user: null, quota: null });
    }

    if (session.fresh) {
      setSerializedCookie(c, deps.auth.createSessionCookie(session.id));
    }

    const quota = deps.client ? await getUserQuota(deps.client, user.id) : null;

    return c.json({ user, quota });
  });

  return app;
}
