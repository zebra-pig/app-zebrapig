import type { Context } from "hono";
import type { HonoEnv } from "../env/env";

/**
 * Recovers the Hono request context from a GQLoom resolver payload. GQLoom
 * passes the Hono Context through as the GraphQL context, so resolvers bridge
 * to the service layer via `useXService(getContext(payload))`.
 */
export function getContext(payload: { context?: unknown } | undefined): Context<HonoEnv> {
  const context = payload?.context;
  if (!context) {
    throw new Error("Context not found");
  }
  return context as Context<HonoEnv>;
}
