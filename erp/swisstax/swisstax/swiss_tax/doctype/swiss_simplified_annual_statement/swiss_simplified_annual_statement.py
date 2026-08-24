"""Simplified annual statement for a self-employed person.

What the law asks for, and what this document produces:

* **Art. 957 Abs. 2 Ziff. 1 OR** — a sole proprietorship with less than
  CHF 500'000 of turnover keeps books only over *Einnahmen und Ausgaben* and the
  *Vermögenslage*. Art. 957 Abs. 3 OR applies the principles of orderly
  bookkeeping by analogy.
* **Art. 958b Abs. 2 OR** — where net revenue from deliveries and services (or
  financial income) does not exceed CHF 100'000, accruals may be waived and
  receipts/payments used instead. The same CHF 100'000 is the VAT registration
  threshold of Art. 10 Abs. 2 Bst. a MWSTG.
* **Art. 125 Abs. 2 DBG** — the tax return must carry *signed* statements of
  assets and liabilities, of income and expenditure, and of private withdrawals
  and deposits. Those are exactly the four tables below.
* **Art. 958d Abs. 2 OR** — prior-year figures are shown next to the current ones.
* **Art. 958f Abs. 1 OR** — records are kept for ten years.

ERPNext keeps a full double-entry ledger, which is a superset of what Art. 957
Abs. 2 OR demands, so the statement is drawn from the ledger as booked. The
Formular 15a block then restates those figures in the boxes of the federal
questionnaire that accompanies the tax return.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, getdate

SECTION_INCOME = "Einnahmen"
SECTION_EXPENSE = "Ausgaben"
SECTION_ASSET = "Aktiven"
SECTION_LIABILITY = "Passiven"
SECTION_WITHDRAWAL = "Privatentnahmen"
SECTION_DEPOSIT = "Privateinlagen"

# Account types that make up "Waren- und Materialaufwand" in Ziffer 2e of Formular 15a.
COST_OF_GOODS_TYPES = {"Cost of Goods Sold", "Stock Adjustment"}


class SwissSimplifiedAnnualStatement(Document):
	def validate(self):
		self.set_period()
		if not self.get("income_lines") and not self.get("asset_lines"):
			self.build_from_ledger()
		self.compute_totals()
		self.assess_thresholds()

	def set_period(self):
		year = frappe.get_doc("Fiscal Year", self.fiscal_year)
		self.from_date, self.to_date = year.year_start_date, year.year_end_date
		self.currency = self.currency or frappe.get_cached_value("Company", self.company, "default_currency")
		self.previous_fiscal_year = self.previous_fiscal_year or self.find_previous_fiscal_year()

	def find_previous_fiscal_year(self):
		return frappe.db.get_value(
			"Fiscal Year", {"year_end_date": ["<", self.from_date]}, "name", order_by="year_end_date desc"
		)

	# ------------------------------------------------------------------ ledger
	@frappe.whitelist()
	def build_from_ledger(self):
		"""(Re)build the four statements from the general ledger. Draft only."""
		if self.docstatus != 0:
			frappe.throw(_("A submitted statement is a frozen snapshot and cannot be rebuilt."))

		self.set_period()
		previous = self.previous_period()

		current = self.account_movements(self.from_date, self.to_date)
		prior = self.account_movements(*previous) if previous else {}
		closing = self.account_balances(self.to_date)
		opening = self.account_balances(previous[1]) if previous else {}

		accounts = self.account_meta()

		self.set("income_lines", [])
		self.set("expense_lines", [])
		self.set("asset_lines", [])
		self.set("liability_lines", [])
		self.set("private_lines", [])

		for name, meta in accounts.items():
			label = meta.account_name
			if meta.root_type == "Income":
				# Income accounts are credit-balanced; show them positive.
				self.append_line(SECTION_INCOME, name, label, -current.get(name, 0), -prior.get(name, 0))
			elif meta.root_type == "Expense":
				self.append_line(SECTION_EXPENSE, name, label, current.get(name, 0), prior.get(name, 0))
			elif meta.root_type == "Asset":
				self.append_line(SECTION_ASSET, name, label, closing.get(name, 0), opening.get(name, 0))
			elif meta.root_type == "Liability":
				self.append_line(SECTION_LIABILITY, name, label, -closing.get(name, 0), -opening.get(name, 0))
			elif meta.root_type == "Equity" and meta.private_movement:
				section = (
					SECTION_WITHDRAWAL if meta.private_movement == "Privatentnahme" else SECTION_DEPOSIT
				)
				movement = current.get(name, 0)
				self.append_line(
					section, name, label,
					movement if section == SECTION_WITHDRAWAL else -movement,
					prior.get(name, 0) if section == SECTION_WITHDRAWAL else -prior.get(name, 0),
				)

		self.compute_totals()
		self.assess_thresholds()
		return True

	def previous_period(self):
		if not self.previous_fiscal_year:
			return None
		year = frappe.get_doc("Fiscal Year", self.previous_fiscal_year)
		return year.year_start_date, year.year_end_date

	def append_line(self, section, account, label, amount, previous_amount):
		"""Skip positions that are nil in both years — Art. 958d Abs. 1 OR permits it."""
		if not flt(amount, 2) and not flt(previous_amount, 2):
			return
		table = {
			SECTION_INCOME: "income_lines",
			SECTION_EXPENSE: "expense_lines",
			SECTION_ASSET: "asset_lines",
			SECTION_LIABILITY: "liability_lines",
			SECTION_WITHDRAWAL: "private_lines",
			SECTION_DEPOSIT: "private_lines",
		}[section]
		self.append(table, {
			"section": section,
			"account": account,
			"account_number": frappe.get_cached_value("Account", account, "account_number") or "",
			"label": label,
			"amount": flt(amount, 2),
			"previous_amount": flt(previous_amount, 2),
		})

	def account_meta(self):
		rows = frappe.get_all(
			"Account",
			filters={"company": self.company, "is_group": 0},
			fields=["name", "account_number", "account_name", "root_type", "account_type",
			        "swiss_private_movement as private_movement"],
			order_by="lft asc",
		)
		meta = {}
		for row in rows:
			meta[row.name] = row
		return meta

	def account_movements(self, from_date, to_date):
		"""Net debit movement per account inside the period."""
		rows = frappe.db.sql(
			"""
			select account, sum(debit) - sum(credit) as net
			from `tabGL Entry`
			where company = %(company)s and is_cancelled = 0
			  and posting_date between %(from_date)s and %(to_date)s
			group by account
			""",
			{"company": self.company, "from_date": from_date, "to_date": to_date},
			as_dict=True,
		)
		return {row.account: flt(row.net, 2) for row in rows}

	def account_balances(self, as_on):
		"""Cumulative net debit balance per account up to and including ``as_on``."""
		rows = frappe.db.sql(
			"""
			select account, sum(debit) - sum(credit) as net
			from `tabGL Entry`
			where company = %(company)s and is_cancelled = 0 and posting_date <= %(as_on)s
			group by account
			""",
			{"company": self.company, "as_on": as_on},
			as_dict=True,
		)
		return {row.account: flt(row.net, 2) for row in rows}

	# ------------------------------------------------------------------ printing
	def visible_lines(self, section: str) -> list:
		"""The rows to print for one section.

		With the prior-year column hidden the reader is looking at a single year,
		and a position that is nil in that year would print as a lone "–" — not a
		position at all. Those are dropped, which in turn lets the print format
		omit a table, and a whole section, that has nothing left to show.
		"""
		rows = [
			row
			for table in (
				self.income_lines, self.expense_lines, self.asset_lines,
				self.liability_lines, self.private_lines,
			)
			for row in (table or [])
			if row.section == section
		]
		if not self.show_previous_year:
			rows = [row for row in rows if flt(row.amount)]
		return rows

	# ------------------------------------------------------------------ totals
	def compute_totals(self):
		self.total_income = sum(flt(r.amount) for r in self.income_lines)
		self.total_expense = sum(flt(r.amount) for r in self.expense_lines)
		self.profit_loss = self.total_income - self.total_expense

		self.total_assets = sum(flt(r.amount) for r in self.asset_lines)
		self.total_liabilities = sum(flt(r.amount) for r in self.liability_lines)
		self.net_assets = self.total_assets - self.total_liabilities

		self.total_private_withdrawals = sum(
			flt(r.amount) for r in self.private_lines if r.section == SECTION_WITHDRAWAL
		)
		self.total_private_deposits = sum(
			flt(r.amount) for r in self.private_lines if r.section == SECTION_DEPOSIT
		)
		self.compute_form_15a()

	def compute_form_15a(self):
		"""Restate the result in the boxes of Formular 15a."""
		meta = self.account_meta()
		operating_revenue = sum(
			flt(r.amount) for r in self.income_lines if self.is_operating_revenue(meta, r.account)
		)
		other_revenue = self.total_income - operating_revenue
		goods = sum(
			flt(r.amount) for r in self.expense_lines
			if meta.get(r.account) and meta[r.account].account_type in COST_OF_GOODS_TYPES
		)

		self.turnover = operating_revenue
		self.f15a_1f_turnover = operating_revenue
		self.f15a_2e_goods = goods
		self.f15a_3_gross_profit = operating_revenue - goods
		self.f15a_4_other_income = other_revenue
		self.f15a_5_total_income = self.total_income
		self.f15a_6_expenses = self.total_expense - goods
		self.f15a_7_income = self.profit_loss

	@staticmethod
	def is_operating_revenue(meta, account) -> bool:
		"""Swiss KMU chart of accounts: class 3 is revenue from deliveries and services."""
		row = meta.get(account)
		if not row:
			return False
		number = (row.account_number or "").strip()
		return number.startswith("3")

	# ------------------------------------------------------------------ thresholds
	def assess_thresholds(self):
		settings = frappe.get_single("Swiss Tax Settings")
		simplified = flt(settings.simplified_bookkeeping_threshold) or 500000
		waiver = flt(settings.accrual_waiver_threshold) or 100000

		self.under_simplified_threshold = 1 if flt(self.turnover) < simplified else 0
		self.under_accrual_waiver = 1 if flt(self.turnover) <= waiver else 0
		self.vat_liable_by_turnover = 0 if flt(self.turnover) < waiver else 1

		def chf(amount):
			return "CHF " + f"{int(amount):,}".replace(",", "’")

		notes = []
		if self.under_simplified_threshold:
			notes.append(
				_("Turnover below CHF {0}: only income, expenditure and the asset position must be "
				  "recorded (Art. 957 Abs. 2 Ziff. 1 OR); the principles of orderly bookkeeping "
				  "apply by analogy (Art. 957 Abs. 3 OR).").format(chf(simplified))
			)
		else:
			notes.append(
				_("Turnover reaches CHF {0}: full commercial bookkeeping with balance sheet, income "
				  "statement and notes is required (Art. 957 Abs. 1 Ziff. 1 OR).").format(chf(simplified))
			)
		# NOT "accruals are waived". Art. 958b Abs. 2 OR permits working from
		# receipts and payments below this threshold, but these books do not take
		# that option — debtors and creditors are carried, and invoices are booked
		# to the period they belong to. The statement reports the ledger as booked.
		# Claiming a relief that is not being used would be a false statement on a
		# document the taxpayer signs, so the note records the threshold as an
		# observation and says which basis the figures are on.
		if self.under_accrual_waiver:
			notes.append(
				_("Net revenue does not exceed CHF {0}, which is also the VAT registration "
				  "threshold (Art. 10 Abs. 2 Bst. a MWSTG).").format(chf(waiver))
			)
		else:
			notes.append(
				_("Net revenue exceeds CHF {0}, the VAT registration threshold "
				  "(Art. 10 Abs. 2 Bst. a MWSTG).").format(chf(waiver))
			)
		notes.append(
			_("The figures are taken from the ledger as booked, on an accrual basis — "
			  "receivables, payables and period-end accruals included.")
		)
		if not any(r.section in (SECTION_WITHDRAWAL, SECTION_DEPOSIT) for r in self.private_lines):
			notes.append(
				_("No private withdrawals or deposits are recorded. Art. 125 Abs. 2 DBG requires a "
				  "statement of them — mark the relevant equity accounts with «Swiss: Private "
				  "Movement» if they exist.")
			)
		self.compliance_note = "\n\n".join(notes)

	def on_submit(self):
		if not self.signatory:
			frappe.throw(_("Art. 125 Abs. 2 DBG requires the statements to be signed."))
