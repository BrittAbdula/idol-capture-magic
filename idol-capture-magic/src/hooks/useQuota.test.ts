import { describe, expect, test } from "vitest";

import { resolveQuotaState } from "@/hooks/useQuota";
import type { AuthQuota, AuthUser } from "@/api/client";

const freeUser: AuthUser = {
  id: "user_123",
  email: "fan@example.com",
  handle: "fan",
  plan: "free"
};

describe("resolveQuotaState", () => {
  test("uses guest defaults when no user is authenticated", () => {
    expect(resolveQuotaState(null, null)).toEqual({
      plan: "guest",
      total: 1,
      remaining: 1,
      used: 0,
      resetAt: null
    });
  });

  test("uses backend quota for authenticated users", () => {
    const quota: AuthQuota = {
      limit: 3,
      used: 2,
      remaining: 1,
      resetAt: 1_800_000_000
    };

    expect(resolveQuotaState(freeUser, quota)).toEqual({
      plan: "free",
      total: 3,
      remaining: 1,
      used: 2,
      resetAt: 1_800_000_000
    });
  });
});
