"""Custom fields and seed data, applied idempotently on every migrate."""

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def after_migrate():
	ensure_custom_fields()


def ensure_custom_fields():
	"""Fields the Swiss forms need that core ERPNext/HRMS does not carry.

	- Employee.ahv_number    — Buchstabe C of the Lohnausweis (AHVN13).
	- Account.swiss_private_movement — marks the equity accounts that carry
	  Privatentnahmen / Privateinlagen, which Art. 125 Abs. 2 DBG requires to be
	  listed separately from the rest of the annual statement.
	"""
	create_custom_fields(
		{
			"Employee": [
				{
					"fieldname": "ahv_number",
					"label": "AHV Number (AHVN13)",
					"fieldtype": "Data",
					"insert_after": "date_of_birth",
					"description": "756.XXXX.XXXX.XX — printed in field C of the Lohnausweis.",
				}
			],
			"Account": [
				{
					"fieldname": "swiss_private_movement",
					"label": "Swiss: Private Movement",
					"fieldtype": "Select",
					"options": "\nPrivatentnahme\nPrivateinlage",
					"insert_after": "account_type",
					"depends_on": "eval:doc.root_type=='Equity'",
					"description": (
						"Equity accounts holding private withdrawals / deposits of the "
						"proprietor. Art. 125 Abs. 2 DBG requires them to be shown separately."
					),
				}
			],
		},
		ignore_validate=True,
	)
