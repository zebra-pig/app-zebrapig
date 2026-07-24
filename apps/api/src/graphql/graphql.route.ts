import { weave } from "@gqloom/core";
import { Hono } from "hono";
import { graphqlServer } from "@hono/graphql-server";
import { ValibotWeaver } from "@gqloom/valibot";
import { GraphQLDateTime } from "graphql-scalars";
import { GraphQLInt } from "graphql";
import type { HonoEnv } from "../env/env";
import { gearResolver } from "../gear/gear.resolver";
import { tagResolver } from "../tag/tag.resolver";

// Valibot -> GraphQL scalar presets (mirrors filmkit): v.date() -> DateTime,
// an integer-piped number -> Int. No Float by policy.
export const valibotWeaverConfig = ValibotWeaver.config({
  presetGraphQLType: (schema) => {
    const s = schema as { type?: string; pipe?: Array<{ type?: string }> };
    if (s.type === "date") return GraphQLDateTime;
    if (s.type === "number" && Array.isArray(s.pipe) && s.pipe.some((a) => a?.type === "integer")) {
      return GraphQLInt;
    }
  },
});

const schema = weave(valibotWeaverConfig, tagResolver, gearResolver);

export const graphqlRoute = new Hono<HonoEnv>();

graphqlRoute.use("/", async (c, next) => {
  const isLocal = c.env.ENVIRONMENT === "local";
  return graphqlServer({ schema, graphiql: isLocal })(c, next);
});
