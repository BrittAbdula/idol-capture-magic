import { describe, expect, test } from "vitest";

import { parseKieResultUrl } from "./kie.js";

describe("parseKieResultUrl", () => {
  test("accepts Kie result JSON returned as a URL array", () => {
    expect(
      parseKieResultUrl(
        JSON.stringify(["https://tempfile.aiquickdraw.com/gpt-image-2-apimart/example.png"])
      )
    ).toBe("https://tempfile.aiquickdraw.com/gpt-image-2-apimart/example.png");
  });

  test("accepts Kie result JSON returned as resultUrls object", () => {
    expect(
      parseKieResultUrl(JSON.stringify({ resultUrls: ["https://example.com/output.png"] }))
    ).toBe("https://example.com/output.png");
  });
});
