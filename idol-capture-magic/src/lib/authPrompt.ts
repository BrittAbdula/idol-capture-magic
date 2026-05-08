import { isApiError } from "@/api/client";

const AUTH_PROMPT_CODES = new Set(["auth_required", "quota_exhausted"]);

export function shouldPromptForGoogleSignIn(error: unknown, isAuthenticated: boolean): boolean {
  if (isAuthenticated) {
    return false;
  }

  const message = error instanceof Error ? error.message : "";
  if (!isApiError(error)) {
    return /provider_rejected\/402|Payment Required/i.test(message);
  }

  if (error.status === 401 || AUTH_PROMPT_CODES.has(error.code)) {
    return true;
  }

  return (
    error.code === "provider_rejected" &&
    (error.status === 402 || /provider_rejected\/402|Payment Required/i.test(error.message))
  );
}
