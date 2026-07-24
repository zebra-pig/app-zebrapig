# ERP deployment & rollout

Production ERPNext for Zebra & Pig runs on the Infomaniak VPS with **Traefik**
(TLS termination) + a **shared MariaDB** + a per-project docker-compose stack
(`erpnext-one`, site `erp.zebrapig.com`).

This directory is the single source of truth for that deployment. The custom
image is built from [`../image`](../image) and the `gear` app from
[`../gear`](../gear).

- `erpnext-one.yaml` — the app stack, pointed at `ghcr.io/zebra-pig/erp-zebrapig:latest`.
- `overrides/` — Traefik (+ SSL) and shared-MariaDB compose overrides.
- `example.env` — reference env vars.

> Data lives in the **external MariaDB** and the `erpnext-one_sites` docker
> volume. Neither is part of the image, so swapping images never touches data.
> Always take a backup first anyway (below).

---

## 0. One-time: let the VPS pull the private GHCR image

The image is a **private** GHCR package. On the VPS, log docker into GHCR with a
Personal Access Token that has `read:packages`:

```sh
echo <GHCR_PAT> | docker login ghcr.io -u <github-username> --password-stdin
```

(Do this once; the credential is cached in `~/.docker/config.json`.)

---

## Building the image

Preferred: **GitHub Actions** — run the *Build ERP image* workflow (manual
dispatch, or automatically on pushes touching `erp/**`). It pushes
`ghcr.io/zebra-pig/erp-zebrapig:latest`, `:sha-<git-sha>`, and any tag you pass.

Local build (from the monorepo root) for testing:

```sh
docker build \
  -f erp/image/Containerfile \
  --build-arg APPS_JSON_BASE64=$(base64 -w0 erp/image/apps.json) \
  --build-arg FRAPPE_BRANCH=version-15 \
  --build-arg PYTHON_VERSION=3.11.9 \
  --build-arg NODE_VERSION=20.19.4 \
  -t ghcr.io/zebra-pig/erp-zebrapig:local \
  erp
```

---

## Rollout — two phases

### Pre-flight (always)

```sh
# What is actually installed? (image must contain every installed app)
docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com list-apps

# Backup DB + files before any image swap.
docker exec erpnext-one-backend-1 \
  bench --site erp.zebrapig.com backup --with-files
# copy the backup off the box (sites/erp.zebrapig.com/private/backups)
```

`apps.json` ships `erpnext`, `hrms`, `crm`. If `list-apps` shows an app that is
**not** in the image, add it to `apps.json` and rebuild before cutting over —
otherwise `bench migrate` fails.

### Phase 0 — swap to our own image, no functional change

Reproduces today's capabilities (Frappe + ERPNext + HRMS + CRM) from an image
**we** build and control. Built from the tip of `version-15`, so `migrate` runs
a forward migration from 15.47.8 to current — expected and safe on a backup.

```sh
cd erp/deploy
# erpnext-one.yaml already points at :latest
docker compose --project-name erpnext-one \
  --env-file ~/gitops/erpnext-one.env \
  -f erpnext-one.yaml pull
docker compose --project-name erpnext-one \
  --env-file ~/gitops/erpnext-one.env \
  -f erpnext-one.yaml up -d
docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com migrate
```

Verify: site loads, log in, spot-check ERPNext/HRMS/CRM. **This proves the build
+ deploy pipeline before any schema change.**

### Phase 1 — enable the gear module

The image already contains the `gear` app (baked in at build time). Install it
on the site once, then migrate:

```sh
docker exec erpnext-one-backend-1 \
  bench --site erp.zebrapig.com install-app gear
docker exec erpnext-one-backend-1 \
  bench --site erp.zebrapig.com migrate
```

`install-app` creates the Gear Category / Gear Unit / Gear Movement / Gear
Checkout Session tables. Existing data is untouched. Confirm the **Gear
Management** module and its doctypes appear in the desk.

> Pin instead of `:latest` for auditable rollouts: build with a tag like
> `15-gear-0.1.0`, set that in `erpnext-one.yaml`, commit, then pull/up.

### Rollback

Set the image back to the previous tag (or `arnadeem/erpnext-hrms:15.47.8`) in
`erpnext-one.yaml`, `docker compose ... up -d`. If a migration changed schema,
restore the pre-rollout backup.

---

## Fresh-server bootstrap (reference)

Only needed to stand up a brand-new host; the running VPS is already set up.

```sh
# Traefik
echo 'TRAEFIK_DOMAIN=traefik.vps2.zebrapig.com' >  ~/gitops/traefik.env
echo 'EMAIL=info@zebrapig.com'                   >> ~/gitops/traefik.env
echo 'HASHED_PASSWORD='$(openssl passwd -apr1 <pw> | sed -e 's/\$/\$\$/g') >> ~/gitops/traefik.env
docker compose --project-name traefik --env-file ~/gitops/traefik.env \
  -f overrides/compose.traefik.yaml -f overrides/compose.traefik-ssl.yaml up -d

# Shared MariaDB
echo "DB_PASSWORD=<db-pw>" > ~/gitops/mariadb.env
docker compose --project-name mariadb --env-file ~/gitops/mariadb.env \
  -f overrides/compose.mariadb-shared.yaml up -d

# App stack env
cp example.env ~/gitops/erpnext-one.env
#   set DB_PASSWORD, DB_HOST=mariadb-database, DB_PORT=3306,
#   SITES=`erp.zebrapig.com`, ROUTER=erpnext-one, BENCH_NETWORK=erpnext-one

docker compose --project-name erpnext-one --env-file ~/gitops/erpnext-one.env \
  -f erpnext-one.yaml up -d

# New site (or restore a backup with bench restore)
docker compose --project-name erpnext-one exec backend \
  bench new-site --mariadb-user-host-login-scope=% \
  --db-root-password <db-pw> \
  --install-app erpnext --install-app hrms --install-app crm --install-app gear \
  --admin-password <admin-pw> erp.zebrapig.com
```
