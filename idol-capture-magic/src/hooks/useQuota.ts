import { useAuth } from "@/hooks/useAuth";
import type { AuthQuota, AuthUser } from "@/api/client";

type QuotaPlan = AuthUser["plan"] | "guest";

const PLAN_LIMITS: Record<QuotaPlan, number> = {
  guest: 1,
  free: 3,
  plus: 30,
  pro: 200
} as const;

export function resolveQuotaState(user: AuthUser | null, quota: AuthQuota | null) {
  const plan = user?.plan ?? "guest";
  const total = quota?.limit ?? PLAN_LIMITS[plan];
  const remaining = quota?.remaining ?? total;
  const used = quota?.used ?? Math.max(0, total - remaining);

  return {
    plan,
    total,
    remaining,
    used,
    resetAt: quota?.resetAt ?? null
  };
}

export function useQuota() {
  const { user, quota, isLoading } = useAuth();
  const state = resolveQuotaState(user, quota);

  return {
    ...state,
    isLoading
  };
}
