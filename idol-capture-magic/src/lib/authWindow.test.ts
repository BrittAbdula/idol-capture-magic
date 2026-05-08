import { describe, expect, test } from "vitest";

import { openGoogleSignInTab } from "@/lib/authWindow";

describe("openGoogleSignInTab", () => {
  test("opens Google sign-in in a new isolated tab", () => {
    const calls: Array<[string, string, string]> = [];
    const opener = {
      open(url: string, target: string, features: string) {
        calls.push([url, target, features]);
        return {} as WindowProxy;
      }
    };

    expect(openGoogleSignInTab("https://api.idolbooth.com/auth/google", opener)).toBe(true);
    expect(calls).toEqual([
      ["https://api.idolbooth.com/auth/google", "_blank", "noopener,noreferrer"]
    ]);
  });

  test("reports when the browser blocks the popup", () => {
    const opener = {
      open() {
        return null;
      }
    };

    expect(openGoogleSignInTab("https://api.idolbooth.com/auth/google", opener)).toBe(false);
  });
});
