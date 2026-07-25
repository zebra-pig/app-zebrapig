import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";
import { useErpnextService } from "../erpnext/erpnext.service";
import { type GearUnit, mapGearUnit } from "./gear.gql.schema";

const UNIT_FIELDS = [
  "name",
  "item",
  "item_group",
  "serial_no",
  "status",
  "checkout_mode",
  "parent_unit",
  "location",
  "asset",
];

export interface GearService {
  listUnits(opts?: { itemGroup?: string; status?: string }): Promise<GearUnit[]>;
  getUnit(name: string): Promise<GearUnit | null>;
}

export function useGearService(c: ServiceContext): GearService {
  return useService(c, "gearService", () => {
    const erp = useErpnextService(c);
    return {
      async listUnits(opts = {}) {
        const filters: unknown[][] = [];
        if (opts.itemGroup) filters.push(["item_group", "=", opts.itemGroup]);
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
