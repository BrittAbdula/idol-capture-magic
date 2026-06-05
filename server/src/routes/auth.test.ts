import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { users } from "../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../db/test-d1.js";

describe("auth routes", () => {
  let client: TestDatabaseClient;

  beforeEach(async () => {
    client = await createTestD1DatabaseClient();
  });

  afterEach(async () => {
    client.close();
    await client.dispose();
  });

  test("returns authenticated user quota from /auth/me", async () => {
    const now = Math.floor(Date.now() / 1000);
    await client.db
      .insert(users)
      .values({
        id: "user_quota",
        email: "quota@example.com",
        handle: "quota",
        locale: "en",
        plan: "plus",
        dailyQuotaUsed: 7,
        dailyQuotaResetAt: now + 86_400,
        createdAt: now - 3_600
      })
      .run();

    const auth = createLucia(client, false);
    const session = await auth.createSession("user_quota", {});
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/auth/me", {
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize()
      }
    });
    const body = (await response.json()) as {
      user: { id: string; plan: string } | null;
      quota: { limit: number; used: number; remaining: number; resetAt: number } | null;
    };

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ id: "user_quota", plan: "plus" });
    expect(body.quota).toMatchObject({
      limit: 30,
      used: 7,
      remaining: 23,
      resetAt: now + 86_400
    });
  });

  test("normalizes expired quota before returning /auth/me", async () => {
    const now = Math.floor(Date.now() / 1000);
    await client.db
      .insert(users)
      .values({
        id: "user_expired_quota",
        email: "expired@example.com",
        handle: "expired",
        locale: "en",
        plan: "free",
        dailyQuotaUsed: 3,
        dailyQuotaResetAt: now - 60,
        createdAt: now - 3_600
      })
      .run();

    const auth = createLucia(client, false);
    const session = await auth.createSession("user_expired_quota", {});
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });

    const response = await app.request("/auth/me", {
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize()
      }
    });
    const body = (await response.json()) as {
      quota: { limit: number; used: number; remaining: number; resetAt: number } | null;
    };

    expect(response.status).toBe(200);
    expect(body.quota).toMatchObject({
      limit: 3,
      used: 0,
      remaining: 3
    });
    expect(body.quota?.resetAt).toBeGreaterThan(now);
  });
});
