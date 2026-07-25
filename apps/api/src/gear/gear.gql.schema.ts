import { asObjectType } from "@gqloom/valibot";
import * as v from "valibot";
import { str } from "../graphql/shared.gql.schema";

export const GearUnitSchema = v.pipe(
  v.object({
    /** ERPNext docname, e.g. "CAM-02" — what we call it. */
    name: v.string(),
    /** ERPNext Item code — what it actually is. */
    item: str(),
    /** Gear Category code (e.g. CAM), inherited from the Item. */
    gearCategory: str(),
    serialNo: str(),
    status: str(),
    checkoutMode: str(),
    parentUnit: str(),
    location: str(),
    /** ERPNext Asset (optional). */
    asset: str(),
    /** The case (CAS unit) this was last seen in (informational). */
    currentContainer: str(),
  }),
  asObjectType("GearUnit"),
);
export type GearUnit = v.InferOutput<typeof GearUnitSchema>;

type Row = Record<string, unknown>;
const s = (val: unknown): string | null => (val == null || val === "" ? null : String(val));

/** ERPNext row (snake_case) -> GearUnit GraphQL shape. */
export function mapGearUnit(row: Row): GearUnit {
  return {
    name: String(row.name),
    item: s(row.item),
    gearCategory: s(row.gear_category),
    serialNo: s(row.serial_no),
    status: s(row.status),
    checkoutMode: s(row.checkout_mode),
    parentUnit: s(row.parent_unit),
    location: s(row.location),
    asset: s(row.asset),
    currentContainer: s(row.current_container),
  };
}
