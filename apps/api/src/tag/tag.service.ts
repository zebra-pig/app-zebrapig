import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";
import { useErpnextService } from "../erpnext/erpnext.service";
import type { GearTagResolution } from "./tag.gql.schema";

// Crockford Base32 — mirror of gear/gear/utils/token.py (keep in sync).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CHECK = ALPHABET + "*~$=U";

/** Canonicalise a token as read off a label: uppercase, drop hyphens, I/L->1, O->0. */
export function normalizeToken(raw: string): string {
  if (!raw) return "";
  const s = raw.toUpperCase().replace(/-/g, "").trim();
  return s.replace(/[ILO]/g, (ch) => (ch === "O" ? "0" : "1"));
}

/** True if the token is 17 chars with a matching Crockford check symbol. */
export function isValidToken(raw: string): boolean {
  const s = normalizeToken(raw);
  if (s.length !== 17) return false;
  const body = s.slice(0, 16);
  const chk = s[16];
  let n = 0;
  for (const ch of body) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return false;
    n = n * 32 + i;
  }
  return CHECK[n % 37] === chk;
}

export interface TagService {
  resolve(token: string): Promise<GearTagResolution>;
}

export function useTagService(c: ServiceContext): TagService {
  return useService(c, "tagService", () => {
    const erp = useErpnextService(c);
    return {
      async resolve(rawToken) {
        const token = normalizeToken(rawToken ?? "");
        const base: GearTagResolution = {
          token,
          valid: isValidToken(token),
          found: false,
          name: null,
          category: null,
          model: null,
          manufacturer: null,
          status: null,
        };
        if (!token) return base;

        const rows = await erp.getList<Record<string, unknown>>("Gear Unit", {
          fields: ["name", "category", "model", "manufacturer", "status"],
          filters: [["tag_token", "=", token]],
          limit: 1,
        });
        const row = rows[0];
        if (!row) return base;

        const s = (val: unknown): string | null => (val == null || val === "" ? null : String(val));
        return {
          ...base,
          found: true,
          name: s(row.name),
          category: s(row.category),
          model: s(row.model),
          manufacturer: s(row.manufacturer),
          status: s(row.status),
        };
      },
    };
  });
}
