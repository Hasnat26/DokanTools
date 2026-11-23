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
# The raw Chromium PDF was inspected from the exact-head CI artifact. Chromium
# deterministically emits MediaBox/CropBox 298.07999 x 420.0 pt for the explicit
# 105 x 148 mm request. This is a measured page-box quantization signature, not
# a content scaling or a general relaxation of final A6 acceptance.
pre_normalization_tolerance = Decimal("0.1")
within_a6 = (
    abs(source_width - target_width) <= pre_normalization_tolerance
    and abs(source_height - target_height) <= pre_normalization_tolerance
)
known_chromium_quantization = (
    abs(source_width - Decimal("298.07999")) <= Decimal("0.01")
    and abs(source_height - Decimal("420.0")) <= Decimal("0.01")
)
if not within_a6 and not known_chromium_quantization:
    raise SystemExit(f"PRE_NORMALIZATION_A6_SIZE_FAIL: unrecognized {source_width} x {source_height} pt; expected A6 within {pre_normalization_tolerance} pt or the inspected Chromium signature 298.07999 x 420.0 pt")
if abs(float(page.mediabox.left)) > 0.1 or abs(float(page.mediabox.bottom)) > 0.1:
    raise SystemExit("Refusing to normalize a PDF with non-zero page-box origin")
source_crop_width = Decimal(str(float(page.cropbox.width)))
source_crop_height = Decimal(str(float(page.cropbox.height)))
crop_matches_raw = (
    abs(source_crop_width - source_width) <= Decimal("0.01")
    and abs(source_crop_height - source_height) <= Decimal("0.01")
)
if not within_a6 and (not known_chromium_quantization or not crop_matches_raw):
    raise SystemExit(f"PRE_NORMALIZATION_CROPBOX_A6_SIZE_FAIL: CropBox {source_crop_width} x {source_crop_height} pt does not match inspected Chromium MediaBox")
if within_a6 and (abs(source_crop_width - target_width) > pre_normalization_tolerance or abs(source_crop_height - target_height) > pre_normalization_tolerance):
    raise SystemExit(f"PRE_NORMALIZATION_CROPBOX_A6_SIZE_FAIL: {source_crop_width} x {source_crop_height} pt")
if abs(float(page.cropbox.left)) > 0.1 or abs(float(page.cropbox.bottom)) > 0.1:
    raise SystemExit("PRE_NORMALIZATION_CROPBOX_ORIGIN_FAIL")

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
    "sourceGeometryClass": "A6_WITHIN_0.1PT" if within_a6 else "KNOWN_CHROMIUM_QUANTIZATION_298.07999x420.0PT",
    "knownChromiumSignatureTolerancePt": 0.01 if known_chromium_quantization else None,
    "targetA6PageSizePt": [float(target_width), float(target_height)],
    "finalGeometryAcceptanceTolerancePt": 0.1,
    "contentScaled": False,
    "pageCount": 1,
}, indent=2))
