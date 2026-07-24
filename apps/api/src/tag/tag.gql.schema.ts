import { asObjectType } from "@gqloom/valibot";
import * as v from "valibot";
import { str } from "../graphql/shared.gql.schema";

/**
 * PUBLIC view of a resolved tag — the only fields safe to show anyone who scans
 * a physical tag. No tokens, no internal bookkeeping. `found=false` (not a hard
 * error) means the tag is valid-looking but unassigned; `valid=false` means the
 * string failed the Crockford check digit.
 */
export const GearTagResolutionSchema = v.pipe(
  v.object({
    token: v.string(),
    valid: v.boolean(),
    found: v.boolean(),
    name: str(),
    category: str(),
    model: str(),
    manufacturer: str(),
    status: str(),
  }),
  asObjectType("GearTagResolution"),
);
export type GearTagResolution = v.InferOutput<typeof GearTagResolutionSchema>;
