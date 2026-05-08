import { describe, expect, test } from "vitest";

import { resolveGoogleRedirectUri } from "./redirect.js";

describe("resolveGoogleRedirectUri", () => {
  test("uses the API request origin when a Worker is reached through the API host", () => {
    expect(
      resolveGoogleRedirectUri({
        configuredRedirectUri: "https://www.idolbooth.com/auth/google/callback",
        publicAppOrigin: "https://www.idolbooth.com",
        requestUrl: "https://api.idolbooth.com/auth/google"
      })
    ).toBe("https://api.idolbooth.com/auth/google/callback");
  });

  test("preserves the configured redirect URI when no request URL is available", () => {
    expect(
      resolveGoogleRedirectUri({
        configuredRedirectUri: "http://localhost:8787/auth/google/callback",
        publicAppOrigin: "http://localhost:8080"
      })
    ).toBe("http://localhost:8787/auth/google/callback");
  });

  test("preserves a configured API callback even when the request uses another Worker host", () => {
    expect(
      resolveGoogleRedirectUri({
        configuredRedirectUri: "https://api.idolbooth.com/auth/google/callback",
        publicAppOrigin: "https://idolbooth.com",
        requestUrl: "https://idolbooth-api.workers.dev/auth/google"
      })
    ).toBe("https://api.idolbooth.com/auth/google/callback");
  });
});
