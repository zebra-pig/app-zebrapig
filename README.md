# app-zebrapig

pnpm monorepo for the Zebra & Pig web presence.

## Structure

- `apps/web-client` — the public Nuxt 4 site (zebrapig.com). Deploys to
  Cloudflare Workers as `zebrapig-web-client-production`.

## Develop

```sh
pnpm install
pnpm dev        # runs apps/web-client
```

## Build

```sh
pnpm build      # nuxt build with the cloudflare_module nitro preset
```

## Deploy

Deployment is automated via **Cloudflare Workers Builds** connected to this
repo (branch `main`, root `apps/web-client`): `pnpm run build` then
`npx wrangler deploy`. Build-time env vars (`APP_NAME`, `BASE_URL`,
`CONTENT_ENDPOINT`, `GQL_HOST`, `GQL_TOKEN`, `GQL_PRIVATE_TOKEN`) are set in
the Cloudflare dashboard, not committed here.
