import { eq } from "drizzle-orm";

import type { DatabaseClient } from "../db/client.js";
import { users, type User } from "../db/schema.js";

export type Plan = "free" | "plus" | "pro";

const PLAN_LIMITS: Record<Plan, number> = {
  free: 3,
  plus: 30,
  pro: 200
};

export class QuotaExceededError extends Error {
  constructor() {
    super("Daily quota exhausted");
    this.name = "QuotaExceededError";
  }
}

export function getDailyQuotaLimit(plan: Plan): number {
  return PLAN_LIMITS[plan];
}

export function getNextQuotaResetAt(now = new Date()): number {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return Math.floor(reset.getTime() / 1000);
}

export function normalizeQuota(user: User, now = new Date()): User {
  const nowUnix = Math.floor(now.getTime() / 1000);
  if (user.dailyQuotaResetAt > nowUnix) {
    return user;
  }

  return {
    ...user,
    dailyQuotaUsed: 0,
    dailyQuotaResetAt: getNextQuotaResetAt(now)
  };
}

export async function getUserQuota(
  client: DatabaseClient,
  userId: string,
  now = new Date()
): Promise<{ limit: number; used: number; remaining: number; resetAt: number }> {
  const user = await client.db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw new Error("User not found");
  }

  const normalized = normalizeQuota(user, now);
  if (normalized !== user) {
    await client.db
      .update(users)
      .set({
        dailyQuotaUsed: normalized.dailyQuotaUsed,
        dailyQuotaResetAt: normalized.dailyQuotaResetAt
      })
      .where(eq(users.id, userId))
      .run();
  }

  const limit = getDailyQuotaLimit(normalized.plan);
  const remaining = Math.max(0, limit - normalized.dailyQuotaUsed);

  return {
    limit,
    used: normalized.dailyQuotaUsed,
    remaining,
    resetAt: normalized.dailyQuotaResetAt
  };
}

export async function consumeUserQuota(
  client: DatabaseClient,
  userId: string,
  now = new Date()
): Promise<{ limit: number; used: number; remaining: number; resetAt: number }> {
  const quota = await getUserQuota(client, userId, now);
  if (quota.remaining <= 0) {
    throw new QuotaExceededError();
  }

  const used = quota.used + 1;
  await client.db.update(users).set({ dailyQuotaUsed: used }).where(eq(users.id, userId)).run();

  return {
    ...quota,
    used,
    remaining: quota.limit - used
  };
}
