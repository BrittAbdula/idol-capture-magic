import { describe, expect, test } from "vitest";

import { ApiError } from "@/api/client";
import { shouldPromptForGoogleSignIn } from "@/lib/authPrompt";

describe("shouldPromptForGoogleSignIn", () => {
  test("prompts guests when the API rejects an unauthenticated request", () => {
    const error = new ApiError({ status: 401, code: "auth_required" });

    expect(shouldPromptForGoogleSignIn(error, false)).toBe(true);
  });

  test("prompts guests when their anonymous quota is exhausted", () => {
    const error = new ApiError({ status: 402, code: "quota_exhausted" });

    expect(shouldPromptForGoogleSignIn(error, false)).toBe(true);
  });

  test("prompts guests when provider rejection carries a payment-required detail", () => {
    const error = new ApiError({
      status: 422,
      code: "provider_rejected",
      message: "provider_rejected/402 Payment Required"
    });

    expect(shouldPromptForGoogleSignIn(error, false)).toBe(true);
  });

  test("does not prompt signed-in users for billing or provider errors", () => {
    const error = new ApiError({ status: 402, code: "quota_exhausted" });

    expect(shouldPromptForGoogleSignIn(error, true)).toBe(false);
  });

  test("does not prompt guests for unrelated validation errors", () => {
    const error = new ApiError({ status: 400, code: "unsupported_mime_type" });

    expect(shouldPromptForGoogleSignIn(error, false)).toBe(false);
  });
});
