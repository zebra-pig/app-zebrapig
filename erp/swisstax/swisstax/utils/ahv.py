"""AHVN13 (Swiss social security number) formatting and validation.

The number is 13 digits, always starts with the country prefix 756, and carries an
EAN-13 check digit in the last position. It is printed as 756.XXXX.XXXX.XX in
Buchstabe C of the Lohnausweis.
"""

import re

PREFIX = "756"
PRETTY = re.compile(r"^756\.\d{4}\.\d{4}\.\d{2}$")


def digits(value: str) -> str:
	"""Strip every separator, keeping only the digits."""
	return re.sub(r"\D", "", value or "")


def check_digit(first_twelve: str) -> str:
	"""EAN-13 check digit over the first twelve digits."""
	total = sum(int(d) * (3 if i % 2 else 1) for i, d in enumerate(first_twelve))
	return str((10 - total % 10) % 10)


def is_valid(value: str) -> bool:
	raw = digits(value)
	if len(raw) != 13 or not raw.startswith(PREFIX):
		return False
	return raw[12] == check_digit(raw[:12])


def format(value: str) -> str:
	"""Return the canonical 756.XXXX.XXXX.XX form, or the input untouched if unparsable."""
	raw = digits(value)
	if len(raw) != 13:
		return (value or "").strip()
	return f"{raw[0:3]}.{raw[3:7]}.{raw[7:11]}.{raw[11:13]}"
