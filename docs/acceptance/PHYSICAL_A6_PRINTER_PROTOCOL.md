# Physical A6 printer validation protocol — Draft Memo

## Target and scope

- Application baseline: `437e76c1c0261d43c5b419a80aa3bed890331aff`.
- Route: authenticated `/dashboard/draft-memo`.
- Target: A6 portrait, 105 × 148 mm.
- Content box: 99 × 142 mm with 3 mm safe margins on all sides.
- Minimum text size: 8 pt.
- Physical execution status: BLOCKED until an A6-capable printer, A6 stock, operator and measuring tool are made available.

## Safety and controls

Use synthetic test-shop and product data only. Do not use production credentials or customer information. Do not change printer defaults globally. Do not use fit-to-page, shrink, expand, rotate, booklet, borderless enlargement or automatic scaling. Keep both PDF artifacts and all photographs in the private acceptance evidence area.

## Test materials

- A6 paper stock (105 × 148 mm), known-good caliper/ruler with 0.5 mm or better graduations.
- Printer supporting A6 or a verified custom 105 × 148 mm paper definition.
- Browser-generated PDF saved directly from the authenticated route's print dialog.
- Ghostscript-finalized exact-A6 PDF generated separately from the browser PDF.
- A6 measurement record, camera/phone, and visual inspection checklist.

## Test case A — browser-generated PDF

1. Record tester, date/time, printer model/driver/firmware, OS, browser/version and paper-stock specification.
2. Generate the PDF from `/dashboard/draft-memo` using the browser print workflow; save it without Ghostscript processing.
3. Inspect its page count, MediaBox, CropBox and rotation with `pdfinfo -box browser-output.pdf`; record actual values. Do not assume it is already exact A6.
4. Open print dialog. Select A6 portrait, actual size / 100%, no scaling, no fit/shrink, no rotation. Disable headers/footers if offered.
5. Print one copy. Photograph the full page beside a ruler and a close-up of the edges and Bengali/English text.
6. Measure physical paper width/height and content-to-paper distances at all four edges. Record measurements in mm.
7. Inspect text for glyph substitutions, missing Bengali conjuncts, clipping, line overlap, minimum 8 pt legibility, table borders and page count.
8. Repeat once to verify repeatability; record any printer-driver scaling variance.

## Test case B — Ghostscript-finalized exact-A6 PDF

1. Start with a separate copy of the browser-generated PDF from Test A.
2. Run:
   ```bash
   npm run finalize:draft-memo:pdf -- browser-output.pdf finalized-a6.pdf
   npm run verify:draft-memo:pdf -- finalized-a6.pdf
   pdfinfo -box finalized-a6.pdf
   pdffonts finalized-a6.pdf
   ```
3. Confirm one page, portrait, MediaBox/CropBox approximately 297.64 × 419.53 pt (105 × 148 mm), rotation 0.
4. Confirm embedded Noto Sans Bengali font and minimum 8 pt text. Font embedding is not proof of correct shaping; inspect actual printed glyphs.
5. Print finalized PDF on the same printer, same A6 stock, actual size / 100%, no scaling.
6. Repeat photographs and measurements. Inspect for clipping introduced by fixed-media processing; Ghostscript does not scale content and may clip content outside the final page.

## Acceptance measurements

| Measurement | Expected | Actual |
|---|---:|---|
| Paper width | 105 mm | |
| Paper height | 148 mm | |
| Left safe margin | ≥ 3 mm | |
| Right safe margin | ≥ 3 mm | |
| Top safe margin | ≥ 3 mm | |
| Bottom safe margin | ≥ 3 mm | |
| Minimum rendered text | ≥ 8 pt | |
| Page count | Exactly 1 | |
| Orientation | Portrait | |
| Scaling | 100%, none | |
| Bengali and English glyphs | Legible; no missing/clipped glyphs | |
| Content clipping | None | |

## Evidence and sign-off

Retain both original PDFs, both `pdfinfo -box` outputs, `pdffonts` outputs, printer settings screenshot, full-page and close-up photographs, measurements, printer/driver metadata, test date and operator signature. Identify Test A and Test B separately. A PDF geometry pass without physical output is not a physical printer pass.

Defects must state which output (browser or Ghostscript) failed, page coordinate/edge, measured deviation, photo reference and reproduction settings. Do not adjust product scope or introduce scaling/pagination as a workaround; route the defect to PO for disposition.
