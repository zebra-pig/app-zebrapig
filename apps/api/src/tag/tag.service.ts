import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";
import { useErpnextService } from "../erpnext/erpnext.service";
import type { GearTagResolution } from "./tag.gql.schema";

/** Shape returned by the Frappe whitelisted method gear.api.resolve_token. */
interface ResolveTokenResponse {
  token: string;
  valid: boolean;
  found: boolean;
  assigned: boolean;
  unit: {
    name?: string;
    item?: string;
    product?: string;
    category?: string;
    status?: string;
    location?: string;
  } | null;
}

const s = (val: unknown): string | null => (val == null || val === "" ? null : String(val));

export interface TagService {
  resolve(token: string): Promise<GearTagResolution>;
}

export function useTagService(c: ServiceContext): TagService {
  return useService(c, "tagService", () => {
    const erp = useErpnextService(c);
    return {
      async resolve(rawToken) {
        // One server-side call does the whole token -> tag -> unit -> item hop
        // with raw reads, so the scoped API key needs no Item/Asset permission.
        const res = await erp.callMethod<ResolveTokenResponse>("gear.api.resolve_token", {
          token: rawToken ?? "",
        });
        const u = res?.unit ?? null;
        return {
          token: res?.token ?? "",
          valid: Boolean(res?.valid),
          found: Boolean(res?.found),
          assigned: Boolean(res?.assigned),
          name: s(u?.name),
          product: s(u?.product),
          item: s(u?.item),
          category: s(u?.category),
          status: s(u?.status),
          location: s(u?.location),
        };
      },
    };
  });
}
