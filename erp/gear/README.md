# gear

A deliberately sleek Frappe app for tracking Zebra & Pig equipment ("gear").

It owns the **tables and the invariants** only — everything user-facing (scan
sessions, the public `/t/<token>` resolver, the mobile app) is served by the
separate GQLoom + Hono API and web client, which talk to this app over Frappe's
auto-generated REST API.

## DocTypes

| DocType | Purpose |
|---|---|
| **Gear Category** | Master list of categories (CAM, LEN, AUD…) with an `abbr` used in unit names. |
| **Gear Unit** | A single trackable item. Auto-named `ABBR-NN`. Carries an opaque `tag_token`. |
| **Gear Movement** | Immutable-ish event log: check-out / check-in / transfer / repair / lost / found. |
| **Gear Checkout Session** | Groups movements for one checkout. |
| **Gear Session Item** | Child rows of a session. |

## The only server logic

- `tag_token` is generated server-side on insert (Crockford Base32, 16 chars +
  check symbol, QR-alnum-safe — see `gear/utils/token.py`).
- Token format + uniqueness are validated.
- Committing a movement for a **BOUND** parent unit auto-creates movements for
  its bound children (scan the switcher → its power brick moves too).

Everything else is intentionally left to the API layer.

## Install

```sh
bench get-app gear /path/to/erp/gear
bench --site <site> install-app gear
```
