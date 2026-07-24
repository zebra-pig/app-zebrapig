from frappe.model.document import Document


class GearCheckoutSession(Document):
	"""Groups movements for one checkout.

	The table lives here; the heavy scan-many / commit orchestration is left to
	the external API. Keeping this controller thin is intentional.
	"""

	pass
