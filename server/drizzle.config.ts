import { defineConfig } from "drizzle-kit";

import { loadDotEnv } from "./src/config/env.js";

loadDotEnv();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: requiredEnv("D1_DATABASE_ID"),
    token: requiredEnv("CLOUDFLARE_API_TOKEN")
  }
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for D1 database operations`);
  }
  return value;
}
