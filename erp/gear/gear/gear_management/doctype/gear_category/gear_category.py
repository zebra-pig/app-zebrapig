import frappe
from frappe.model.document import Document


class GearCategory(Document):
	def validate(self):
		# The record name is the code; keep it clean (uppercase, no surrounding space).
		if self.name and self.name != self.name.strip().upper():
			frappe.throw("Gear Category code (name) must be uppercase with no spaces, e.g. CAM.")
