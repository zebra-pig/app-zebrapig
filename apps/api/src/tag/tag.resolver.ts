import { query, resolver } from "@gqloom/core";
import * as v from "valibot";
import { GearTagResolutionSchema } from "./tag.gql.schema";
import { useTagService } from "./tag.service";
import { getContext } from "../graphql/graphql.helpers";

/**
 * PUBLIC resolver — deliberately NO middleware. This is what the zebrapig.com/t/
 * page calls (server-side). It returns only the minimal public view and never
 * throws for unknown tokens (found=false), so a sync gap looks like "unassigned"
 * rather than a broken tag.
 */
export const tagResolver = resolver({
  resolveGearTag: query(GearTagResolutionSchema)
    .input({ token: v.string() })
    .resolve(async ({ token }, payload) => {
      const c = getContext(payload);
      return useTagService(c).resolve(token);
    }),
});
