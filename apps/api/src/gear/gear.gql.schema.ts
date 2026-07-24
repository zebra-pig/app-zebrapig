import { asObjectType } from "@gqloom/valibot";
import * as v from "valibot";
import { str } from "../graphql/shared.gql.schema";

export const GearCategorySchema = v.pipe(
  v.object({
    name: v.string(),
    categoryName: str(),
    abbr: str(),
    description: str(),
  }),
  asObjectType("GearCategory"),
);
export type GearCategory = v.InferOutput<typeof GearCategorySchema>;

export const GearUnitSchema = v.pipe(
  v.object({
    /** ERPNext docname, e.g. "CAM-02". */
    name: v.string(),
    category: str(),
    model: str(),
    manufacturer: str(),
    serialNo: str(),
    status: str(),
    checkoutMode: str(),
    parentUnit: str(),
    location: str(),
    tagToken: str(),
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
    category: s(row.category),
    model: s(row.model),
    manufacturer: s(row.manufacturer),
    serialNo: s(row.serial_no),
    status: s(row.status),
    checkoutMode: s(row.checkout_mode),
    parentUnit: s(row.parent_unit),
    location: s(row.location),
    tagToken: s(row.tag_token),
  };
}

export function mapGearCategory(row: Row): GearCategory {
  return {
    name: String(row.name),
    categoryName: s(row.category_name),
    abbr: s(row.abbr),
    description: s(row.description),
  };
}
