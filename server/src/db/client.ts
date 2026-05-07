import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.js";

export interface DatabaseClient {
  sqlite: Database.Database;
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
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close()
  };
}
