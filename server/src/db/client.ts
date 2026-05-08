import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import { D1BindingClient, type D1DatabaseBinding } from "./d1-binding.js";
import { RemoteD1HttpClient, type RemoteD1Options } from "./d1-http.js";
import * as schema from "./schema.js";

export interface DatabaseClient {
  d1: D1QueryClient;
  db: DrizzleD1Database<typeof schema>;
  close: () => void;
}

export interface D1QueryResult {
  rows: unknown;
}

export interface D1QueryClient {
  query: (
    sql: string,
    params: unknown[],
    method: "run" | "all" | "values" | "get"
  ) => Promise<D1QueryResult>;
  batch: (
    queries: Array<{ sql: string; params: unknown[]; method: "run" | "all" | "values" | "get" }>
  ) => Promise<D1QueryResult[]>;
  get: <T>(sql: string, params: unknown[]) => Promise<T | null>;
  getAll: <T>(sql: string, params: unknown[]) => Promise<T[]>;
  execute: (sql: string, params: unknown[]) => Promise<void>;
}

export function createD1DatabaseClient(options: RemoteD1Options): DatabaseClient {
  const binding = new RemoteD1HttpClient(options);
  return createDatabaseClientFromD1Binding(binding, binding);
}

export function createDatabaseClientFromD1Binding(
  binding: D1DatabaseBinding,
  d1: D1QueryClient = new D1BindingClient(binding)
): DatabaseClient {
  return {
    d1,
    db: drizzle(binding as never, { schema }),
    close: () => undefined
  };
}
