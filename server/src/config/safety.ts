import { readFileSync } from "node:fs";

import { z } from "zod";

const SafetyConfigSchema = z.object({
  promptBlocklist: z.array(z.string().min(1)),
  memberNameAllowlist: z.string(),
  rejectIfMinorAge: z.boolean()
});

export type SafetyConfig = z.infer<typeof SafetyConfigSchema>;

export function loadSafetyConfig(
  fileUrl = new URL("../../config/blocklist.json", import.meta.url)
): SafetyConfig {
  return SafetyConfigSchema.parse(JSON.parse(readFileSync(fileUrl, "utf8")));
}

export const safetyConfig = loadSafetyConfig();
