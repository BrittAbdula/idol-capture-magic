import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8787),
    PUBLIC_APP_ORIGIN: z.string().url(),
    DATABASE_BACKEND: z.enum(["sqlite", "d1"]).default("sqlite"),
    DATABASE_URL: z.string().min(1).default("file:./data/idolbooth.sqlite"),
    D1_DATABASE_NAME: z.string().optional(),
    D1_DATABASE_ID: z.string().optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    CLOUDFLARE_API_TOKEN: z.string().optional(),
    STORAGE_BACKEND: z.enum(["local", "r2"]).default("local"),
    STORAGE_DIR: z.string().min(1).default("./storage"),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REDIRECT_URI: z.string().url(),
    KIE_API_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PLUS_PRICE_ID: z.string().min(1),
    STRIPE_PRO_PRICE_ID: z.string().min(1),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional()
  })
  .superRefine((value, ctx) => {
    if (value.DATABASE_BACKEND === "d1") {
      for (const key of [
        "D1_DATABASE_NAME",
        "D1_DATABASE_ID",
        "CLOUDFLARE_ACCOUNT_ID",
        "CLOUDFLARE_API_TOKEN"
      ] as const) {
        if (!value[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when DATABASE_BACKEND=d1`
          });
        }
      }
    }

    if (value.STORAGE_BACKEND !== "r2") {
      return;
    }

    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET"
    ] as const) {
      if (!value[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when STORAGE_BACKEND=r2`
        });
      }
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function parseEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>): Env {
  const result = EnvSchema.safeParse(source);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment: ${details}`);
}

export function loadDotEnv(filePath = path.resolve(process.cwd(), ".env")): void {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getEnv(): Env {
  loadDotEnv();
  return parseEnv(process.env);
}
