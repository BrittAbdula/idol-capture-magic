import { createApp } from "./app.js";
import { GoogleOAuthService } from "./auth/google.js";
import { createLucia } from "./auth/lucia.js";
import { getEnv } from "./config/env.js";
import { createDatabaseClient } from "./db/client.js";
import { startServer } from "./server.js";

const env = getEnv();
const client = createDatabaseClient(env.DATABASE_URL);
const auth = createLucia(client, env.NODE_ENV === "production");
const google = new GoogleOAuthService({
  clientId: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  redirectUri: env.GOOGLE_REDIRECT_URI
});

const app = createApp({
  publicAppOrigin: env.PUBLIC_APP_ORIGIN,
  auth,
  client,
  google,
  secureCookies: env.NODE_ENV === "production"
});

startServer(app, env.PORT);
