import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";
import { useErpnextService } from "../erpnext/erpnext.service";
import {
  type GearCategory,
  type GearUnit,
  mapGearCategory,
  mapGearUnit,
} from "./gear.gql.schema";

const UNIT_FIELDS = [
  "name",
  "category",
  "item",
  "serial_no",
  "status",
  "checkout_mode",
  "parent_unit",
  "location",
  "asset",
];
const CATEGORY_FIELDS = ["name", "category_name", "abbr", "description"];

export interface GearService {
  listUnits(opts?: { category?: string; status?: string }): Promise<GearUnit[]>;
  getUnit(name: string): Promise<GearUnit | null>;
  listCategories(): Promise<GearCategory[]>;
}

export function useGearService(c: ServiceContext): GearService {
  return useService(c, "gearService", () => {
    const erp = useErpnextService(c);
    return {
      async listUnits(opts = {}) {
        const filters: unknown[][] = [];
        if (opts.category) filters.push(["category", "=", opts.category]);
        if (opts.status) filters.push(["status", "=", opts.status]);
        const rows = await erp.getList("Gear Unit", { fields: UNIT_FIELDS, filters });
        return rows.map(mapGearUnit);
      },
      async getUnit(name) {
        const row = await erp.getDoc("Gear Unit", name);
        return row ? mapGearUnit(row) : null;
      },
      async listCategories() {
        const rows = await erp.getList("Gear Category", { fields: CATEGORY_FIELDS });
        return rows.map(mapGearCategory);
      },
    };
  });
}
