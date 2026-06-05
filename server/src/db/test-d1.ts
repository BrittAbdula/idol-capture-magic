import { readdir, readFile } from "node:fs/promises";

import { Miniflare } from "miniflare";

import { createDatabaseClientFromD1Binding, type DatabaseClient } from "./client.js";
import type { D1DatabaseBinding } from "./d1-binding.js";

export interface TestDatabaseClient extends DatabaseClient {
  dispose: () => Promise<void>;
}

export async function createTestD1DatabaseClient(): Promise<TestDatabaseClient> {
  const miniflare = new Miniflare({
    modules: true,
    script: "export default { async fetch() { return new Response('ok'); } }",
    d1Databases: {
      DB: "00000000-0000-0000-0000-000000000001"
    }
  });
  const binding = (await miniflare.getD1Database("DB")) as unknown as D1DatabaseBinding;
  const client = createDatabaseClientFromD1Binding(binding);
  await applyMigrations(client);

  return {
    ...client,
    dispose: () => miniflare.dispose()
  };
}

async function applyMigrations(client: DatabaseClient): Promise<void> {
  const migrationsUrl = new URL("./migrations/", import.meta.url);
  const migrationFiles = (await readdir(migrationsUrl))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migration = await readFile(new URL(file, migrationsUrl), "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) {
        await client.d1.execute(sql, []);
      }
    }
  }
}
