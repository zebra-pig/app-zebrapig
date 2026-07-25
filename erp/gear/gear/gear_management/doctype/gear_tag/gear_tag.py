import frappe
from frappe import _
from frappe.model.document import Document

from gear.utils.token import is_valid, new_token, normalize


class GearTag(Document):
	def before_insert(self):
		if not self.tag_token:
			self.tag_token = new_token()

	def validate(self):
		if self.tag_token:
			self.tag_token = normalize(self.tag_token)
			if not is_valid(self.tag_token):
				frappe.throw(_("Tag Token {0} is not a valid token.").format(self.tag_token))
		# Keep status in sync with assignment (unless explicitly retired).
		if self.status != "Retired":
			self.status = "Assigned" if self.gear_unit else "Unassigned"
