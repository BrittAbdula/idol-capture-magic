import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { Lucia } from "lucia";

import type { DatabaseClient } from "../db/client.js";

export interface UserAttributes {
  email: string;
  handle: string;
  plan: "free" | "plus" | "pro";
  googleId: string | null;
}

export function createLucia(client: DatabaseClient, secureCookies: boolean): Lucia {
  const adapter = new BetterSqlite3Adapter(client.sqlite, {
    user: "users",
    session: "sessions"
  });

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: secureCookies,
        sameSite: "lax"
      }
    },
    getUserAttributes: (attributes) => {
      const userAttributes = attributes as Record<string, unknown>;
      return {
        email: String(userAttributes.email),
        handle: String(userAttributes.handle),
        plan: userAttributes.plan as "free" | "plus" | "pro",
        googleId: userAttributes.google_id ? String(userAttributes.google_id) : null
      };
    }
  });
}

export type Auth = ReturnType<typeof createLucia>;
