# ERP deployment & rollout

Production ERPNext for Zebra & Pig runs on the Infomaniak VPS with **Traefik**
(TLS termination) + a **shared MariaDB** + a per-project docker-compose stack
(`erpnext-one`, site `erp.zebrapig.com`).

This directory is the single source of truth for that deployment. The custom
image is built from [`../image`](../image) and the `gear` app from
[`../gear`](../gear).

- `erpnext-one.yaml` — the app stack, pointed at `ghcr.io/zebra-pig/erp-zebrapig:latest`.
- `overrides/` — Traefik (+ SSL) and shared-MariaDB compose overrides.
- `egress-v6` — external docker network that gives the containers outbound
  internet access (see *Host networking* below). Must exist before `up`.
- `example.env` — reference env vars.

> Data lives in the **external MariaDB** and the `erpnext-one_sites` docker
> volume. Neither is part of the image, so swapping images never touches data.
> Always take a backup first anyway (below).

---

## Host networking — the VPS is IPv6-only (read this first)

`zebrapig-vps-2` (Infomaniak) has **no public IPv4 address at all** — only
`2001:1600:10:101::2e/128`. The host reaches the internet fine over IPv6, but
docker bridge networks are IPv4-only by default, so containers get an RFC1918
address with **nothing to NAT onto**. Symptom: DNS resolves (AAAA comes back),
every outbound connection then times out or is refused.

That silently breaks *all* ERP egress — outgoing mail, external APIs, and the
QR-bill microservice — while the site itself keeps serving fine, because inbound
through Traefik is unaffected.

### The host's own interface config — total outage, 2026-08-21

The VPS lost **all** networking across a reboot and had to be recovered through
Infomaniak's VNC console. Cause: two stale netplan files, so nothing matched the
one real NIC.

- `50-cloud-init.yaml` matched `ens3` on MAC `fa:16:3e:4a:0f:b3` — the ext-net
  port **detached on 2026-08-13**. cloud-init never regenerates this file (its
  config-drive is a static ISO from instance creation in 2023).
- `99-ens8.yaml` matched on `name: ens8`. Once the old port was detached, the
  kernel renumbered the survivor from `ens8` back to `ens3` on the next boot, so
  that match went stale too.

The port was attached *without a reboot*, so this stayed invisible for 8 days —
the next boot was the first time either match was re-evaluated.

**It does not look like a network fault.** On-link neighbours can still complete
a TCP handshake, so sshd and Traefik accept connections on 22/80/443 and then
never send a byte. It reads as a hung host. Diagnose from another VPS on the
same segment: `ping6` works, TCP connects, nothing ever replies.

**Fix in place:** a single authoritative `/etc/netplan/60-ext-v6.yaml` matching
the real NIC by MAC (`fa:16:3e:5c:7d:50`), with a **static** address, default
route and resolvers; cloud-init network config disabled via
`/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`. Statics were chosen
deliberately: `egress-v6` sets `net.ipv6.conf.all.forwarding=1`, and with
forwarding on the kernel ignores Router Advertisements unless `accept_ra=2` — so
the RA-derived default route (~5 min lifetime) can expire and never be renewed.
Old files are kept in `/root/netplan.bak-2026-08-21/`.

> The gateway `fe80::f816:3eff:feb3:5ec5` is link-local, derived from the
> provider router's MAC. Stable in practice — vps-1 learns the same one via RA —
> but if Infomaniak replaces that router it goes stale. Cross-check on vps-1:
> `ip -6 route show default`.
>
> The host is now **single-homed**. Do not re-add source-based routing unless a
> second IPv6 port is genuinely attached; with one interface there is no ECMP
> and no reply asymmetry to correct.

**Fix in place:** an external, IPv6-enabled network `egress-v6`. Docker ≥ 27
does NAT66 for ULA prefixes automatically (no `daemon.json` change needed):

```sh
docker network create --ipv6 \
  --subnet 172.23.0.0/16 --subnet fd00:e12b:2::/64 egress-v6
```

`erpnext-one.yaml` attaches it to exactly the four services that make outbound
calls: `backend`, `queue-short`, `queue-long`, `scheduler`.

> **Why a separate network and not `enable_ipv6` on `bench-network`?**
> Turning on IPv6 for the shared bench network gives `backend` an AAAA record.
> The frontend's nginx then resolves `backend` to IPv6 first, but gunicorn binds
> `0.0.0.0:8000` only — every upstream connect fails with `Connection refused`
> before nginx retries over IPv4. Keeping `bench-network` IPv4-only means nginx
> only ever sees the IPv4 address. Do not add `enable_ipv6` to `bench-network`.

Verify egress after any change:

```sh
docker exec erpnext-one-backend-1 \
  curl -sS -m 10 -o /dev/null -w '%{http_code} via %{remote_ip}\n' \
  https://qrbill-microservice.zebrapig.workers.dev     # expect 200 via 2606:...
```

### Consequence: every outbound call paid a 7-second IPv4 stall

`egress-v6` uses a **ULA** prefix (`fd00:e12b:2::/64`) because that is what Docker
NAT66s automatically. That has a non-obvious side effect on address selection.

glibc's default `gai.conf` labels `fc00::/7` **6** and global IPv6 **1**, and
RFC 6724 destination rule 5 ("prefer matching label") is evaluated *before*
precedence. With a ULA source address, glibc therefore sorts the **IPv4** address
of every dual-stack host first. The containers' IPv4 default route points at the
docker bridge and dies there — the host has no IPv4 at all — so each outbound
connection burned **~7.2s** on a blackholed IPv4 SYN (1+2+4s retries) before
falling back to IPv6.

Symptom: the site is fast, but anything doing a *server-side* HTTP call is not.
Google OAuth login makes several calls in sequence and took **45–50s**
(Traefik access log, 19–21 Aug 2026) — starting the same evening `egress-v6`
was created. Outgoing mail and the QR-bill microservice paid the same tax.

Fixed in the image (`erp/image/Containerfile`) by relabelling `fc00::/7` to `1`
in `/etc/gai.conf`, which makes the ULA source match global IPv6 destinations so
precedence (IPv6 40 > IPv4 35) puts IPv6 first. Measured in
`erpnext-one-backend-1`: **7.29s -> 0.10s** per call to the Google token endpoint.

> ⚠️ **`curl` cannot detect this.** curl does Happy Eyeballs — it races v4 and v6
> and reports the winner, so the egress check above returns a healthy `200` in
> ~200ms even while every Python call is stalling 7s. Verify with the resolver
> order, or with `requests`, not curl:
>
> ```sh
> docker exec erpnext-one-backend-1 python3 -c \
>   "import socket;print([('v6' if a[0]==socket.AF_INET6 else 'v4') for a in \
>    socket.getaddrinfo('accounts.google.com',443,type=socket.SOCK_STREAM)])"
> # expect ['v6', 'v4'] — if 'v4' is first, /etc/gai.conf is not in effect
> ```

### Consequence: `docker pull` from ghcr.io is broken

**ghcr.io is IPv4-only.** The docker daemon cannot reach it from this host:

```
Get "https://ghcr.io/v2/": dial tcp 140.82.121.33:443: connect: network is unreachable
```

`erpnext-one.yaml` sets `pull_policy: always`, so a plain `docker compose up -d`
**fails and leaves the stack down**. Until a NAT64 resolver or a registry mirror
is in place, bring the stack up with the locally cached image:

```sh
docker compose -f erpnext-one.yaml up -d --pull never
```

New images have to reach the box another way (e.g. `docker save` / `docker load`
over the Tailscale link, or a dual-stack registry such as Docker Hub).

### PDF rendering: Chromium, not wkhtmltopdf

`frappe.utils.pdf.get_pdf` is hard-wired to wkhtmltopdf. The Chromium generator is
selected **per Print Format** (`Print Format.pdf_generator`), not in Print
Settings — setting it there does nothing. Our formats ship with it set to
`chrome`.

Two pieces of state live in the sites volume rather than the image, so they
survive an image swap but need restoring on a fresh site:

```json
// sites/common_site_config.json
"chromium_path": "chromium-print-shell"
```

Without that key Frappe tries to download its own Chromium and fails (ghcr-style
IPv4-only host). `chromium-print-shell` is a wrapper baked into the image that
adds `--font-render-hinting=none`; see the Containerfile for why.

### Known-unhealthy: origin TLS certificate

Traefik serves `TRAEFIK DEFAULT CERT` (self-signed) for `erp.zebrapig.com` —
`acme.json` only ever held a cert for `traefik.vps2.zebrapig.com`. It works
today because Cloudflare fronts the origin in **Full** (not Full-strict) mode.
Let's Encrypt cannot be fixed by IPv6 egress alone: the `tlschallenge` needs LE
to connect *inbound* to port 443, which lands on Cloudflare, not the origin. Use
a Cloudflare **Origin Certificate**, or switch the resolver to a DNS-01
challenge, if you want a real cert at the origin.

---

## Performance — log-table bloat makes every login slow

Symptom: the site is fast (median `/desk` **220ms**) but the **first `/desk` load
after a login** takes **11–16s**. Bimodal latency like this is the tell.

Profiled with `cProfile` on 2026-08-21:

```
get_bootinfo                              13.26s
└─ get_sidebar_items                      12.42s
   └─ is_item_allowed (821x) -> has_permission (494x)
      └─ get_lazy_doc (75x)               10.79s
         └─ System Health Report.load_from_db   9.80s
            └─ fetch_scheduler -> 2 SQL queries 9.66s
```

Building the desk sidebar permission-checks every item. `System Health Report`
is a **virtual DocType**, so `has_permission` instantiates it — which runs the
entire health report on every login. (The `UserWarning: Virtual doctypes don't
support lazy loading: System Health Report` in `frappe.log` is this firing.)

Its scheduler query aggregates 7 days of `tabScheduled Job Log`. That table had
grown to **157,086 rows / 384 MB** — larger than all business data combined —
against an `innodb_buffer_pool_size` of only **128 MB**. The 7-day working set
could not stay cached, so the query did physical I/O and took **9.7s**. The
giveaway: the same query over *1 day* ran in **0.12s**. It is buffer-pool
thrashing, not row count.

Retention was set to 90 days, which is simply too long for a 2 GB box.

**Fix applied** — retention cut to 7 days in **Log Settings**, old rows deleted
in 5,000-row batches (delete them in batches; one 145k-row transaction on 1 vCPU
is a long lock), then the tablespace compacted:

```sh
# in Log Settings: Scheduled Job Log -> 7 days, then:
DELETE FROM `tabScheduled Job Log` WHERE creation < NOW() - INTERVAL 7 DAY LIMIT 5000;  -- repeat
OPTIMIZE TABLE `tabScheduled Job Log`;    -- 380MB -> 38MB, ~2s
```

Measured result:

| | before | after |
|---|---|---|
| health-check query | 9.7 s | **0.15 s** |
| cold `get_bootinfo` | 13.2 s | **0.8–1.2 s** (5.7 s on a fully cold cache) |
| first `/desk` after login | 11–16 s | expect ~2–4 s |

Frappe's daily `run_log_clean_up` now keeps the table at ~12k rows. Re-check with:

```sh
docker exec mariadb-database mariadb -u<db> -p<pw> <db> -e \
  "SELECT COUNT(*), ROUND((data_length+index_length)/1024/1024) mb
   FROM information_schema.tables t, \`tabScheduled Job Log\`
   WHERE t.table_name='tabScheduled Job Log' AND t.table_schema=DATABASE();"
```

> The host has **1 vCPU / 2 GB and no swap**. That is the standing constraint
> behind this class of problem — any table that outgrows the 128 MB buffer pool
> turns into disk I/O. Watch `/proc/pressure/io`; it hit `full avg10=55%` during
> the 2026-08-21 incident.

---

## 0. One-time: let the VPS pull the private GHCR image

The image is a **private** GHCR package. On the VPS, log docker into GHCR with a
Personal Access Token that has `read:packages`:

```sh
echo <GHCR_PAT> | docker login ghcr.io -u <github-username> --password-stdin
```

(Do this once; the credential is cached in `~/.docker/config.json`.)

> Note: on vps-2 this login succeeds only if the daemon can reach ghcr.io —
> which it currently cannot (IPv6-only host). See *Host networking* above.

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

> ⛔ **This step currently fails on vps-2.** The host is IPv6-only and ghcr.io is
> IPv4-only, so `docker compose up -d` (with `pull_policy: always`) errors with
> `network is unreachable` **after `down` has already removed the containers** —
> i.e. it leaves the ERP hard down. Get the image onto the box first, then bring
> the stack up with `--pull never`. See *Host networking* above.
>
> ```sh
> # from your Mac, over Tailscale — moves the image without touching ghcr.io
> docker pull ghcr.io/zebra-pig/erp-zebrapig@$NEW
> docker save ghcr.io/zebra-pig/erp-zebrapig@$NEW | \
>   ssh root@zebrapig-vps-2 'docker load'
> ```

```sh
sudo cp /root/gitops/erpnext-one.yaml /root/gitops/erpnext-one.yaml.bak-$(date +%F)
# replace the image digest (or use :latest). NEW= the sha256:... from step 1:
sudo sed -i "s|ghcr.io/zebra-pig/erp-zebrapig@sha256:[0-9a-f]*|ghcr.io/zebra-pig/erp-zebrapig@$NEW|g" \
  /root/gitops/erpnext-one.yaml
sudo bash -c 'cd /root/gitops && docker compose -f erpnext-one.yaml up -d --pull never'
```

**5. Migrate + verify.** `migrate` applies any doctype/schema changes from the
new image (and auto-enables maintenance mode for the duration).

```sh
sudo docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com migrate
sudo docker exec erpnext-one-backend-1 bench --site erp.zebrapig.com list-apps
curl -s -o /dev/null -w "%{http_code}\n" https://erp.zebrapig.com/login   # 200
```

**5b. ALWAYS prune old images after a good deploy.** Every deploy pulls a new
~3 GB image; without this they pile up and fill the disk (which hangs Docker
*and* sshd — a hard outage). Once you're happy with the new version:

```sh
sudo docker image prune -a -f   # removes images no running container uses
df -h /
```

Note: gear-only changes now rebuild only a thin top layer, so their pulls are a
few MB — but full-stack rebuilds (Frappe/ERPNext version bumps) are still ~3 GB.

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

# Outbound-internet network (IPv6-only host — see 'Host networking' above)
docker network create --ipv6 \
  --subnet 172.23.0.0/16 --subnet fd00:e12b:2::/64 egress-v6

docker compose --project-name erpnext-one --env-file ~/gitops/erpnext-one.env \
  -f erpnext-one.yaml up -d --pull never

# New site (or restore a backup with bench restore)
docker compose --project-name erpnext-one exec backend \
  bench new-site --mariadb-user-host-login-scope=% \
  --db-root-password <db-pw> \
  --install-app erpnext --install-app hrms --install-app payments --install-app gear \
  --admin-password <admin-pw> erp.zebrapig.com
```
