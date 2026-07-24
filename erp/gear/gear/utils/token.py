"""Crockford Base32 tag tokens.

Opaque, non-enumerable identifiers printed on gear labels and encoded in NFC
tags / QR codes. Design notes (see the original design discussion):

- 16 symbols of Crockford Base32 = 80 bits of entropy (~1.2e24 possibilities).
- One trailing check symbol (value mod 37) catches ~97 % of transcription
  errors before a request is ever made.
- Uppercase + Crockford's alphabet keeps the whole URL in the QR alphanumeric
  mode (denser codes). The check symbols ``~`` and ``=`` fall outside that mode,
  so tokens that would end in them are rejected and re-rolled.
- Decoding is error tolerant: I/L -> 1, O -> 0, and hyphens are ignored, so a
  human reading ``G7K2-P9XQ-4M8T-3NVB-C`` off a label lands on the right unit.
"""

import secrets

ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
CHECK = ALPHABET + "*~$=U"

TOKEN_BODY_LEN = 16
TOKEN_LEN = TOKEN_BODY_LEN + 1  # body + check symbol

# QR alphanumeric mode does not include ``~`` or ``=``; reject those check symbols.
_QR_UNSAFE_CHECK = "~="


def _encode(n: int, length: int = TOKEN_BODY_LEN) -> str:
	out = ""
	for _ in range(length):
		out = ALPHABET[n & 31] + out
		n >>= 5
	return out


def new_token() -> str:
	"""Return a fresh 17-character token (16 body + 1 check symbol)."""
	while True:
		n = secrets.randbits(TOKEN_BODY_LEN * 5)  # 80 bits
		chk = CHECK[n % 37]
		if chk in _QR_UNSAFE_CHECK:
			continue
		return _encode(n) + chk


def normalize(s: str) -> str:
	"""Canonicalise a token as read off a label: uppercase, drop hyphens, map
	visually ambiguous glyphs (I/L -> 1, O -> 0)."""
	if not s:
		return ""
	s = s.upper().replace("-", "").strip()
	return s.translate(str.maketrans("ILO", "110"))


def is_valid(s: str) -> bool:
	"""True if ``s`` is a well-formed token with a matching check symbol."""
	s = normalize(s)
	if len(s) != TOKEN_LEN:
		return False
	body, chk = s[:TOKEN_BODY_LEN], s[TOKEN_BODY_LEN]
	n = 0
	for c in body:
		i = ALPHABET.find(c)
		if i < 0:
			return False
		n = n * 32 + i
	return CHECK[n % 37] == chk


def format_label(s: str) -> str:
	"""Group a normalized token for printing: ``G7K2-P9XQ-4M8T-3NVB-C``."""
	s = normalize(s)
	groups = [s[i : i + 4] for i in range(0, len(s), 4)]
	return "-".join(groups)
