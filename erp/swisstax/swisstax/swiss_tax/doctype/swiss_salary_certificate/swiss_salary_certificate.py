"""Lohnausweis / Rentenbescheinigung — Formular 11.

Every rule enforced here is a marginal number (Randziffer, "Rz") of the SSK/ESTV
*Wegleitung zum Ausfüllen des Lohnausweises bzw. der Rentenbescheinigung*, which
is binding for filling the form (Rz 1). The Rz that motivates a rule is named at
the rule, so a future revision of the Wegleitung can be traced straight to it.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import formatdate, getdate

from swisstax.utils import ahv
from swisstax.utils.money import whole_francs

# Boxes that hold an amount, in the order they appear on the form.
INCOME_BOXES = ("z1", "z2_1", "z2_2", "z2_3", "z3", "z4", "z5", "z6", "z7")
DEDUCTION_BOXES = ("z9", "z10_1", "z10_2")
EXPENSE_BOXES = ("z13_1_1", "z13_1_2", "z13_2_1", "z13_2_2", "z13_2_3", "z13_3")
AMOUNT_BOXES = INCOME_BOXES + ("z8",) + DEDUCTION_BOXES + ("z11", "z12") + EXPENSE_BOXES

# Boxes whose amount is meaningless without naming the kind of benefit.
KIND_REQUIRED = {
	"z2_3": ("z2_3_kind", "2.3", 26),
	"z3": ("z3_kind", "3", 27),
	"z4": ("z4_kind", "4", 28),
	"z7": ("z7_kind", "7", 31),
	"z13_1_2": ("z13_1_2_kind", "13.1.2", 54),
	"z13_2_3": ("z13_2_3_kind", "13.2.3", 58),
}

# Ziffer -> field, for the payroll pull.
ZIFFER_FIELD = {
	"1": "z1", "2.1": "z2_1", "2.2": "z2_2", "2.3": "z2_3", "3": "z3", "4": "z4",
	"5": "z5", "6": "z6", "7": "z7", "9": "z9", "10.1": "z10_1", "10.2": "z10_2",
	"12": "z12", "13.1.1": "z13_1_1", "13.1.2": "z13_1_2", "13.2.1": "z13_2_1",
	"13.2.2": "z13_2_2", "13.2.3": "z13_2_3", "13.3": "z13_3",
}
IGNORED_ZIFFER = "Not on the certificate"


class SwissSalaryCertificate(Document):
	def validate(self):
		self.round_to_whole_francs()
		self.validate_ahv_number()
		self.validate_period()
		self.compute_totals()
		self.validate_kind_texts()
		self.validate_expense_declaration()
		self.warn_on_soft_rules()

	# ------------------------------------------------------------------ amounts
	def round_to_whole_francs(self):
		"""«Nur ganze Frankenbeträge» — the standing instruction on the form itself."""
		for fieldname in AMOUNT_BOXES:
			self.set(fieldname, whole_francs(self.get(fieldname)))

	def compute_totals(self):
		"""Rz 41 (box 8) and Rz 47 (box 11)."""
		self.z8 = sum(self.get(f) or 0 for f in INCOME_BOXES)
		self.z11 = self.z8 - sum(self.get(f) or 0 for f in DEDUCTION_BOXES)

	# ------------------------------------------------------------------ person
	def validate_ahv_number(self):
		"""Buchstabe C, Rz 6 — the 13-digit AHVN13."""
		if not ahv.is_valid(self.ahv_number):
			frappe.throw(
				_("{0} is not a valid AHV number. Expected 756.XXXX.XXXX.XX with a matching check digit.").format(
					frappe.bold(self.ahv_number or "")
				),
				title=_("Field C"),
			)
		self.ahv_number = ahv.format(self.ahv_number)

	def validate_period(self):
		"""Buchstabe D/E, Rz 7/8 — the period belongs to the certified calendar year."""
		if getdate(self.period_from) > getdate(self.period_to):
			frappe.throw(_("Period from (E) is after period to (E)."))
		year_start, year_end = getdate(f"{self.tax_year}-01-01"), getdate(f"{self.tax_year}-12-31")
		if getdate(self.period_from) < year_start or getdate(self.period_to) > year_end:
			frappe.throw(
				_("The period {0} – {1} falls outside the certified calendar year {2}. "
				  "Rz 7: one certificate covers exactly one calendar year.").format(
					self.period_from, self.period_to, self.tax_year
				)
			)

	# ------------------------------------------------------------------ text boxes
	def validate_kind_texts(self):
		for amount_field, (kind_field, box, rz) in KIND_REQUIRED.items():
			if (self.get(amount_field) or 0) and not (self.get(kind_field) or "").strip():
				frappe.throw(
					_("Box {0} carries an amount, so the kind of benefit must be named (Rz {1}).").format(box, rz)
				)

	def validate_expense_declaration(self):
		"""Ziffer 13.1.1 — the cross and an amount are mutually exclusive (Rz 52/53)."""
		if self.z13_1_1_flag and (self.z13_1_1 or 0):
			frappe.throw(
				_("Box 13.1.1 is crossed, so no amount may be stated there (Rz 52). "
				  "Either remove the amount or clear the cross.")
			)
		if self.z13_1_1_flag and self.expense_regulation_remark_present():
			frappe.throw(
				_("An approved expense regulation is noted in box 15, so box 13.1.1 must not be "
				  "crossed (Rz 65).")
			)

	def expense_regulation_remark_present(self) -> bool:
		remarks = f"{self.z15_line1 or ''} {self.z15_line2 or ''}".lower()
		return "spesenreglement" in remarks

	# ------------------------------------------------------------------ advisories
	def warn_on_soft_rules(self):
		"""Rules the Wegleitung states but that a legitimate edge case can breach."""
		if (self.z2_2 or 0) and not self.free_transport:
			frappe.msgprint(
				_("Box 2.2 declares a company vehicle but field F is not ticked. "
				  "Rz 25: field F is to be ticked in all such cases."),
				indicator="orange", alert=True,
			)
		if (self.z5 or 0):
			frappe.msgprint(
				_("Box 5 is used, so an annex with the employee's personal data and the "
				  "participation details must accompany the certificate (Rz 29)."),
				indicator="orange", alert=True,
			)
		for line in (self.z15_line1, self.z15_line2):
			if line and len(line) > 110:
				frappe.msgprint(
					_("A remark in box 15 is {0} characters long and will not fit the printed line "
					  "(about 110 characters).").format(len(line)),
					indicator="orange", alert=True,
				)

	# ------------------------------------------------------------------ payroll pull
	@frappe.whitelist()
	def pull_from_salary_slips(self):
		"""Aggregate the year's submitted Salary Slips into the boxes of Formular 11.

		Rz 7: the certificate must cover *all* benefits of the calendar year, so an
		unmapped Salary Component is a hard error — never a silent omission.
		"""
		settings = frappe.get_single("Swiss Tax Settings")
		mapping = {row.salary_component: row for row in (settings.component_map or [])}

		slips = frappe.get_all(
			"Salary Slip",
			filters={
				"employee": self.employee,
				"docstatus": 1,
				"start_date": [">=", f"{self.tax_year}-01-01"],
				"end_date": ["<=", f"{self.tax_year}-12-31"],
			},
			pluck="name",
		)
		if not slips:
			frappe.throw(
				_("No submitted Salary Slip found for {0} in {1}.").format(self.employee_name, self.tax_year)
			)

		totals: dict[str, float] = {}
		kinds: dict[str, set[str]] = {}
		unmapped: set[str] = set()

		rows = frappe.get_all(
			"Salary Detail",
			filters={"parent": ["in", slips], "parenttype": "Salary Slip"},
			fields=["salary_component", "amount"],
		)
		for row in rows:
			rule = mapping.get(row.salary_component)
			if not rule:
				unmapped.add(row.salary_component)
				continue
			if not rule.ziffer or rule.ziffer == IGNORED_ZIFFER:
				continue
			fieldname = ZIFFER_FIELD.get(rule.ziffer)
			if not fieldname:
				unmapped.add(row.salary_component)
				continue
			totals[fieldname] = totals.get(fieldname, 0) + (row.amount or 0)
			if rule.kind_text:
				kinds.setdefault(fieldname, set()).add(rule.kind_text)

		if unmapped:
			frappe.throw(
				_("These Salary Components are not assigned to a box of Formular 11: {0}. "
				  "Map them in Swiss Tax Settings (assign «{1}» for components that must not "
				  "appear on the certificate) and pull again.").format(
					frappe.bold(", ".join(sorted(unmapped))), IGNORED_ZIFFER
				),
				title=_("Incomplete component mapping"),
			)

		for fieldname in ZIFFER_FIELD.values():
			self.set(fieldname, whole_francs(totals.get(fieldname, 0)))
		for fieldname, texts in kinds.items():
			kind_field = KIND_REQUIRED.get(fieldname, (None,))[0]
			if kind_field:
				self.set(kind_field, ", ".join(sorted(texts)))

		self.apply_employee_defaults()
		self.apply_settings_defaults(settings)
		self.pulled_from_payroll = 1
		self.pull_log = _("{0} Salary Slip(s): {1}").format(len(slips), ", ".join(sorted(slips)))
		self.compute_totals()
		return {"slips": len(slips), "boxes": {k: v for k, v in totals.items() if v}}

	def apply_employee_defaults(self):
		employee = frappe.get_doc("Employee", self.employee)
		self.ahv_number = self.ahv_number or employee.get("ahv_number")
		self.date_of_birth = self.date_of_birth or employee.get("date_of_birth")
		if not self.employee_address:
			address = employee.get("current_address") or employee.get("permanent_address") or ""
			self.employee_address = "\n".join(
				part for part in [employee.employee_name, address.strip()] if part
			)
		# Rz 8 — the exact entry and leaving dates, clipped to the certified year.
		joining, relieving = employee.get("date_of_joining"), employee.get("relieving_date")
		year_start, year_end = getdate(f"{self.tax_year}-01-01"), getdate(f"{self.tax_year}-12-31")
		if not self.period_from:
			self.period_from = max(getdate(joining), year_start) if joining else year_start
		if not self.period_to:
			self.period_to = min(getdate(relieving), year_end) if relieving else year_end

	def apply_settings_defaults(self, settings):
		self.place = self.place or settings.employer_place
		self.employer_block = self.employer_block or settings.employer_block
		if settings.expense_regulations_approved and not self.expense_regulation_remark_present():
			# Rz 60/65 — the wording is prescribed verbatim.
			remark = _("Spesenreglement durch Kanton {0} am {1} genehmigt.").format(
				settings.expense_regulations_canton or "??",
				formatdate(settings.expense_regulations_date, "dd.MM.yyyy")
				if settings.expense_regulations_date
				else "...",
			)
			if not self.z15_line1:
				self.z15_line1 = remark
			elif not self.z15_line2:
				self.z15_line2 = remark
