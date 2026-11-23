# DokanTools V1 authenticated browser QA

This workflow uses a disposable local Supabase Auth/PostgreSQL stack and a disposable synthetic shop owner. It provisions a second synthetic Auth user to verify tenant isolation through the real Auth token endpoint and PostgREST API.

Required environment variables (never commit or print credentials):

- `DOKANTOOLS_QA_URL`: local QA application origin.
- `DOKANTOOLS_QA_EMAIL` / `DOKANTOOLS_QA_PASSWORD`: synthetic owner account.
- `DOKANTOOLS_QA_EMAIL_2` / `DOKANTOOLS_QA_PASSWORD_2`: second synthetic identity.
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: local Supabase API URL and anon key.
- Optional `DOKANTOOLS_A6_PDF_OUTPUT`: fresh PDF output path.
- `DOKANTOOLS_REQUIRE_CATEGORIES=true`: require category migration and CRUD/association coverage.

The owner workflow creates a shop, catalogue/category records, stock link, multi-product Draft Memo, and verifies local IndexedDB save/reload/edit/delete. The second user must not read, insert into, update, or delete the owner's category through PostgREST. The workflow does not delete the shop or alter sales, ledger, invoices, payments, or production data. Use fresh synthetic users for each run; test-created rows are disposable.

Run in a QA environment with Playwright Chromium and Poppler installed:

```bash
node scripts/verify-forward-migrations.mjs
npx playwright test qa/browser/v1-functional.spec.mjs --project=chromium
pdfinfo -box artifacts/dokantools-authenticated-a6.pdf
pdffonts artifacts/dokantools-authenticated-a6.pdf
pdftotext artifacts/dokantools-authenticated-a6.pdf -
```

The generated PDF must be one portrait A6 page (105 × 148 mm), with correct page boxes, complete English-only content, minimum 8 pt text and no text/image clipping. The current print flow is English-only and does not embed a Bengali font. Physical printer acceptance remains a separate manual check. CI generates the PDF with explicit physical A6 dimensions to avoid Chromium CSS page-size rounding; the app's print stylesheet is independently checked by the source regression.
