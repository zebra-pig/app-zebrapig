import { GraphQLError } from "graphql";
import type { Middleware } from "@gqloom/core";
import type { Context } from "hono";
import type { HonoEnv } from "../env/env";

/**
 * GQLoom middleware requiring a valid static bearer token
 * (`Authorization: Bearer <API_BEARER_TOKEN>`). This is the deliberate,
 * temporary seam for privileged queries: when the mobile app lands, swap this
 * for filmkit's Better Auth `authGuard()` (per-user sessions) with the same
 * usage — `resolver({...}, { middlewares: [authGuard()] })`.
 *
 * The public token resolver (tag.resolver.ts) has NO middleware and stays open.
 */
export function bearerGuard(): Middleware {
  return async ({ next, payload }) => {
    if (!payload?.context) {
      throw new Error("Context not found");
    }
    const c = payload.context as Context<HonoEnv>;
    const expected = c.env.API_BEARER_TOKEN;
    const header = c.req.header("authorization") ?? "";
    const token = header.toLowerCase().startsWith("bearer ")
      ? header.slice(7).trim()
      : "";
    if (!expected || !token || token !== expected) {
      throw new GraphQLError("Unauthorized: valid bearer token required", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
    return next();
  };
}
