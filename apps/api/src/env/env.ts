import type { ErpnextService } from "../erpnext/erpnext.service";
import type { GearService } from "../gear/gear.service";
import type { TagService } from "../tag/tag.service";

/**
 * Worker bindings. Non-secret values come from wrangler `vars`; secrets are set
 * with `wrangler secret put` and typed here as plain strings.
 */
export interface Env {
  /** "local" | "production" — gates graphiql. */
  ENVIRONMENT: string;
  /** ERPNext base URL, e.g. https://erp.zebrapig.com */
  ERP_BASE_URL: string;
  /** Frappe API key of the "Gear API" service user (secret). */
  ERP_API_KEY: string;
  /** Frappe API secret of the "Gear API" service user (secret). */
  ERP_API_SECRET: string;
  /** Static bearer for privileged (non-public) queries (secret). The seam that
   * Better Auth's authGuard() replaces once the mobile app lands. */
  API_BEARER_TOKEN: string;
}

export type Bindings = Env;

/**
 * Per-request DI slots (see service/service.ts). Each service is memoized onto
 * the Hono context on first use.
 */
export interface Variables {
  erpnextService?: ErpnextService;
  gearService?: GearService;
  tagService?: TagService;
}

export type HonoEnv = { Bindings: Bindings; Variables: Variables };
