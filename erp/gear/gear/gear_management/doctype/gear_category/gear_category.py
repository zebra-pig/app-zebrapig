import frappe
from frappe.model.document import Document


class GearCategory(Document):
	def validate(self):
		# Abbreviations are used as name prefixes; keep them uppercase and tidy.
		if self.abbr:
			self.abbr = self.abbr.strip().upper()
