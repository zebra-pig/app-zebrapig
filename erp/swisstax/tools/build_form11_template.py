#!/usr/bin/env python3
"""Regenerate the Formular 11 print template from the official ESTV PDF.

The Lohnausweis is reproduced on plain white paper (Wegleitung Rz 75), so the
template has to carry the form itself: every label, rule and box. Rather than
transcribe them by hand, this script reads the geometry straight out of the
official PDF and emits it as absolutely-positioned millimetres.

    pip install pdfplumber fonttools brotli
    curl -sSLO https://www.estv.admin.ch/dam/de/sd-web/Nq1zXu8XwlCY/dbst-form-11lohna-rechts-dfi-de.pdf
    python tools/build_form11_template.py dbst-form-11lohna-rechts-dfi-de.pdf \
        --fonts tools/fonts --out swisstax/templates/includes/lohnausweis_form11.html

Fonts: the form is set in Frutiger LT Com, which is not redistributable. Source
Sans 3 (SIL OFL 1.1) is the closest free match — weight-matched it tracks
Frutiger's advance widths to within ~3% across this form. The four weights are
embedded as base64 woff2 so the renderer needs neither a network nor a system
font, which is what makes the output identical in Chrome, Safari and
wkhtmltopdf. Fetch them once into --fonts as SourceSans3-{300,600,700,900}.woff2.

Vertical placement uses the PDF text matrix's baseline together with Source Sans
3's own ascender (1.024 em) and a line-height of 1.424 (ascender + descender), so
a run's baseline lands exactly where the official form puts it.
"""

from __future__ import annotations

import argparse
import base64
import html
import pathlib

import pdfplumber
from fontTools.ttLib import TTFont

PT = 25.4 / 72.0  # PDF points -> millimetres
ASCENDER = 1.024  # Source Sans 3, em units (hhea == OS/2 typo)
LINE_HEIGHT = 1.424  # ascender + descender, so half-leading is zero
WEIGHTS = (300, 600, 700, 900)
OPERATORS = set("+=–−-")
MERGE_GAP_PT = 1.6  # glyphs further apart than this start a new run
SQUEEZE_TOLERANCE = 1.02  # only squeeze a label that would grow beyond this
MIN_SQUEEZE = 0.88  # never squeeze past this; a longer line would be unreadable
MIN_SQUEEZE_WIDTH_PT = 10.0


def mm(value: float) -> float:
	return round(value * PT, 2)


def weight_for(fontname: str) -> int:
	if "UltraBl" in fontname:
		return 900
	if "Black" in fontname:
		return 700
	if "Bold" in fontname:
		return 600
	return 300


class Metrics:
	"""Advance widths of the substitute font, for the squeeze calculation."""

	def __init__(self, font_dir: pathlib.Path):
		self.fonts = {}
		for weight in WEIGHTS:
			path = font_dir / f"SourceSans3-{weight}.woff2"
			if not path.exists():
				raise SystemExit(f"missing font: {path}")
			self.fonts[weight] = TTFont(path)

	def width(self, weight: int, text: str, size_pt: float) -> float:
		font = self.fonts[weight]
		upm = font["head"].unitsPerEm
		cmap, hmtx = font.getBestCmap(), font["hmtx"].metrics
		total = 0
		for ch in text.replace("\t", " "):
			glyph = cmap.get(ord(ch))
			if isinstance(glyph, str) and glyph in hmtx:
				total += hmtx[glyph][0]
		return total / upm * size_pt

	def faces(self, font_dir: pathlib.Path) -> str:
		out = []
		for weight in WEIGHTS:
			data = (font_dir / f"SourceSans3-{weight}.woff2").read_bytes()
			out.append(
				"@font-face{font-family:'SwissForm';font-style:normal;font-weight:%d;"
				"font-display:block;src:url(data:font/woff2;base64,%s) format('woff2')}"
				% (weight, base64.b64encode(data).decode())
			)
		return "\n".join(out)


def extract(pdf_path: pathlib.Path):
	"""Merge the page's glyphs into runs, and collect the printed rules."""
	with pdfplumber.open(pdf_path) as pdf:
		page = pdf.pages[0]
		height = float(page.height)
		runs, current = [], None
		for char in sorted(
			page.chars, key=lambda c: (round(c["matrix"][1], 2), -round(c["y0"], 1), c["x0"])
		):
			if round(char["matrix"][1], 2):
				continue  # the rotated margin note is written by hand in the template
			baseline = round(char["matrix"][5], 2)
			key = (round(char["size"], 2), baseline, char["fontname"].split("+")[-1])
			# The +/-/= operator column must never be glued onto the label before it,
			# or squeezing that label would drag the operator out of its column. The
			# column is set at body size past 163 mm, which is what separates it from
			# an in-word hyphen ("Wohn- und Arbeitsort") in the 6.5 pt captions.
			in_operator_column = char["x0"] * PT > 163 and char["size"] >= 7.5
			starts_operator = char["text"] in OPERATORS and in_operator_column
			after_operator = bool(
				current
				and current["text"].strip()
				and current["text"].strip()[-1] in OPERATORS
				and current["x1"] * PT > 163
				and current["size"] >= 7.5
			)
			if (
				current
				and current["key"] == key
				and (char["x0"] - current["x1"]) < MERGE_GAP_PT
				and not starts_operator
				and not after_operator
			):
				current["text"] += char["text"]
				current["x1"] = char["x1"]
			else:
				if current:
					runs.append(current)
				current = {
					"key": key, "text": char["text"], "x0": char["x0"], "x1": char["x1"],
					"baseline": baseline, "size": char["size"],
					"font": char["fontname"].split("+")[-1],
				}
		if current:
			runs.append(current)

		rules = [
			line
			for line in sorted(page.lines, key=lambda l: (l["top"], l["x0"]))
			if (line["x1"] - line["x0"]) > 1
			and (line["bottom"] - line["top"]) < 1
			and line["stroking_color"]
			and abs(line["stroking_color"][0] - 0.218) < 0.01  # the dark grey rules only
			and 6 < mm(line["x0"]) < 199
		]
	return height, runs, rules


def render_labels(height: float, runs, metrics: Metrics) -> str:
	out = []
	for run in runs:
		# rstrip only: a run's leading spaces are part of the official spacing and
		# its x0 already accounts for them.
		text = run["text"].replace("\t", " ").rstrip()
		if not text.strip():
			continue
		weight = weight_for(run["font"])
		size = round(run["size"], 2)
		top = mm(height - run["baseline"]) - round(ASCENDER * size * PT, 2)
		style = f'left:{mm(run["x0"])}mm;top:{round(top, 2)}mm;font-size:{size}pt'
		css_class = f"w{weight}"
		printed = run["x1"] - run["x0"]
		natural = metrics.width(weight, text, run["size"])
		if natural > printed * SQUEEZE_TOLERANCE and printed > MIN_SQUEEZE_WIDTH_PT:
			style += f";transform:scaleX({max(printed / natural, MIN_SQUEEZE):.3f})"
			css_class += " fit"
		out.append(f'  <div class="t {css_class}" style="{style}">{html.escape(text)}</div>')
	return "\n".join(out)


def render_rules(rules) -> str:
	return "\n".join(
		f'  <div class="rule" style="left:{mm(r["x0"])}mm;top:{mm(r["top"])}mm;'
		f'width:{mm(r["x1"] - r["x0"])}mm"></div>'
		for r in rules
	)


def main():
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("pdf", type=pathlib.Path, help="official Formular 11 dfi PDF")
	parser.add_argument("--fonts", type=pathlib.Path, required=True)
	parser.add_argument("--out", type=pathlib.Path, required=True)
	parser.add_argument("--parts", type=pathlib.Path, default=pathlib.Path("tools/form11_parts"))
	parser.add_argument(
		"--fonts-out",
		type=pathlib.Path,
		default=pathlib.Path("swisstax/templates/includes/_swiss_fonts.html"),
		help="shared @font-face include, used by every print format of this app",
	)
	args = parser.parse_args()

	metrics = Metrics(args.fonts)
	height, runs, rules = extract(args.pdf)

	args.fonts_out.write_text(
		"{#- GENERATED by tools/build_form11_template.py — Source Sans 3, SIL OFL 1.1.\n"
		"   Embedded as base64 so a PDF renderer never needs a network or a system font. -#}\n"
		"<style>\n" + metrics.faces(args.fonts) + "\n</style>\n",
		encoding="utf-8",
	)
	head = (args.parts / "head.html").read_text(encoding="utf-8")
	tail = (args.parts / "tail.html").read_text(encoding="utf-8")
	args.out.write_text(
		head
		+ render_labels(height, runs, metrics)
		+ "\n\n"
		+ render_rules(rules)
		+ "\n"
		+ tail,
		encoding="utf-8",
	)
	print(f"{args.out}: {len(runs)} runs, {len(rules)} rules")
	print(f"{args.fonts_out}: {len(WEIGHTS)} embedded weights")


if __name__ == "__main__":
	main()
