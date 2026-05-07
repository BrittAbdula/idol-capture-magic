import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export function AuthStatus() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Checking session</span>;
  }

  if (!user) {
    return (
      <a href="/auth/google" className="text-xs font-medium text-idol-gold">
        Guest mode
      </a>
    );
  }

  return (
    <Link to="/me" className="text-xs font-medium text-idol-gold">
      {user.handle} · {user.plan}
    </Link>
  );
}
