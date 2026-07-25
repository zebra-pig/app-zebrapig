import { asObjectType } from "@gqloom/valibot";
import * as v from "valibot";
import { str } from "../graphql/shared.gql.schema";

/**
 * PUBLIC view of a resolved tag — the only fields safe to show anyone who scans
 * a physical tag. Resolution is token -> Gear Tag -> Gear Unit -> Item.
 *
 * - `valid=false`  : the string failed the Crockford check digit.
 * - `found=false`  : no such tag in the system.
 * - `assigned=false`: a minted tag not yet stuck on a unit.
 * - otherwise the unit fields describe the gear.
 */
export const GearTagResolutionSchema = v.pipe(
  v.object({
    token: v.string(),
    valid: v.boolean(),
    found: v.boolean(),
    assigned: v.boolean(),
    name: str(),      // unit name, e.g. CAM-02
    product: str(),   // Item.item_name — what it is
    item: str(),      // Item code
    category: str(),
    status: str(),
    location: str(),
  }),
  asObjectType("GearTagResolution"),
);
export type GearTagResolution = v.InferOutput<typeof GearTagResolutionSchema>;
