import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me,
    retry: false
  });

  return {
    user: query.data?.user ?? null,
    isAuthenticated: Boolean(query.data?.user),
    isLoading: query.isLoading,
    error: query.error
  };
}
