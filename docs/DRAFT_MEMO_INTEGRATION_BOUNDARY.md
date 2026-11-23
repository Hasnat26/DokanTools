# Draft Memo integration and acceptance boundary

## Authenticated route and persistence

The authenticated `/dashboard/draft-memo` route authenticates through Supabase, resolves the current user, loads that user's shop using `user_id`, then loads active `item_catalog` rows filtered by `shop_id`. Drafts are stored in IndexedDB using a composite owner/shop/draft key and validated against the same owner and shop on save, load and list. Product name, unit and unit-price are copied into each draft line; editing the catalogue does not rewrite existing line snapshots.

The route does not create a sale, stock deduction, customer ledger, payment or invoice record. The authenticated Chromium workflow against disposable local Supabase passed on merged commit `2f257211e5f296d49b7ccf30e50fedcb2530a9f5` in CI Run #199. It exercised two synthetic Auth users, PostgREST/RLS category isolation, Draft Memo save/edit/reload/delete and PDF lifecycle. This is disposable CI evidence, not hosted staging or live customer evidence.

## Verified integration and A6

The integration retains Next.js, Supabase authentication, shop/catalogue reads and local IndexedDB draft persistence. CI verifies print-handler invocation, fresh A6 PDF generation, PDF download, browser-simulated Web Share payload, unsupported-share fallback, stale-PDF invalidation after line removal and edits, and final A6 geometry/content.

The fresh PDF is one-page portrait A6 (297.638 × 419.528 pt), MediaBox/CropBox within 0.1 pt of expected, 33 text boxes checked with zero out-of-bounds text, no out-of-bounds images, QR decoded and Maps link annotation verified. It is marked DRAFT ONLY — NOT AN ISSUED INVOICE. The output is English-only; Bengali print rendering is not verified/in scope.

## Invoice-First boundary (PO-10)

Discount, VAT/tax, Paid and Due remain Draft Memo-only. Invoice-First request/domain is total-only. The API rejects adjustment-bearing request shapes and returns HTTP 423 with `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL` for a valid request while issuance is disabled. The database runtime control is seeded false and inaccessible to the authenticated role; the transaction RPC checks the control before any invoice write. Invoice issuance remains OFF.

## External acceptance remaining

- Android Chrome native share: NOT VERIFIED; Playwright uses a simulated Web Share API.
- WhatsApp document delivery to a real recipient and recipient-side PDF open: NOT VERIFIED.
- OS print dialog/driver and physical A6 printer: NOT VERIFIED; CI intercepts `window.print()`.

No hosted migration, deployment, production write, invoice issuance, customer pilot or live transaction occurred. See [PR #47 post-merge closeout](./PR47-POST-MERGE-CLOSEOUT.md) for exact CI job IDs, hashes and release-readiness classification.
