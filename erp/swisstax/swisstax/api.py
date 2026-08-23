"""Whitelisted helpers used by the desk client scripts."""

import frappe


@frappe.whitelist()
def unmapped_salary_components(company: str | None = None):
	"""Salary Components that no Swiss Tax Settings row assigns to a Ziffer.

	Surfaced on the Swiss Tax Settings form so the mapping can be completed before
	the first certificate is drawn — an unmapped component is a hard error at pull
	time, never a silent omission.
	"""
	mapped = {
		row.salary_component
		for row in frappe.get_all(
			"Swiss Salary Certificate Component",
			filters={"parent": "Swiss Tax Settings"},
			fields=["salary_component"],
		)
	}
	filters = {}
	if company:
		filters["company"] = company
	all_components = {
		row.name for row in frappe.get_all("Salary Component", filters=filters, fields=["name"])
	}
	return sorted(all_components - mapped)
