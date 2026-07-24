import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import type { HonoEnv } from "./env/env";
import { allowedOrigins } from "./cors/cors";

const app = new Hono<HonoEnv>();

// Lazy-import the GraphQL route (the gqloom weave is heavy; only pay for it on
// a GraphQL request). Rewrites the path to "/" and re-dispatches, like filmkit.
async function handleGraphqlRoute(c: Context<HonoEnv>): Promise<Response> {
  const { graphqlRoute } = await import("./graphql/graphql.route");
  const url = new URL(c.req.url);
  url.pathname = "/";
  return graphqlRoute.fetch(new Request(url, c.req.raw), c.env, c.executionCtx);
}

app.use(
  "/graphql/*",
  cors({
    origin: allowedOrigins,
    allowMethods: ["POST", "GET", "OPTIONS"],
    allowHeaders: ["content-type", "authorization"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ ok: true, service: "api" }));

app.all("/graphql", handleGraphqlRoute);
app.all("/graphql/*", handleGraphqlRoute);

export default app;
