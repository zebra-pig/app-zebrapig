"""One safe lookup of everything a business document needs to print.

The templates this replaces each opened with half a dozen bare
``frappe.get_doc(...)`` calls, so a Payment Entry whose customer had no primary
address raised «Address None not found» instead of printing. Every lookup here
degrades to an empty ``_dict``, and every template reads through this one
context, so a missing optional record leaves a blank line rather than an error.
"""

import frappe

EMPTY = frappe._dict()


def _doc(doctype: str, name: str | None):
	if not name:
		return EMPTY
	try:
		return frappe.get_cached_doc(doctype, name)
	except frappe.DoesNotExistError:
		return EMPTY


def document_context(doc) -> frappe._dict:
	"""Company, addresses, contact and bank details for ``doc``.

	Works for Sales Invoice, Quotation, Sales Order and Payment Entry, which
	name the counterparty differently but need the same blocks.
	"""
	company = _doc("Company", doc.get("company"))
	company_address = _doc("Address", doc.get("company_address")) or EMPTY
	if not company_address and company:
		# Fall back to the company's own default address rather than a hardcoded name.
		company_address = _doc("Address", _default_company_address(company.name))

	contact = _doc("Contact", doc.get("contact_person"))
	return frappe._dict(
		company=company,
		company_address=company_address,
		company_country=_doc("Country", company_address.get("country")),
		address=_doc("Address", _party_address(doc)),
		contact=contact,
		contact_name=_greeting_name(doc, contact),
		bank_account=_bank_account(company),
	)


def _greeting_name(doc, contact) -> str:
	"""Who to greet. Falls back through the contact, the displayed contact and
	the party itself, so a document without a Contact record still reads as a
	letter rather than a bare «Hello»."""
	full = " ".join(p for p in (contact.get("first_name"), contact.get("last_name")) if p)
	return (
		full.strip()
		or (doc.get("contact_display") or "").strip()
		or (doc.get("customer_name") or "").strip()
		or (doc.get("party_name") or "").strip()
	)


def _party_address(doc):
	"""The address to print for the counterparty, whatever the doctype calls it."""
	for fieldname in ("customer_address", "supplier_address", "address_display_address"):
		if doc.get(fieldname):
			return doc.get(fieldname)
	# Payment Entry carries only party/party_type.
	party_type, party = doc.get("party_type"), doc.get("party")
	if not (party_type and party):
		return None
	party_doc = _doc(party_type, party)
	return (
		party_doc.get("customer_primary_address")
		or party_doc.get("supplier_primary_address")
		or frappe.db.get_value(
			"Dynamic Link",
			{"link_doctype": party_type, "link_name": party, "parenttype": "Address"},
			"parent",
		)
	)


def _default_company_address(company: str):
	return frappe.db.get_value(
		"Dynamic Link",
		{"link_doctype": "Company", "link_name": company, "parenttype": "Address"},
		"parent",
	)


def _bank_account(company):
	if not company or not company.get("default_bank_account"):
		return EMPTY
	name = frappe.db.get_value("Bank Account", {"account": company.default_bank_account}, "name")
	return _doc("Bank Account", name)
