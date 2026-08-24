# docs

The print formats for the documents Zebra & Pig sends out — invoice, quotation,
order confirmation, payment receipt, employment certificate.

They used to live as HTML blobs in the site database, one self-contained copy per
document, each with its own inline `<style>`, its own nested layout tables and its
own copy of the letterhead and the footer. This app holds them as **standard**
print formats built from one shared macro library, so a change to the letterhead
or the footer lands on every document at once.

```
docs/templates/includes/
  _fonts.html      Inter, embedded as base64 woff2   (generated)
  _logo.html       the wordmark, as vector
  _signature.html  the handwritten signature, as vector
  _style.html      the one stylesheet all documents share
  _macros.html     letterhead / reference / address / items / totals / closing / footer
  sales_invoice.html  quotation.html  quotation_without_quantity.html
  sales_order.html    payment_entry.html  employment_certificate.html
```

Each print format record is one line — an `{% include %}` of the template above.
Everything else is in git.

## What changed, and what deliberately did not

The rendered documents are meant to look the same as before. What changed is
underneath:

- **Fonts actually arrive.** The old templates asked for `font-family: 'Inter'`
  with no `@font-face` anywhere — just a `<link rel="preconnect">`, which loads
  nothing. Chrome found Inter installed locally; Safari and the server did not,
  and fell back to DejaVu. Inter is now embedded as base64 woff2 *and* installed
  in the container image, so browser preview, server-side PDF and emailed
  attachment all set the same type. The footer's stray `font-family: Montserrat`
  — a font that exists nowhere — is gone.
- **No more `<!DOCTYPE html><html><head>…` inside a print format.** A format is
  injected into a page that already has those; nesting a second document is
  invalid and confuses the PDF engines.
- **No `* { font-size: 12px }`.** The universal selector flattened every heading;
  rules now name the elements they mean.
- **The logo is vector.** It was a 32 KB PNG fetched over the network from
  `erp.zebrapig.com` on every render — a request the PDF container had to make
  against its own public hostname. It is now an inline SVG that inherits
  `currentColor`.
- **A missing optional record no longer aborts the print.** The payment receipt
  raised «Address None not found» for any payer without a primary address;
  `docs.utils.context.document_context` degrades to blanks. The hardcoded
  `doc.company_address or "Zebra & Pig"` fallback is gone with it.
- **The item table's `margin-top: -10px`** is gone; it pulled the header row up
  into the sentence above it.

## The Swiss QR-bill

`docs/utils/qrbill.py` builds the payment part from the invoice at print time,
via [`chqr`](https://pypi.org/project/chqr/) (ISC, Swiss Payment Standards v2.3).
It replaces a `before_save` Server Script that called the
`qrbill-microservice` Cloudflare Worker. That arrangement had three problems:

* a bearer token sat in the database in plain text;
* the script raised on any failure, so an unreachable Worker made the invoice
  **unsaveable** — a document write depending on a remote HTTP call;
* each invoice stored ~196 KB of returned SVG. 93 invoices held 17.8 MB, about
  91% of the whole Sales Invoice table.

Generated here it is ~10 KB, produced on demand and never stored. Decoding both
QR codes and diffing the payloads field by field, the two agree on every value —
except that the microservice emitted `'Sonneckstrasse '` with a trailing space,
where the standard wants none. The old `qr_bill_html` field is left in place so
historical invoices keep their record; nothing reads it any more.

The payment part is 210 x 105 mm and must not be scaled, which is why the print
formats carry no page margin — see the note on `.print-format` in `_style.html`.

## Regenerating the embedded font

```sh
python3 tools/embed_fonts.py
```

Weights live in `tools/fonts/` (Inter, SIL OFL 1.1 — see `tools/fonts/OFL.txt`).

## Rollback

The formats as they were on 2026-08-23 are in
[`../print-formats-backup/`](../print-formats-backup/), one JSON per record plus
the extracted HTML and CSS. Re-importing a record there restores the previous
behaviour exactly.
