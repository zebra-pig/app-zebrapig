"""Whole-franc handling.

The Lohnausweis carries the standing instruction «Nur ganze Frankenbeträge»
(top right of Formular 11), so every amount on the certificate is rounded to a
whole franc before it is stored, and rendered without decimals.
"""

from decimal import ROUND_HALF_UP, Decimal


def whole_francs(value) -> int:
	"""Round to a whole franc, half away from zero (the commercial convention)."""
	if value in (None, ""):
		return 0
	return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def fmt(value) -> str:
	"""Swiss thousands grouping with an apostrophe: 128'450. Zero renders empty."""
	amount = whole_francs(value)
	if amount == 0:
		return ""
	return f"{amount:,}".replace(",", "’")
