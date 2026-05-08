import { defineConfig } from "drizzle-kit";

import { loadDotEnv } from "./src/config/env.js";

loadDotEnv();

const databaseBackend = process.env.DATABASE_BACKEND ?? "sqlite";
const databaseUrl = process.env.DATABASE_URL ?? "file:./data/idolbooth.sqlite";
const sqlitePath = databaseUrl.startsWith("file:")
  ? databaseUrl.slice("file:".length)
  : databaseUrl;

const d1Config = {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: requiredEnv("D1_DATABASE_ID"),
    token: requiredEnv("CLOUDFLARE_API_TOKEN")
  }
} as const;

const sqliteConfig = {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath
  }
} as const;

export default defineConfig(databaseBackend === "d1" ? d1Config : sqliteConfig);

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for DATABASE_BACKEND=d1`);
  }
  return value;
}
