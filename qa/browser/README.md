# DokanTools V1 authenticated browser QA

This Playwright spec is prepared for a dedicated, disposable Supabase owner account and an already-existing isolated QA web deployment.

Required environment variables (store credentials in the CI secret manager; never commit or print them):

- `DOKANTOOLS_QA_URL`: isolated QA application origin.
- `DOKANTOOLS_QA_EMAIL`: disposable synthetic owner account email.
- `DOKANTOOLS_QA_PASSWORD`: that account's password.
- Optional `DOKANTOOLS_A6_PDF_OUTPUT`: output path for the fresh application-generated PDF.
- Optional `DOKANTOOLS_REQUIRE_CATEGORIES=true`: require the category feature to be present and run category CRUD/association checks. Leave unset to verify the independent Shop Profile, catalogue, Draft Memo and PDF paths before migration; category checks are skipped when the feature is absent.

The category CRUD/association portion runs only after the corrected category migration has been separately approved and applied to isolated QA. The account must be new and must not already own a shop because the workflow verifies shop creation. Use a fresh synthetic account for each run; the test intentionally does not delete a shop or attempt database cleanup. The script creates one synthetic stock item to exercise the inventory-linked catalogue rename/delete guard. It does not adjust stock quantity or touch sales, ledger, invoices, or payments. The linked catalogue/stock rows remain in the disposable synthetic account; use a fresh account for each run.

Run in a browser-QA environment with Playwright Chromium and Poppler installed:

```bash
npx playwright test qa/browser/v1-functional.spec.mjs --project=chromium
pdfinfo artifacts/dokantools-authenticated-a6.pdf
pdffonts artifacts/dokantools-authenticated-a6.pdf
pdftotext artifacts/dokantools-authenticated-a6.pdf -
```

Review the PDF for one page, 105 x 148 mm geometry, embedded Bengali font, complete content and no clipping. Physical printer acceptance is a separate manual test.
