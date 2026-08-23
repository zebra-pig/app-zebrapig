"""Site-wide defaults for the Swiss documents.

Holds the employer block that goes in field I of every Lohnausweis, the
Salary Component -> Ziffer map the payroll pull reads, and the two statutory
thresholds the annual statement measures itself against.
"""

import frappe
from frappe import _
from frappe.model.document import Document

IGNORED_ZIFFER = "Not on the certificate"


class SwissTaxSettings(Document):
	def validate(self):
		self.validate_unique_components()
		self.validate_expense_regulation()

	def validate_unique_components(self):
		"""A component mapped twice would be counted twice on the certificate."""
		seen = set()
		for row in self.component_map or []:
			if row.salary_component in seen:
				frappe.throw(
					_("Salary Component {0} is mapped more than once (row {1}).").format(
						frappe.bold(row.salary_component), row.idx
					)
				)
			seen.add(row.salary_component)

	def validate_expense_regulation(self):
		"""Rz 60 prescribes the wording, which needs both canton and date."""
		if not self.expense_regulations_approved:
			return
		if not (self.expense_regulations_canton and self.expense_regulations_date):
			frappe.throw(
				_("An approved expense regulation needs both the approving canton and the "
				  "approval date — Rz 60 prescribes the wording "
				  "«Spesenreglement durch Kanton XY am ... genehmigt».")
			)
