import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/idolbooth.sqlite";
const sqlitePath = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: sqlitePath
  }
});
