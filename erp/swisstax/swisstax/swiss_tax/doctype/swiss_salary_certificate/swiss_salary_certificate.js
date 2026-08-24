// Formular 11 — desk behaviour.
frappe.ui.form.on("Swiss Salary Certificate", {
	refresh(frm) {
		if (frm.doc.docstatus === 0 && frm.doc.employee && frm.doc.tax_year) {
			frm.add_custom_button(__("Pull from Salary Slips"), () => {
				frm.call("pull_from_salary_slips").then((r) => {
					if (!r.exc) {
						frm.refresh();
						frappe.show_alert({
							message: __("Aggregated {0} salary slip(s).", [r.message.slips]),
							indicator: "green",
						});
					}
				});
			});
		}
		frm.set_intro(
			__("Boxes 8 and 11 are computed. Amounts are rounded to whole francs on save, as the form requires."),
			"blue"
		);
	},

	// Field H comes from the employee's Current Address and field I from the
	// company's, so both fill in as soon as the person is chosen rather than
	// waiting until save. The server owns the formatting — see the controller.
	employee(frm) {
		if (!frm.doc.employee) return;
		frappe.db.get_value("Employee", frm.doc.employee, "company").then((r) => {
			if (r.message && r.message.company && !frm.doc.company) {
				frm.set_value("company", r.message.company);
			}
			frm.call("fetch_from_employee").then(() => frm.refresh_fields());
		});
	},

	// Changing the company changes whose address belongs in field I.
	company(frm) {
		if (frm.doc.company && !frm.doc.employer_block) {
			frm.call("fetch_from_employee").then(() => frm.refresh_fields());
		}
	},
});
