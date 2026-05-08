import type { D1QueryClient, D1QueryResult } from "./client.js";

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
  raw: <T = unknown[]>() => Promise<T[]>;
  run: () => Promise<unknown>;
}

export interface D1DatabaseBinding {
  prepare: (sql: string) => D1PreparedStatement;
}

export class D1BindingClient implements D1QueryClient {
  constructor(private readonly binding: D1DatabaseBinding) {}

  async query(
    sql: string,
    params: unknown[],
    method: "run" | "all" | "values" | "get"
  ): Promise<D1QueryResult> {
    const statement = this.binding.prepare(sql).bind(...params.map(serializeParam));

    if (method === "run") {
      await statement.run();
      return { rows: [] };
    }
    if (method === "get") {
      const rows = await statement.raw();
      return { rows: rows[0] };
    }

    return { rows: await statement.raw() };
  }

  async batch(
    queries: Array<{ sql: string; params: unknown[]; method: "run" | "all" | "values" | "get" }>
  ): Promise<D1QueryResult[]> {
    const results: D1QueryResult[] = [];
    for (const query of queries) {
      results.push(await this.query(query.sql, query.params, query.method));
    }
    return results;
  }

  async get<T>(sql: string, params: unknown[]): Promise<T | null> {
    const result = await this.binding
      .prepare(sql)
      .bind(...params.map(serializeParam))
      .all<T>();
    return result.results?.[0] ?? null;
  }

  async getAll<T>(sql: string, params: unknown[]): Promise<T[]> {
    const result = await this.binding
      .prepare(sql)
      .bind(...params.map(serializeParam))
      .all<T>();
    return result.results ?? [];
  }

  async execute(sql: string, params: unknown[]): Promise<void> {
    await this.query(sql, params, "run");
  }
}

function serializeParam(value: unknown): unknown {
  return value === undefined ? null : value;
}
