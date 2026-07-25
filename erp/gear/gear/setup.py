import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields


def ensure_custom_fields():
	"""Ship a `gear_category` custom field on Item (Link -> Gear Category).

	This is the operational axis chosen per Item; a Gear Unit inherits it and
	auto-names CAM-02 from it. Optional (not every Item is gear). Idempotent;
	runs on every migrate via the after_migrate hook.
	"""
	create_custom_fields(
		{
			"Item": [
				{
					"fieldname": "gear_category",
					"label": "Gear Category",
					"fieldtype": "Link",
					"options": "Gear Category",
					"insert_after": "item_group",
					"description": "Operational gear category (CAM, LEN…). Required for Items used as gear units.",
				}
			]
		},
		ignore_validate=True,
	)
