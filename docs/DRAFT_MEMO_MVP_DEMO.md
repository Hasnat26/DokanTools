# Draft Memo MVP — Local Demonstration

## Run

Requirements: Node.js 20 or newer. No npm install, Supabase project, account, database, or environment secrets are required for this isolated demonstration.

```bash
node scripts/serve-draft-memo-demo.mjs
```

Open `http://localhost:4173/`. The demo is served from `public/draft-memo-demo.html` and uses browser IndexedDB for shop profile, product catalogue, and saved drafts. Data remains in the current browser profile and is not synchronized to a server.

## Demonstrated scope

- Configure one shop profile (name, address, phone).
- Add catalogue products with unit and price.
- Build a multi-line memo with quantity and unit price.
- Calculate line totals and grand total using integer minor-unit rounding.
- Save, reload, edit, and delete local drafts.
- Preserve product name, unit, and price snapshots in each saved draft.
- Print a fixed A6 portrait page (105 × 148 mm) with 3 mm page margins, 99 × 142 mm content area, and 8 pt minimum text.
- Bengali font file is self-hosted at `public/fonts/NotoSansBengali.woff2`; no Google Fonts runtime request is needed.

## Explicit exclusions

This is an isolated local demonstration, not the authenticated Supabase application workflow. It does not provide multi-user sync, owner/shop account authorization, shared catalogue cache, offline-to-online synchronization, or server backup. IndexedDB is scoped to this browser origin/profile. Clearing browser data removes the demo records.

No invoice issuance, VAT, discount, paid/due, customer ledger, stock deduction, sales transaction, or public verification operation is implemented.

## A6 constraints and limitation

The demo checks the rendered preview's 99 × 142 mm content box before opening the browser print dialog. It does not shrink, rotate, paginate, or switch paper sizes. A user can still override paper settings in the browser print dialog; select A6 and disable browser headers/footers. Browser/driver print output must be independently checked on target printers before product acceptance.

## Verification evidence (sandbox run, 2026-11-19)

- Chromium headless workflow: shop profile saved; two catalogue products added; two lines entered (2 kg × ৳75.50 and 1.5 kg × ৳120.00); total verified as ৳331.00.
- Draft saved to IndexedDB, page reloaded, and saved draft reopened in edit mode with both lines.
- Generated PDF: one page; `pdfinfo` reported 298.08 × 420 pt. The nominal A6 target is 297.64 × 419.53 pt; the generated PDF is approximately 0.16 mm larger in each dimension. This remains an A6 print-geometry acceptance defect; do not treat the PDF as final production acceptance.
- `document.fonts.check()` returned true for Bengali text using the self-hosted Noto Sans Bengali font; canvas measured the Bengali sample after font load. PDF font inspection reported embedded Type 3 glyph subsets. This verifies font loading/embedding, not independent typographic proof of every conjunct or target-printer output.
- No browser page errors in the recorded run.
- Overflow rejection: 18 long Bengali item rows produced 1,673 px rendered height against a 537 px content box; print was blocked with an overflow warning.

The browser test used the preinstalled Playwright/Chromium in the temporary execution sandbox. Playwright is not added as an application dependency.

## Public-release preparation checklist (not a release approval)

- [ ] Scan current tracked files and all Git history for credentials, tokens, private URLs, and customer data. **Not completed:** the private Git repository could not be cloned into this sandbox; a complete history scan is still required.
- [x] Add `.env.example` with placeholders only; retain `.env.local.example` for the existing app.
- [ ] Verify `.gitignore` exceptions and run a secret scanner before public release.
- [x] Document local demo startup and scope.
- [ ] PO to approve a repository license. Recommendation: MIT for a permissive starter/demo; Apache-2.0 if an explicit patent grant is preferred. No license has been added.
- [ ] Review and quarantine sensitive historical artifacts. No history rewriting or artifact deletion has been performed.
- [x] Disclose the previously recorded baseline dependency audit: 20 findings (6 moderate, 14 high) at the approved baseline; rerun `npm audit` before any public release.
- [ ] Confirm third-party font attribution and OFL compliance; `public/fonts/OFL.txt` is included with the self-hosted Noto Sans Bengali font.
- [ ] Confirm README and setup instructions against a clean clone after the full repository has been scanned.

Repository visibility must remain private until the PO separately approves public release.


## Finalization update

The exact A6 evidence artifact has MediaBox and CropBox [0,0,297.64,419.53] pt (target 297.6378 × 419.5276 pt), one page, rotation 0, and embedded Noto Sans Bengali CID TrueType. It was generated from the browser PDF using Ghostscript fixed media; this does not scale content and clips content beyond the page boundary. The authenticated page now self-hosts the Bengali font and checks rendered DOM dimensions before print. The browser print dialog itself remains user-controlled.
