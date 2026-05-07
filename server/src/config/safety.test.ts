import { describe, expect, test } from "vitest";

import { checkConcept, checkPrompt } from "../services/safety.js";

describe("safety service", () => {
  test("rejects blocklisted prompt text without echoing the phrase", () => {
    const result = checkPrompt("soft polaroid date with an idol");

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("prompt_blocklist");
  });

  test("normalizes case and whitespace", () => {
    expect(checkPrompt("A safe concept with   KiSs  language").ok).toBe(false);
  });

  test("allows safe stylized companion concepts", () => {
    const result = checkConcept(
      {
        promptTemplate:
          "A polaroid with the user and an anonymized stylized companion, soft grain",
        format: "selca"
      },
      { name: "Haerin", birthday: "05-15" }
    );

    expect(result.ok).toBe(true);
  });
});
