import { createApp } from "./app.js";
import { GoogleOAuthService } from "./auth/google.js";
import { createLucia } from "./auth/lucia.js";
import { getEnv } from "./config/env.js";
import { createDatabaseClient } from "./db/client.js";
import { startServer } from "./server.js";
import { StripeBillingService } from "./services/billing.js";
import { OpenAIImageProvider } from "./services/generation/openai.js";
import { createLocalStorageService } from "./services/storage.js";

const env = getEnv();
const client = createDatabaseClient(env.DATABASE_URL);
const auth = createLucia(client, env.NODE_ENV === "production");
const google = new GoogleOAuthService({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI
});
const storage = createLocalStorageService({ rootDir: env.STORAGE_DIR });
const billing = new StripeBillingService({
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  appOrigin: env.PUBLIC_APP_ORIGIN,
  plusPriceId: env.STRIPE_PLUS_PRICE_ID,
  proPriceId: env.STRIPE_PRO_PRICE_ID
});
const generationProvider = new OpenAIImageProvider(
  env.OPENAI_API_KEY,
  pathFromStorage(env.STORAGE_DIR, "raw")
);

const app = createApp({
  publicAppOrigin: env.PUBLIC_APP_ORIGIN,
  auth,
  client,
  google,
  billing,
  generationProvider,
  storage,
  secureCookies: env.NODE_ENV === "production"
});

startServer(app, env.PORT);

function pathFromStorage(storageDir: string, child: string): string {
  return `${storageDir.replace(/\/$/, "")}/${child}`;
}
