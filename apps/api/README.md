# api

The Zebra & Pig GraphQL API over the self-hosted ERPNext, on Cloudflare Workers
(`zebrapig-api` → **api.zebrapig.com**). Stack copied 1:1 from `filmkit/apps/api`
— **Hono + GQLoom + Valibot** (`@gqloom/core`, `@gqloom/valibot`,
`@hono/graphql-server`) — with the one deliberate change: the persistence seam
is **ERPNext REST**, not Drizzle/Durable Objects.

## Layout (filmkit convention)

```
src/
  index.ts                 Hono entry: /health + lazy /graphql, CORS
  env/env.ts               HonoEnv bindings (vars + secrets) + DI slots
  service/service.ts       useService() DI container on the request context
  context/service.context  ServiceContext = Context<HonoEnv>
  graphql/
    graphql.route.ts       weave(ValibotWeaver, tagResolver, gearResolver)
    graphql.helpers.ts      getContext(payload)
    shared.gql.schema.ts    int()/str() helpers
  auth/bearerGuard.ts      static-bearer GQLoom middleware (seam for Better Auth)
  erpnext/erpnext.service  ERPNext REST client (token auth, getList/getDoc)
  gear/                    gear.gql.schema | .service | .resolver  (bearer-guarded)
  tag/                     tag.gql.schema  | .service | .resolver  (PUBLIC)
```

The API is deliberately domain-agnostic ("just API", not gear-specific) — gear
is simply its first domain. Add domains as sibling folders and weave them in.

## GraphQL

- `resolveGearTag(token: String!)` — **public**, used by zebrapig.com/t/<token>.
  Returns `{ token, valid, found, name, category, model, manufacturer, status }`.
  Normalizes the Crockford token; never errors on unknown tokens (`found=false`).
- `gearUnits(category, status)`, `gearUnit(name)`, `gearCategories` — **require
  `Authorization: Bearer <API_BEARER_TOKEN>`** (temporary; Better Auth later).

## Auth

- **api → ERPNext:** Frappe API key of the scoped **"API"** service user
  (`api@zebrapig.com`, read-only on the gear doctypes), sent as
  `Authorization: token ERP_API_KEY:ERP_API_SECRET`.
- **client → api:** public resolver is open; privileged reads need the static
  bearer. Mobile-app per-user auth = Better Auth (copied from filmkit) — wired
  later; swap `bearerGuard()` for `authGuard()`.

## Config

`vars` (wrangler.jsonc): `ENVIRONMENT`, `ERP_BASE_URL`.
Secrets (`wrangler secret put …`): `ERP_API_KEY`, `ERP_API_SECRET`, `API_BEARER_TOKEN`.
Local: copy `.dev.vars.example` → `.dev.vars`.

## Develop / deploy

```sh
pnpm --filter api dev      # wrangler dev on :3001, graphiql at /graphql
pnpm --filter api deploy   # wrangler deploy -> zebrapig-api (api.zebrapig.com)
```

Before the first deploy, set the three secrets and the custom domain:

```sh
wrangler secret put ERP_API_KEY
wrangler secret put ERP_API_SECRET
wrangler secret put API_BEARER_TOKEN
# api.zebrapig.com is declared in wrangler.jsonc `routes`; it also needs a
# proxied DNS record in the Cloudflare zone for zebrapig.com.
```
