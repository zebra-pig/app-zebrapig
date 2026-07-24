import frappe
from frappe import _
from frappe.model.document import Document

from gear.utils.token import is_valid, new_token, normalize


class GearUnit(Document):
	def autoname(self):
		"""Name units as ``ABBR-NN`` with a per-category counter (e.g. CAM-01)."""
		abbr = (frappe.db.get_value("Gear Category", self.category, "abbr") or "GEN").upper()
		prefix = f"{abbr}-"
		existing = frappe.db.sql_list(
			"select name from `tabGear Unit` where name like %s", prefix + "%"
		)
		max_n = 0
		for name in existing:
			suffix = name[len(prefix):]
			if suffix.isdigit():
				max_n = max(max_n, int(suffix))
		self.name = f"{prefix}{max_n + 1:02d}"

	def before_insert(self):
		if not self.tag_token:
			self.tag_token = new_token()

	def validate(self):
		self._validate_token()
		self._validate_binding()

	def _validate_token(self):
		if not self.tag_token:
			return
		self.tag_token = normalize(self.tag_token)
		if not is_valid(self.tag_token):
			frappe.throw(_("Tag Token {0} is not a valid token.").format(self.tag_token))

	def _validate_binding(self):
		if self.checkout_mode == "BOUND":
			if not self.parent_unit:
				frappe.throw(_("A BOUND unit must have a Parent Unit."))
			if self.parent_unit == self.name:
				frappe.throw(_("A unit cannot be bound to itself."))
		else:
			# INDEPENDENT units carry no parent.
			self.parent_unit = None

	def bound_children(self):
		"""Names of units bound to this one (moved together with it)."""
		return frappe.get_all(
			"Gear Unit",
			filters={"parent_unit": self.name, "checkout_mode": "BOUND"},
			pluck="name",
		)
