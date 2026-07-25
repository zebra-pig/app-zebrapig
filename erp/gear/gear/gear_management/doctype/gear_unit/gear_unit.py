import frappe
from frappe import _
from frappe.model.document import Document


class GearUnit(Document):
	def autoname(self):
		"""Name units ``CODE-NN`` with a per-category counter (e.g. CAM-01), where
		CODE is the Item's Gear Category (the category record name IS the code)."""
		code = frappe.db.get_value("Item", self.item, "gear_category")
		if not code:
			frappe.throw(
				_("Item {0} has no Gear Category. Set it on the Item before creating a unit.").format(self.item)
			)
		code = code.upper()
		prefix = f"{code}-"
		existing = frappe.db.sql_list(
			"select name from `tabGear Unit` where name like %s", prefix + "%"
		)
		max_n = 0
		for name in existing:
			suffix = name[len(prefix):]
			if suffix.isdigit():
				max_n = max(max_n, int(suffix))
		self.name = f"{prefix}{max_n + 1:02d}"

	def validate(self):
		self._validate_binding()

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

	@property
	def active_tags(self):
		"""Gear Tags currently assigned to this unit."""
		return frappe.get_all(
			"Gear Tag",
			filters={"gear_unit": self.name, "status": "Assigned"},
			pluck="tag_token",
		)
