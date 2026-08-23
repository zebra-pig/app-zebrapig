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

	employee(frm) {
		if (!frm.doc.employee) return;
		frappe.db.get_doc("Employee", frm.doc.employee).then((employee) => {
			frm.set_value("date_of_birth", employee.date_of_birth);
			frm.set_value("ahv_number", employee.ahv_number);
			frm.set_value("company", employee.company);
		});
	},
});
