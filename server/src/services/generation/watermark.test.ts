import { describe, expect, test } from "vitest";

import { applyWatermark } from "./watermark.js";

describe("applyWatermark", () => {
  test("returns the original image when watermark PNG parsing fails", async () => {
    const original = Buffer.from("provider returned bytes");

    await expect(applyWatermark({ input: original, level: "visible" })).resolves.toEqual(original);
  });
});
