import { describe, expect, test } from "vitest";

import { isAdminEmail } from "@/lib/admin";

describe("isAdminEmail", () => {
  test("allows the configured administrator email case-insensitively", () => {
    expect(isAdminEmail("auroroa@gmail.com")).toBe(true);
    expect(isAdminEmail("Auroroa@Gmail.Com")).toBe(true);
  });

  test("rejects guests and non-admin users", () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail("fan@example.com")).toBe(false);
  });
});
