import type { D1QueryClient, D1QueryResult } from "./client.js";
import type { D1DatabaseBinding, D1PreparedStatement } from "./d1-binding.js";

export type RemoteD1Method = "run" | "all" | "values" | "get";

export interface RemoteD1Query {
  sql: string;
  params: unknown[];
  method: RemoteD1Method;
}

export interface RemoteD1Options {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

interface CloudflareD1Error {
  code?: number;
  message?: string;
}

interface CloudflareD1Result {
  results?: unknown[] | { columns?: string[]; rows?: unknown[][] };
  success?: boolean;
  meta?: Record<string, unknown>;
}

interface CloudflareD1Response {
  success: boolean;
  errors?: CloudflareD1Error[];
  result?: CloudflareD1Result[] | CloudflareD1Result;
}

export class RemoteD1HttpClient implements D1QueryClient, D1DatabaseBinding {
  constructor(private readonly options: RemoteD1Options) {}

  prepare(sql: string): D1PreparedStatement {
    return new RemoteD1PreparedStatement(this, sql);
  }

  async query(sql: string, params: unknown[], method: RemoteD1Method): Promise<D1QueryResult> {
    const rows = await this.requestRows(sql, params, method !== "run");
    if (method === "get") {
      return { rows: rows[0] ?? undefined };
    }
    if (method === "run") {
      return { rows: [] };
    }
    return { rows };
  }

  async batch(queries: RemoteD1Query[]): Promise<D1QueryResult[]> {
    const results: D1QueryResult[] = [];
    for (const query of queries) {
      results.push(await this.query(query.sql, query.params, query.method));
    }
    return results;
  }

  async get<T>(sql: string, params: unknown[]): Promise<T | null> {
    const rows = await this.requestRows(sql, params, false);
    return (rows[0] ?? null) as T | null;
  }

  async getAll<T>(sql: string, params: unknown[]): Promise<T[]> {
    return (await this.requestRows(sql, params, false)) as T[];
  }

  async execute(sql: string, params: unknown[]): Promise<void> {
    await this.query(sql, params, "run");
  }

  private async requestRows(
    sql: string,
    params: unknown[],
    arrayMode: boolean
  ): Promise<unknown[]> {
    const endpoint = arrayMode ? "raw" : "query";
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.options.accountId}/d1/database/${this.options.databaseId}/${endpoint}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sql,
          params: params.map(serializeParam)
        })
      }
    );

    const payload = (await response.json().catch(() => null)) as CloudflareD1Response | null;
    if (!response.ok || !payload) {
      throw new Error(`D1 request failed: ${response.status} ${response.statusText}`);
    }
    if (!payload.success) {
      const details = payload.errors
        ?.map((error) => `${error.code ?? "D1"}: ${error.message ?? "unknown"}`)
        .join("; ");
      throw new Error(`D1 request failed: ${details ?? "unknown_error"}`);
    }

    const result = Array.isArray(payload.result) ? payload.result[0] : payload.result;
    return normalizeRows(result?.results, arrayMode);
  }
}

class RemoteD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private readonly client: RemoteD1HttpClient,
    private readonly sql: string,
    private readonly params: unknown[] = []
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new RemoteD1PreparedStatement(this.client, this.sql, values);
  }

  async all<T = Record<string, unknown>>(): Promise<{ results?: T[] }> {
    return { results: await this.client.getAll<T>(this.sql, this.params) };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const result = await this.client.query(this.sql, this.params, "values");
    return result.rows as T[];
  }

  async run(): Promise<unknown> {
    await this.client.execute(this.sql, this.params);
    return { success: true };
  }
}

function normalizeRows(
  results: CloudflareD1Result["results"] | undefined,
  arrayMode: boolean
): unknown[] {
  if (!results) {
    return [];
  }
  if (Array.isArray(results)) {
    return results;
  }
  if (Array.isArray(results.rows)) {
    if (arrayMode) {
      return results.rows;
    }
    const columns = results.columns ?? [];
    return results.rows.map((row) =>
      Object.fromEntries(row.map((value, index) => [columns[index] ?? String(index), value]))
    );
  }
  return [];
}

function serializeParam(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Uint8Array) {
    return Array.from(value);
  }
  return value;
}
