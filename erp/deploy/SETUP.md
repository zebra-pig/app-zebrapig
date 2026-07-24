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
  --secret id=apps_json,src=erp/image/apps.json \
  --build-arg FRAPPE_BRANCH=version-16 \
  -t ghcr.io/zebra-pig/erp-zebrapig:local \
  erp
```
(Python 3.14 / Node 24 / bookworm are baked as Containerfile defaults for v16.)

---

## Updating to a new image (routine — the normal day-to-day flow)

Use this whenever you change the `gear` app or bump an app version. The initial
v15→v16 cutover below was a one-off; this is the repeatable loop.

**1. Build & get the new image reference.** Push your change to `app-zebrapig`
`main` (any change under `erp/**` triggers the *Build ERP image* workflow), or
run the workflow manually. When it's green, grab the immutable reference — the
**digest** is safest (auditable, can't move):

```sh
# from your Mac (needs GHCR read; or read it off the Actions run summary)
docker manifest inspect ghcr.io/zebra-pig/erp-zebrapig:latest \
  | grep -m1 '"digest"'                      # -> sha256:...
# the build also tags :sha-<commit>, which you can use instead of :latest
```

**2. On the VPS — back up first, always.**

```sh
sudo docker exec erpnext-one-backend-1 \
  bench --site erp.zebrapig.com backup --with-files
sudo docker cp erpnext-one-backend-1:/home/frappe/frappe-bench/sites/erp.zebrapig.com/private/backups \
  /home/ubuntu/backups-$(date +%F)     # copy off the container
```

**3. Free disk if needed.** The `sites` data volume + MariaDB are untouched by an
image swap, but the new image layer (~3 GB) must fit. Check `df -h /`; if tight,
`sudo docker image prune -f` (dangling) and, once you trust the new image, remove
the previous one. Keep at least one previous image for rollback.

**4. Point the compose at the new image and pull + recreate.** The live stack is
`/root/gitops/erpnext-one.yaml`; every service uses the same image line.

```sh
sudo cp /root/gitops/erpnext-one.yaml /root/gitops/erpnext-one.yaml.bak-$(date +%F)
# replace the image digest (or use :latest). NEW= the sha256:... from step 1:
sudo sed -i "s|ghcr.io/zebra-pig/erp-zebrapig@sha256:[0-9a-f]*|ghcr.io/zebra-pig/erp-zebrapig@$NEW|g" \
  /root/gitops/erpnext-one.yaml
sudo bash -c 'cd /root/gitops && docker compose -f erpnext-one.yaml up -d'
```

**5. Migrate + verify.** `migrate` applies any doctype/schema changes from the
new image (and auto-enables maintenance mode for the duration).

```sh
sudo docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com migrate
sudo docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com list-apps
curl -s -o /dev/null -w "%{http_code}\n" https://erp.zebrapig.com/login   # 200
```

**6. Rollback** if anything's wrong: put the previous digest back in
`erpnext-one.yaml` (or restore `erpnext-one.yaml.bak-*`), `up -d`, and if a
migration already ran, `bench … restore` the step-2 backup.

> Notes: (a) The compose pins by **digest** so `up -d` pulls exactly that image.
> With `:latest` + `pull_policy: always` it pulls whatever `:latest` currently
> points to — convenient but not auditable. (b) `docker exec … bench …` needs
> `sudo` (the `ubuntu` user isn't in the docker group). (c) Any new "DocType X
> not found" during migrate is the removed-doctype pattern — see the gotchas
> section below.

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

`apps.json` ships `erpnext`, `hrms`, `payments` (all `version-16`). Every app
installed on the site (`list-apps`) must be present in the image or `bench
migrate` fails. Recon (2026-07): installed = frappe, erpnext, hrms, payments —
`crm` is **not** installed, so it's intentionally omitted.

### Phase 0 — swap to our v16 image (this is a major v15 → v16 upgrade)

The old `arnadeem/erpnext-hrms:15.47.8` runs frappe/erpnext 15 with an
hrms **16.0.0-dev** snapshot. Our image is coherent **version-16 stable**
(frappe 16.28 / erpnext 16.29 / hrms 16.14 / payments), so `bench migrate` runs
a real **v15 → v16 major upgrade**. Everything moves forward (incl. hrms dev →
stable), but major upgrades can break customizations/reports/print formats.

> **Test on a copy first.** Restore the latest backup into a throwaway site on
> the v16 image and run `migrate` there before touching production. Only cut over
> production once the copy migrates and spot-checks cleanly.

Disk note: the VPS was ~91% full. Free space (prune dangling images, drop unused
tags) before pulling the ~3 GB v16 image — see the top of this file.

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

### Known v15 → v16 upgrade gotchas (hit on the 2026-07 cutover)

v16 removed some doctypes/modules; stale references to them abort `migrate` or
crash session boot. Both are the same class of fix — remove the dangling
reference to the deleted doctype, `clear-cache`, retry. DB name below is the
hashed name from `sites/erp.zebrapig.com/site_config.json` (`db_name`).

1. **`migrate` fails: `ModuleNotFoundError: No module named 'frappe.social'`.**
   The removed "Social" module (Energy Points) is still in the DB, so schema sync
   tries to import its deleted package. Fix:
   ```sql
   UPDATE `tabDocType` SET module='Core' WHERE module='Social';
   DELETE FROM `tabModule Def` WHERE name='Social';
   ```
   then `bench --site <site> clear-cache` and re-run `migrate`.
   (This did NOT reproduce in a fresh new-site+restore test because the test's
   redis cache was seeded by the fresh v16 site before the v15 restore. Test
   in-place, or clear cache before the test migrate.)

2. **Login → `SessionBootFailed` / `DocType Blogger not found`.** A leftover
   User Permission grants access to a doctype v16 deleted (`Blogger`), so boot
   fails loading user permissions. Fix — delete User Permissions pointing at
   any non-existent doctype:
   ```sql
   DELETE FROM `tabUser Permission` WHERE allow NOT IN (SELECT name FROM `tabDocType`);
   ```
   then `clear-cache`.

General recipe for "DocType X not found" after the upgrade: find the dangling
reference (User Permission, Module Def, Property Setter, Custom Field, Report
`ref_doctype`, Workspace link…) to the removed doctype and delete/reassign it.

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
  --install-app erpnext --install-app hrms --install-app payments --install-app gear \
  --admin-password <admin-pw> erp.zebrapig.com
```
