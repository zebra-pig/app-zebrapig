import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime

# Movement types whose status effect propagates to bound children.
_STATUS_BY_TYPE = {
	"Check Out": "Checked Out",
	"Check In": "Available",
	"Repair": "In Repair",
	"Lost": "Lost",
	"Found": "Available",
}


class GearMovement(Document):
	def before_insert(self):
		if not self.timestamp:
			self.timestamp = now_datetime()

	def after_insert(self):
		self._apply_status()
		if not self.flags.from_expansion:
			self._expand_to_bound_children()

	def _apply_status(self):
		new_status = _STATUS_BY_TYPE.get(self.movement_type)
		if new_status:
			frappe.db.set_value("Gear Unit", self.gear_unit, "status", new_status)

	def _expand_to_bound_children(self):
		"""When a parent unit moves, its BOUND children move with it."""
		unit = frappe.get_doc("Gear Unit", self.gear_unit)
		for child in unit.bound_children():
			movement = frappe.get_doc(
				{
					"doctype": "Gear Movement",
					"gear_unit": child,
					"movement_type": self.movement_type,
					"timestamp": self.timestamp,
					"actor": self.actor,
					"session": self.session,
					"from_location": self.from_location,
					"to_location": self.to_location,
					"notes": f"Auto: bound to {self.gear_unit}",
				}
			)
			movement.flags.from_expansion = True
			movement.insert(ignore_permissions=True)
