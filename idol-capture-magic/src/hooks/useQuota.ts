import { useAuth } from "@/hooks/useAuth";

const PLAN_LIMITS = {
  free: 3,
  plus: 30,
  pro: 200
} as const;

export function useQuota() {
  const { user, isLoading } = useAuth();
  const plan = user?.plan ?? "free";
  const total = PLAN_LIMITS[plan];

  return {
    plan,
    total,
    remaining: total,
    isLoading
  };
}
