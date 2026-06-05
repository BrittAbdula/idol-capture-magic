import { z } from "zod";

const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PUBLIC_APP_ORIGIN: z.string().url(),
  PUBLIC_STORAGE_ORIGIN: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),
  KIE_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PLUS_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PRO_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PLUS_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PLUS_ANNUAL_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1).optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().min(1).optional()
}).superRefine((value, ctx) => {
  if (!value.STRIPE_PLUS_MONTHLY_PRICE_ID && !value.STRIPE_PLUS_PRICE_ID) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STRIPE_PLUS_MONTHLY_PRICE_ID"],
      message: "STRIPE_PLUS_MONTHLY_PRICE_ID is required when STRIPE_PLUS_PRICE_ID is unset"
    });
  }
  if (!value.STRIPE_PRO_MONTHLY_PRICE_ID && !value.STRIPE_PRO_PRICE_ID) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["STRIPE_PRO_MONTHLY_PRICE_ID"],
      message: "STRIPE_PRO_MONTHLY_PRICE_ID is required when STRIPE_PRO_PRICE_ID is unset"
    });
  }
});

export type WorkerEnvConfig = z.infer<typeof WorkerEnvSchema>;

export function parseWorkerEnv(source: Record<string, unknown>): WorkerEnvConfig {
  const result = WorkerEnvSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid Worker environment: ${details}`);
}
