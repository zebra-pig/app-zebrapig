"""Thin whitelisted helpers for the external API layer.

The GQLoom/Hono API (and, later, the mobile app) authenticate to Frappe with an
API key and mostly use the auto-generated REST endpoints. The two things worth a
custom method are token resolution (needs normalizing) and bulk tag minting.
"""

import frappe

from gear.utils.token import is_valid, normalize


@frappe.whitelist()
def resolve_token(token: str):
	"""Resolve a scanned/typed tag token: token -> Gear Tag -> Gear Unit -> Item.

	Returns a dict that distinguishes: bad token, unknown tag, unassigned tag,
	and an assigned unit — so callers never need a hard 404.
	"""
	token = normalize(token or "")
	result = {
		"token": token,
		"valid": is_valid(token),
		"found": False,       # the tag exists in the system
		"assigned": False,    # the tag is assigned to a unit
		"unit": None,
	}
	if not token:
		return result

	tag = frappe.db.get_value(
		"Gear Tag", {"tag_token": token}, ["name", "gear_unit", "status"], as_dict=True
	)
	if not tag:
		return result
	result["found"] = True
	if not tag.gear_unit:
		return result  # minted but not yet stuck on anything

	result["assigned"] = True
	unit = frappe.get_doc("Gear Unit", tag.gear_unit)
	product = frappe.db.get_value("Item", unit.item, "item_name") if unit.item else None
	result["unit"] = {
		"name": unit.name,
		"item": unit.item,
		"product": product,
		"category": unit.category,
		"status": unit.status,
		"location": unit.location,
	}
	return result


@frappe.whitelist()
def bulk_create_tags(count):
	"""Mint ``count`` fresh, unassigned Gear Tags. Returns their names + tokens.

	Print the labels, then assign each tag to a Gear Unit later.
	"""
	count = int(count)
	if count < 1 or count > 500:
		frappe.throw("count must be between 1 and 500")

	tags = []
	for _ in range(count):
		tag = frappe.get_doc({"doctype": "Gear Tag"}).insert()
		tags.append({"name": tag.name, "tag_token": tag.tag_token})
	return tags
