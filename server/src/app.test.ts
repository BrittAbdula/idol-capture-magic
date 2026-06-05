import { describe, expect, test } from "vitest";

import { createApp } from "./app.js";

describe("createApp", () => {
  test("responds to health checks", async () => {
    const app = createApp({ publicAppOrigin: "http://localhost:8080" });
    const response = await app.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  test("sets CORS headers for the configured frontend origin", async () => {
    const app = createApp({ publicAppOrigin: "http://localhost:8080" });
    const response = await app.request("/health", {
      headers: { Origin: "http://localhost:8080" }
    });

    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:8080"
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  test("allows localhost frontend requests when configured for production", async () => {
    const app = createApp({ publicAppOrigin: "https://idolbooth.com" });
    const response = await app.request("/health", {
      headers: { Origin: "http://localhost:8080" }
    });

    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:8080"
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });
});
