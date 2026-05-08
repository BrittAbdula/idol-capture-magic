import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy";

import { RemoteD1HttpClient, type RemoteD1Options } from "./d1-http.js";
import * as schema from "./schema.js";

export interface DatabaseClient {
  kind: "sqlite" | "d1";
  sqlite: Database.Database;
  d1?: RemoteD1HttpClient;
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
}

export function resolveSqlitePath(databaseUrl: string): string {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

export function createDatabaseClient(databaseUrl: string): DatabaseClient {
  const sqlitePath = resolveSqlitePath(databaseUrl);
  if (sqlitePath !== ":memory:") {
    mkdirSync(path.dirname(sqlitePath), { recursive: true });
  }

  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");

  return {
    kind: "sqlite",
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close()
  };
}

export function createD1DatabaseClient(options: RemoteD1Options): DatabaseClient {
  const d1 = new RemoteD1HttpClient(options);

  return {
    kind: "d1",
    sqlite: undefined as unknown as Database.Database,
    d1,
    db: drizzleProxy(
      (sql, params, method) => d1.query(sql, params, method) as Promise<{ rows: never[] }>,
      (queries) => d1.batch(queries) as Promise<Array<{ rows: never[] }>>,
      {
        schema
      }
    ) as unknown as BetterSQLite3Database<typeof schema>,
    close: () => undefined
  };
}
