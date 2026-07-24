# erp

Everything for the self-hosted ERPNext instance (`erp.zebrapig.com`), brought
into the monorepo so `zebrapig-erp` can be archived.

```
erp/
  gear/     Frappe app — the gear-management module (tables + invariants only)
  image/    Custom image build (Containerfile + apps.json + vendored nginx resources)
  deploy/   docker-compose stack, Traefik/MariaDB overrides, SETUP.md rollout guide
```

The custom image (`ghcr.io/zebra-pig/erp-zebrapig`) = the site's apps on
**version-16** stable (Frappe + ERPNext + HRMS + Payments) **plus** the local
`gear` app baked in. It is built by the *Build ERP image* GitHub workflow and
deployed per [`deploy/SETUP.md`](deploy/SETUP.md).

> Cutting over from the old `arnadeem/erpnext-hrms:15.47.8` image is a **major
> v15 → v16 upgrade** (the site currently runs frappe/erpnext 15 with an
> hrms 16.0.0-dev snapshot). Back up and test on a DB copy first — see SETUP.md.

## The bigger picture

- `apps/web-client` — public site; will also host the `/t/<token>` resolver.
- `apps/erp-api` *(later)* — GQLoom + Hono worker holding a Frappe API key,
  fronting the gear tables for the mobile app (mirrors
  `onepromise-platform/apps/api`).

The Frappe app stays deliberately thin: it serves the tables and enforces
invariants (token generation, bound-child movement); business/API logic lives
in `erp-api`.
