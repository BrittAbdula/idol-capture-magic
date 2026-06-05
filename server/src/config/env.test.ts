import { describe, expect, test } from "vitest";

import { parseEnv } from "./env.js";

const validEnv = {
  NODE_ENV: "development",
  PORT: "8787",
  PUBLIC_APP_ORIGIN: "http://localhost:8080",
  D1_DATABASE_NAME: "batchloom-db",
  D1_DATABASE_ID: "d1-test-id",
  CLOUDFLARE_ACCOUNT_ID: "cloudflare-account",
  CLOUDFLARE_API_TOKEN: "cloudflare-token",
  STORAGE_BACKEND: "local",
  STORAGE_DIR: "./storage",
  GOOGLE_CLIENT_ID: "google-client",
  GOOGLE_CLIENT_SECRET: "google-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:8787/auth/google/callback",
  KIE_API_KEY: "kie-key",
  STRIPE_SECRET_KEY: "stripe-secret",
  STRIPE_WEBHOOK_SECRET: "stripe-webhook",
  STRIPE_PLUS_PRICE_ID: "price_plus",
  STRIPE_PRO_PRICE_ID: "price_pro"
};

describe("parseEnv", () => {
  test("parses required backend environment variables", () => {
    expect(parseEnv(validEnv)).toMatchObject({
      PORT: 8787,
      PUBLIC_APP_ORIGIN: "http://localhost:8080",
      STORAGE_BACKEND: "local"
    });
  });

  test("parses monthly and annual Stripe price ids", () => {
    expect(
      parseEnv({
        ...validEnv,
        STRIPE_PLUS_MONTHLY_PRICE_ID: "price_plus_monthly",
        STRIPE_PLUS_ANNUAL_PRICE_ID: "price_plus_annual",
        STRIPE_PRO_MONTHLY_PRICE_ID: "price_pro_monthly",
        STRIPE_PRO_ANNUAL_PRICE_ID: "price_pro_annual"
      })
    ).toMatchObject({
      STRIPE_PLUS_MONTHLY_PRICE_ID: "price_plus_monthly",
      STRIPE_PLUS_ANNUAL_PRICE_ID: "price_plus_annual",
      STRIPE_PRO_MONTHLY_PRICE_ID: "price_pro_monthly",
      STRIPE_PRO_ANNUAL_PRICE_ID: "price_pro_annual"
    });
  });

  test("fails loudly when required credentials are missing", () => {
    const { KIE_API_KEY: _kieApiKey, ...envWithoutKie } = validEnv;

    expect(() => parseEnv(envWithoutKie)).toThrow(/KIE_API_KEY/);
  });

  test("requires R2 credentials when R2 storage is selected", () => {
    expect(() => parseEnv({ ...validEnv, STORAGE_BACKEND: "r2" })).toThrow(/R2_BUCKET/);
  });
});
