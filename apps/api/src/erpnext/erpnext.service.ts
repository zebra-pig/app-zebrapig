import type { ServiceContext } from "../context/service.context";
import { useService } from "../service/service";

export interface ErpListOptions {
  fields?: string[];
  /** Frappe filter tuples, e.g. [["status","=","Available"]] */
  filters?: unknown[][];
  /** 0 = no limit (all rows). Default 0. */
  limit?: number;
}

export interface ErpnextService {
  getList<T = Record<string, unknown>>(doctype: string, opts?: ErpListOptions): Promise<T[]>;
  getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T | null>;
  /** Call a whitelisted Frappe method (GET /api/method/<dotted.path>). Returns
   * its `message` payload. Used for server-side multi-hop resolution the scoped
   * key can't do field-by-field over /api/resource. */
  callMethod<T = unknown>(method: string, params?: Record<string, string>): Promise<T>;
}

/**
 * Thin ERPNext REST client. This is the one seam that differs from filmkit
 * (which talks to Drizzle/Durable Objects): our system of record is ERPNext,
 * reached over its auto-generated REST API with a token-auth service key.
 * Modeled on filmkit's external-HTTP pattern (throw on !res.ok).
 */
export function useErpnextService(c: ServiceContext): ErpnextService {
  return useService(c, "erpnextService", () => {
    const base = c.env.ERP_BASE_URL.replace(/\/+$/, "");
    const authHeader = `token ${c.env.ERP_API_KEY}:${c.env.ERP_API_SECRET}`;

    async function get(path: string): Promise<Response> {
      return fetch(`${base}${path}`, {
        headers: { Authorization: authHeader, Accept: "application/json" },
      });
    }

    return {
      async getList(doctype, opts = {}) {
        const params = new URLSearchParams();
        if (opts.fields) params.set("fields", JSON.stringify(opts.fields));
        if (opts.filters && opts.filters.length) {
          params.set("filters", JSON.stringify(opts.filters));
        }
        params.set("limit_page_length", String(opts.limit ?? 0));
        const res = await get(
          `/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`,
        );
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`ERPNext ${res.status} listing ${doctype}: ${body.slice(0, 200)}`);
        }
        const json = (await res.json()) as { data?: unknown[] };
        return (json.data ?? []) as never;
      },

      async getDoc(doctype, name) {
        const res = await get(
          `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
        );
        if (res.status === 404) return null;
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`ERPNext ${res.status} fetching ${doctype} ${name}: ${body.slice(0, 200)}`);
        }
        const json = (await res.json()) as { data?: unknown };
        return (json.data ?? null) as never;
      },

      async callMethod(method, params = {}) {
        const qs = new URLSearchParams(params).toString();
        const res = await get(`/api/method/${method}${qs ? `?${qs}` : ""}`);
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`ERPNext ${res.status} calling ${method}: ${body.slice(0, 200)}`);
        }
        const json = (await res.json()) as { message?: unknown };
        return (json.message ?? null) as never;
      },
    };
  });
}
