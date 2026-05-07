import { OAuth2Client, generateCodeVerifier, generateState } from "oslo/oauth2";
import { z } from "zod";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleOAuthSession {
  state: string;
  codeVerifier: string;
  url: URL;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
}

const GoogleTokenSchema = z.object({
  access_token: z.string().min(1)
});

const GoogleProfileSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional()
});

export class GoogleOAuthService {
  private readonly client: OAuth2Client;
  private readonly clientSecret: string;

  constructor(config: GoogleOAuthConfig) {
    this.client = new OAuth2Client(
      config.clientId,
      "https://accounts.google.com/o/oauth2/v2/auth",
      "https://oauth2.googleapis.com/token",
      { redirectURI: config.redirectUri }
    );
    this.clientSecret = config.clientSecret;
  }

  async createAuthorizationSession(): Promise<GoogleOAuthSession> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = await this.client.createAuthorizationURL({
      state,
      codeVerifier,
      codeChallengeMethod: "S256",
      scopes: ["openid", "email", "profile"]
    });

    return { state, codeVerifier, url };
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<GoogleProfile> {
    const token = GoogleTokenSchema.parse(
      await this.client.validateAuthorizationCode(code, {
        codeVerifier,
        credentials: this.clientSecret,
        authenticateWith: "request_body"
      })
    );

    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Google profile");
    }

    return GoogleProfileSchema.parse(await response.json());
  }
}
