import { safetyConfig, type SafetyConfig } from "../config/safety.js";

interface ConceptLike {
  promptTemplate: string;
  format?: string;
}

interface MemberLike {
  name: string;
  birthday?: string | null;
}

export interface SafetyResult {
  ok: boolean;
  reason?: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function checkPrompt(text: string, config: SafetyConfig = safetyConfig): SafetyResult {
  const normalizedText = normalizeText(text);

  for (const blockedPhrase of config.promptBlocklist) {
    if (normalizedText.includes(normalizeText(blockedPhrase))) {
      return { ok: false, reason: "prompt_blocklist" };
    }
  }

  return { ok: true };
}

export function checkConcept(
  concept: ConceptLike,
  member: MemberLike,
  config: SafetyConfig = safetyConfig
): SafetyResult {
  const promptResult = checkPrompt(concept.promptTemplate, config);
  if (!promptResult.ok) {
    return promptResult;
  }

  const memberResult = checkPrompt(member.name, config);
  if (!memberResult.ok) {
    return { ok: false, reason: "member_metadata_blocklist" };
  }

  return { ok: true };
}
