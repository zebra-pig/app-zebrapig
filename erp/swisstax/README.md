# swisstax

Swiss statutory paperwork for the ERPNext site: the **salary certificate**
(Lohnausweis, Formular 11) and the **simplified annual statement** a
self-employed person attaches to their tax return.

Like `gear`, the app stays thin — doctypes, the rules that keep a document
legal, and two print formats. Nothing else.

## What it produces

### 1 · Lohnausweis / Rentenbescheinigung (Formular 11)

A faithful reproduction of the official ESTV form on plain white paper, which
Rz 75 of the SSK/ESTV *Wegleitung* names as the normal route for payroll
software. Labels, rules and field boxes are read out of the official PDF's own
geometry by [`tools/build_form11_template.py`](tools/build_form11_template.py)
and emitted as absolute millimetres, so the sheet lines up with the printed
form to well under a millimetre.

`Swiss Salary Certificate` enforces what the Wegleitung requires:

| Rule | Source |
|---|---|
| whole francs only | the form's own «Nur ganze Frankenbeträge» |
| box 8 = boxes 1–7, box 11 = 8 − 9 − 10 | Rz 41, Rz 47 |
| AHVN13 with a valid check digit | Buchstabe C, Rz 6 |
| period inside the certified calendar year | Rz 7, Rz 8 |
| naming the kind for boxes 2.3, 3, 4, 7, 13.1.2, 13.2.3 | Rz 26–31, 54, 58 |
| box 13.1.1 — a cross **or** an amount, never both | Rz 52, 53 |
| no cross in 13.1.1 when an approved expense regulation is noted in 15 | Rz 65 |
| field F when a company car is declared in 2.2 (advisory) | Rz 25 |
| an annex is due whenever box 5 is used (advisory) | Rz 29 |

**Fields H and I fill themselves.** Field H (Rz 11 — the employee's name and
current residential address) comes from the Employee's *Current Address*,
falling back to *Permanent Address*; ERPNext stores these as free text, so
trailing spaces and blank lines are stripped, the block being sized for a window
envelope. Field I (Rz 12 — the employer's name, exact address, the responsible
person and their phone) is derived from the Company and its primary Address; only
the responsible person is configured, in *Swiss Tax Settings*, since nothing on
the Company records it. Both fill in when the employee is chosen and again on
save, so documents created through the API behave the same. An employee with no
address on file gets a warning naming the record rather than a silently short
block, and `Swiss Tax Settings.employer_block` overrides field I verbatim when
the exact wording matters.

**Pull from Salary Slips** aggregates the year's submitted slips into the boxes,
using the component map in *Swiss Tax Settings*. A Salary Component that is not
mapped is a hard error — a component may be excluded, but only deliberately, by
assigning it *Not on the certificate*. Rz 7 does not tolerate a silent omission.

> **On the 2D barcode.** Certificates printed by Swissdec-certified payroll
> software carry a PDF417 barcode. That barcode is part of Swissdec
> certification and may not be emitted by uncertified software, so this app does
> not fake one. A certificate without it is complete and accepted; the SSK's own
> free *eLohnausweis SSK* web application produces the barcoded variant if a
> canton ever asks for it. eCH-0270 standardises barcode generation for tax
> documents in general, but the companion standard that would define the
> Lohnausweis XML has not been published.

### 2 · Vereinfachter Jahresabschluss

`Swiss Simplified Annual Statement` builds, from the general ledger, the exact
package Art. 125 Abs. 2 DBG asks a self-employed person to sign and attach:

1. Aufstellung über **Einnahmen und Ausgaben**
2. Aufstellung über **Aktiven und Passiven** (Vermögenslage)
3. Aufstellung über **Privatentnahmen und Privateinlagen**
4. plus the **Übertrag auf Formular 15a** — the same figures in the boxes of the
   federal questionnaire that accompanies the return

Prior-year columns come with it (Art. 958d Abs. 2 OR), and the document states
its own statutory position:

| Threshold | Meaning |
|---|---|
| turnover < CHF 500'000 | only income, expenditure and the asset position must be recorded — Art. 957 Abs. 2 Ziff. 1 OR; GoB apply by analogy, Art. 957 Abs. 3 OR |
| net revenue ≤ CHF 100'000 | accruals may be waived, receipts/payments suffice — Art. 958b Abs. 2 OR; also the VAT registration threshold, Art. 10 Abs. 2 Bst. a MWSTG |

ERPNext keeps a full double-entry ledger, which is a superset of what
Art. 957 Abs. 2 OR demands, so the statement reports the books as booked. That
is always acceptable — the simplified regime is a floor, not a ceiling.

Mark the proprietor's equity accounts with **Swiss: Private Movement**
(*Privatentnahme* / *Privateinlage*); without them the third statement is empty
and the document says so.

## Setup

```sh
bench get-app swisstax /path/to/erp/swisstax
bench --site <site> install-app swisstax
```

Then, in the desk:

1. **Swiss Tax Settings** — employer block for field I, the place, an approved
   expense regulation if there is one, and the Salary Component → Ziffer map.
2. **Employee** — fill the `AHV Number (AHVN13)` field the app adds.
3. **Account** — tag the private-movement equity accounts.

## Typography

The form is set in Frutiger LT Com, which is not redistributable. Source Sans 3
(SIL OFL 1.1, in `tools/fonts/`) is the closest free match — weight-matched it
tracks Frutiger's advance widths to within about 3% across this form, and the
few trilingual lines that would still run long are squeezed by an exact
`scaleX` so they end where the original ends.

The four weights are embedded as base64 woff2 in
`swisstax/templates/includes/_swiss_fonts.html`, so the renderer needs neither a
network nor a system font. That is what makes Chrome, Safari and wkhtmltopdf
produce the same sheet.

## Regenerating the form template

```sh
python3 -m venv .venv && .venv/bin/pip install pdfplumber fonttools brotli
curl -sSLO https://www.estv.admin.ch/dam/de/sd-web/Nq1zXu8XwlCY/dbst-form-11lohna-rechts-dfi-de.pdf
.venv/bin/python tools/build_form11_template.py dbst-form-11lohna-rechts-dfi-de.pdf \
  --fonts tools/fonts --parts tools/form11_parts \
  --out swisstax/templates/includes/lohnausweis_form11.html
```

The surrounding markup — page frame, crop marks, address-window guide and the
Jinja value layer — lives in `tools/form11_parts/{head,tail}.html`; edit those,
never the generated file.

## Sources

- SSK/ESTV, *Wegleitung zum Ausfüllen des Lohnausweises bzw. der
  Rentenbescheinigung (Formular 11)*, gültig ab 1. Januar 2026
- ESTV, Formular 11 dfi 605.040.18N 01.21
- ESTV, Formular 15a *Fragebogen für Selbstständigerwerbende mit vereinfachter
  Buchführung* and Formular 15b (Wegleitung)
- OR Art. 957–958f; DBG Art. 125, 126; MWSTG Art. 10
