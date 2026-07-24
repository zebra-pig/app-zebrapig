"""Thin whitelisted helpers for the external API layer.

The GQLoom/Hono API (and, later, the mobile app) authenticate to Frappe with an
API key and mostly use the auto-generated REST endpoints. The only thing worth a
custom method is token resolution, because the token needs normalizing (label
transcriptions, hyphens, I/L/O confusion) before the lookup.
"""

import frappe

from gear.utils.token import is_valid, normalize


@frappe.whitelist()
def resolve_token(token: str):
	"""Resolve a scanned/typed tag token to its Gear Unit.

	Returns ``{"found": bool, "unit": <dict|None>, "token": <normalized>}`` so a
	caller can distinguish "unknown tag" from "bad token" without a hard 404.
	"""
	token = normalize(token or "")
	result = {"token": token, "found": False, "valid": is_valid(token), "unit": None}
	if not token:
		return result

	name = frappe.db.get_value("Gear Unit", {"tag_token": token}, "name")
	if not name:
		return result

	unit = frappe.get_doc("Gear Unit", name)
	result["found"] = True
	result["unit"] = {
		"name": unit.name,
		"category": unit.category,
		"model": unit.model,
		"manufacturer": unit.manufacturer,
		"status": unit.status,
		"checkout_mode": unit.checkout_mode,
		"parent_unit": unit.parent_unit,
		"location": unit.location,
	}
	return result
