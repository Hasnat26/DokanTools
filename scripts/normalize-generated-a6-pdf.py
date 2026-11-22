#!/usr/bin/env python3
"""Normalize Chromium's near-A6 PDF page boxes without scaling the printed content."""
from decimal import Decimal
import json
import os
from pathlib import Path
import sys
from pypdf import PdfReader, PdfWriter

if len(sys.argv) != 2:
    raise SystemExit("Usage: normalize-generated-a6-pdf.py <fresh-pdf>")
pdf_path = Path(sys.argv[1])
reader = PdfReader(str(pdf_path))
if len(reader.pages) != 1:
    raise SystemExit(f"Expected exactly one PDF page, got {len(reader.pages)}")

page = reader.pages[0]
target_width = Decimal(105) * Decimal(72) / Decimal("25.4")
target_height = Decimal(148) * Decimal(72) / Decimal("25.4")
source_width = Decimal(str(float(page.mediabox.width)))
source_height = Decimal(str(float(page.mediabox.height)))
if abs(source_width - target_width) > Decimal("1.0") or abs(source_height - target_height) > Decimal("1.0"):
    raise SystemExit(f"Refusing to normalize non-A6 input: {source_width} x {source_height} pt")
if abs(float(page.mediabox.left)) > 0.1 or abs(float(page.mediabox.bottom)) > 0.1:
    raise SystemExit("Refusing to normalize a PDF with non-zero page-box origin")

# Chromium can quantize requested paper dimensions. Set all page boxes to exact A6;
# preserve the content stream unchanged, so no content is scaled.
for box_name in ("mediabox", "cropbox", "bleedbox", "trimbox", "artbox"):
    box = getattr(page, box_name)
    box.lower_left = (0, 0)
    box.upper_right = (float(target_width), float(target_height))

writer = PdfWriter()
writer.add_page(page)
writer.add_metadata({"/Title": "DokanTools Bill Memo", "/Creator": "Chromium"})
temporary_path = pdf_path.with_suffix(pdf_path.suffix + ".normalized")
with temporary_path.open("wb") as output:
    writer.write(output)
os.replace(temporary_path, pdf_path)
print(json.dumps({
    "result": "NORMALIZED",
    "sourcePageSizePt": [float(source_width), float(source_height)],
    "targetA6PageSizePt": [float(target_width), float(target_height)],
    "contentScaled": False,
    "pageCount": 1,
}, indent=2))
