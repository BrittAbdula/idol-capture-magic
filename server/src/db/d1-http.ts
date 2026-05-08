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

export interface RemoteD1QueryResult {
  rows: unknown;
}

export class RemoteD1HttpClient {
  constructor(private readonly options: RemoteD1Options) {}

  async query(
    sql: string,
    params: unknown[],
    method: RemoteD1Method
  ): Promise<RemoteD1QueryResult> {
    const rows = await this.requestRows(sql, params, method === "values");
    if (method === "get") {
      return { rows: rows[0] ?? undefined };
    }
    if (method === "run") {
      return { rows: [] };
    }
    return { rows };
  }

  async batch(queries: RemoteD1Query[]): Promise<RemoteD1QueryResult[]> {
    const results: RemoteD1QueryResult[] = [];
    for (const query of queries) {
      results.push(await this.query(query.sql, query.params, query.method));
    }
    return results;
  }

  async get<T>(sql: string, params: unknown[]): Promise<T | null> {
    const result = await this.query(sql, params, "get");
    return (result.rows ?? null) as T | null;
  }

  async getAll<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result = await this.query(sql, params, "all");
    return result.rows as T[];
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
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Uint8Array) {
    return Array.from(value);
  }
  return value;
}
