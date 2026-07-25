import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";
import { useErpnextService } from "../erpnext/erpnext.service";
import { type GearUnit, mapGearUnit } from "./gear.gql.schema";

const UNIT_FIELDS = [
  "name",
  "item",
  "gear_category",
  "serial_no",
  "status",
  "checkout_mode",
  "parent_unit",
  "location",
  "asset",
  "current_container",
];

export interface GearService {
  listUnits(opts?: { gearCategory?: string; status?: string }): Promise<GearUnit[]>;
  getUnit(name: string): Promise<GearUnit | null>;
}

export function useGearService(c: ServiceContext): GearService {
  return useService(c, "gearService", () => {
    const erp = useErpnextService(c);
    return {
      async listUnits(opts = {}) {
        const filters: unknown[][] = [];
        if (opts.gearCategory) filters.push(["gear_category", "=", opts.gearCategory]);
        if (opts.status) filters.push(["status", "=", opts.status]);
        const rows = await erp.getList("Gear Unit", { fields: UNIT_FIELDS, filters });
        return rows.map(mapGearUnit);
      },
      async getUnit(name) {
        const row = await erp.getDoc("Gear Unit", name);
        return row ? mapGearUnit(row) : null;
      },
    };
  });
}
