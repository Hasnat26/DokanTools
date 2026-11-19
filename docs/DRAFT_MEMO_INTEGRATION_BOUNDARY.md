# Draft Memo integration and acceptance boundary

The authenticated `/dashboard/draft-memo` route authenticates through Supabase, resolves the current user, loads that user's shop using `user_id`, then loads active `item_catalog` rows filtered by `shop_id`. Drafts are stored in IndexedDB using a composite owner/shop/draft key and validated against the same owner and shop on save, load and list. Product name, unit and unit-price are copied into each draft line; editing the catalogue does not rewrite existing line snapshots.

The route's inspected source does not call invoiceApi, memo RPC, stock_items, customers, baki_entries or transaction APIs. This is source inspection, not a live authenticated two-owner RLS test. Other legacy sales/ledger routes remain in the wider application.

The minimal integration change retains Next.js, Supabase auth, shop/catalogue reads and local IndexedDB persistence; replaces estimated row-count A6 fit with rendered DOM geometry checks; self-hosts Noto Sans Bengali; and adds exact-PDF MediaBox/CropBox verification. Browser printing remains an intermediate artifact; Ghostscript fixed-media processing sets the final A6 boxes without scaling content, clipping any content outside the exact page.

Remaining acceptance: two authenticated test owners and a disposable Supabase environment are required to verify RLS and cross-owner isolation at runtime. The browser print dialog and physical printer driver remain user-controlled. Do not claim independent QA or runtime RLS verification until separate evidence exists.

No invoice issuance/numbering, VAT/tax, discount, paid/due, customer ledger, stock deduction, sales transaction, public QR or verification behavior is introduced.
