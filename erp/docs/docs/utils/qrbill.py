"""Swiss QR-bill, generated inside the ERP.

Replaces the `qrbill-microservice` Cloudflare Worker that a `before_save` Server
Script used to call. That arrangement had three problems: a bearer token sat in
the database in plain text, the script raised on any failure so an unreachable
Worker made the invoice **unsaveable**, and each invoice stored ~196 KB of
returned SVG — about 91% of the Sales Invoice table.

The bill is derived from the document at print time and never stored. Nothing
here may raise: a document that cannot carry a QR-bill simply prints without one,
because failing to draw a payment slip must not stop an invoice from printing.

Payload conformance is `chqr`'s job (Swiss Payment Standards v2.3); this module's
job is turning ERPNext's data model into the fields the standard wants.
"""

import re
from decimal import Decimal, InvalidOperation

import frappe

# The QR-bill exists only for payments in these currencies, to a CH/LI IBAN.
SUPPORTED_CURRENCIES = ("CHF", "EUR")
QR_IBAN_COUNTRIES = ("CH", "LI")

# "Sonneckstrasse 4", "Rue du Stand 26a", "Bahnhofstrasse 1b" -> street + number.
# The standard keeps them in separate fields; ERPNext stores one address line.
STREET_AND_NUMBER = re.compile(r"^(?P<street>.*?)[\s,]+(?P<number>\d+\s*[a-zA-Z]?)$")


def split_street(line: str) -> tuple[str, str | None]:
	"""Split a one-line street into street name and building number."""
	line = (line or "").strip()
	if not line:
		return "", None
	match = STREET_AND_NUMBER.match(line)
	if not match:
		return line, None
	return match.group("street").strip(), match.group("number").strip()


def _country_code(country: str | None) -> str | None:
	if not country:
		return None
	code = frappe.db.get_value("Country", country, "code")
	return code.upper() if code else None


def _party(name, address, cls):
	"""Build a chqr Creditor/UltimateDebtor, or None if the address is unusable."""
	if not (name and address):
		return None
	city, postal_code = address.get("city"), address.get("pincode")
	country = _country_code(address.get("country"))
	if not (city and postal_code and country):
		return None
	street, number = split_street(address.get("address_line1"))
	return cls(
		name=name[:70],
		street=street[:70] or None,
		building_number=number,
		postal_code=str(postal_code)[:16],
		city=city[:35],
		country=country,
	)


def qr_bill_svg(doc, language: str = "de") -> str:
	"""The payment part as an SVG string, or "" when one cannot be produced.

	Called from the invoice print format. Returns markup, never raises.
	"""
	try:
		return _build(doc, language)
	except Exception:
		frappe.log_error(
			title="QR-bill generation failed",
			message=f"{doc.doctype} {doc.name}\n\n{frappe.get_traceback()}",
		)
		return ""


def _build(doc, language: str) -> str:
	from chqr import Creditor, QRBill, UltimateDebtor

	from docs.utils.context import document_context

	ctx = document_context(doc)
	iban = (ctx.bank_account.get("iban") or "").replace(" ", "").upper()
	if not iban or iban[:2] not in QR_IBAN_COUNTRIES:
		return ""

	currency = (doc.get("currency") or "").upper()
	if currency not in SUPPORTED_CURRENCIES:
		return ""

	try:
		amount = Decimal(str(doc.get("grand_total") or 0)).quantize(Decimal("0.01"))
	except (InvalidOperation, TypeError):
		return ""
	if amount <= 0:
		return ""

	creditor = _party(ctx.company.get("name"), ctx.company_address, Creditor)
	if not creditor:
		return ""  # the payee is mandatory; without it there is no valid bill

	# The debtor is optional — an incomplete customer address yields a bill with
	# a blank "Zahlbar durch" field, which is valid and still scannable.
	debtor = _party(doc.get("customer_name") or doc.get("party_name"), ctx.address, UltimateDebtor)

	bill = QRBill(
		account=iban,
		creditor=creditor,
		currency=currency,
		amount=amount,
		reference_type="NON",
		additional_information=(doc.name or "")[:140] or None,
		debtor=debtor,
	)
	svg = bill.generate_svg(language=language)
	return svg if isinstance(svg, str) else svg.decode("utf-8")
