frappe.ui.form.on("Swiss Simplified Annual Statement", {
	refresh(frm) {
		if (frm.doc.docstatus === 0 && frm.doc.company && frm.doc.fiscal_year) {
			frm.add_custom_button(__("Rebuild from Ledger"), () => {
				frappe.confirm(
					__("Replace all four statements with freshly computed figures?"),
					() => frm.call("build_from_ledger").then(() => frm.refresh())
				);
			});
		}
	},

	fiscal_year(frm) {
		if (!frm.doc.fiscal_year) return;
		frappe.db.get_doc("Fiscal Year", frm.doc.fiscal_year).then((year) => {
			frm.set_value("from_date", year.year_start_date);
			frm.set_value("to_date", year.year_end_date);
		});
	},
});
