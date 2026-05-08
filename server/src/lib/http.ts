import type { Context } from "hono";

export function jsonError(
  c: Context,
  status: 400 | 401 | 402 | 404 | 422 | 500 | 502 | 503,
  error: string,
  details?: Record<string, unknown>
) {
  return c.json({ error, ...details }, status);
}
