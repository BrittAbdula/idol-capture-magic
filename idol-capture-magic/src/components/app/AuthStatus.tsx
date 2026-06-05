import { Link } from "react-router-dom";

import { getGoogleAuthUrl } from "@/api/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin";

export function AuthStatus() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Checking session</span>;
  }

  if (!user) {
    return (
      <a
        href={getGoogleAuthUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-idol-gold"
      >
        Guest mode
      </a>
    );
  }

  const fallback = (user.handle || user.email).slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {isAdminEmail(user.email) && (
        <Link
          to="/admin"
          className="inline-flex min-h-11 items-center text-xs font-semibold uppercase text-idol-gold"
        >
          Admin
        </Link>
      )}
      <Link
        to="/me"
        aria-label="Open my IdolBooth page"
        title={`${user.handle} · ${user.plan}`}
        className="group inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idol-gold focus-visible:ring-offset-2"
      >
        <Avatar className="h-9 w-9 border border-idol-gold/60 bg-white shadow-sm transition-transform group-hover:scale-105">
          <AvatarFallback className="bg-idol-gold text-xs font-semibold text-black">
            {fallback}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
