import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def ensure_custom_fields():
	"""Ship a `gear_abbr` custom field on Item Group. It provides the short code
	(e.g. Cameras -> CAM) that drives Gear Unit auto-naming (CAM-02). Idempotent;
	runs on every migrate via the after_migrate hook."""
	create_custom_fields(
		{
			"Item Group": [
				{
					"fieldname": "gear_abbr",
					"label": "Gear Abbreviation",
					"fieldtype": "Data",
					"insert_after": "item_group_name",
					"description": "Short code used as the Gear Unit name prefix (e.g. CAM).",
					"translatable": 0,
				}
			]
		},
		ignore_validate=True,
	)
