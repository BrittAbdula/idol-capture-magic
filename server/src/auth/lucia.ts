import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { Lucia } from "lucia";

import type { DatabaseClient } from "../db/client.js";
import { RemoteSQLiteAdapter } from "./remote-sqlite-adapter.js";

export interface UserAttributes {
  email: string;
  handle: string;
  plan: "free" | "plus" | "pro";
  googleId: string | null;
}

export function createLucia(client: DatabaseClient, secureCookies: boolean): Lucia {
  const tableNames = {
    user: "users",
    session: "sessions"
  };
  const adapter =
    client.kind === "d1"
      ? new RemoteSQLiteAdapter(assertD1Client(client), tableNames)
      : new BetterSqlite3Adapter(assertSqliteClient(client), tableNames);

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

function assertSqliteClient(client: DatabaseClient) {
  if (!client.sqlite) {
    throw new Error("SQLite client is not configured");
  }
  return client.sqlite;
}

function assertD1Client(client: DatabaseClient) {
  if (!client.d1) {
    throw new Error("D1 client is not configured");
  }
  return client.d1;
}
