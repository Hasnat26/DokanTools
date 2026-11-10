# DokanTools — Invoice-First Web MVP Technical Design Proposal

**Task ID:** DT-CH3-INVOICE-FIRST-WEB-MVP-TECH-DESIGN-001  
**Role:** CH-3 — Engineering / Implementation  
**Repository:** Hasnat26/DokanTools  
**Baseline branch:** main  
**Baseline commit:** 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1  
**Document status:** PROPOSED — CH-1 / PM REVIEW REQUIRED  
**Authorization:** DESIGN AND PLANNING ONLY  
**Implementation status:** NOT AUTHORIZED

---

## 1. Executive recommendation

The existing Next.js / React / Supabase web application contains reusable shop-profile, menu-catalog, memo-entry, PDF, QR, WhatsApp, authentication, tenant-RLS and idempotent-write foundations. It does not yet implement the PO-confirmed customer-facing Bangla invoice workflow.

The principal architectural issue is that the current memo RPC is not an invoice-only transaction. Calling public.create_memo_transaction always enters the stock-matching/deduction logic and, when a due amount is supplied, creates a customer-ledger entry. The current memo page also loads customer and stock records, creates a shop-level QR, generates an English jsPDF document and shares a shop URL. It must not be reused unchanged for the Invoice-First MVP.

**Recommended direction:** implement a separate invoice domain and transaction path while reusing the existing authentication, shop profile, item_catalog, QRCode package, Supabase client conventions, transaction_requests idempotency pattern and dashboard shell. Keep invoice creation independent of customer records, customer ledger and inventory. Preserve the existing memo/stock/baki modules and historical data; do not repurpose or silently change their semantics.

Recommended first customer flow:

1. Owner opens the invoice screen.
2. Owner selects active food-menu entries or enters a one-off line.
3. Owner reviews quantities, unit prices and total.
4. One atomic, idempotent invoice transaction persists the bill and immutable line/shop snapshots.
5. The application generates the individual bill URL and QR.
6. Owner prints/saves the Bangla invoice and shares the bill URL through WhatsApp or a fallback share action.
7. Customer opens a public, read-only bill page and sees only the PO-approved bill fields plus server-verified status.

This proposal does not grant implementation, database, testing, deployment or pilot authority.

## 2. Baseline verification and source inventory

### 2.1 Exact baseline

GitHub confirmed:
- Repository: Hasnat26/DokanTools
- main ref at inspection: 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1
- Commit object: 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1
- Commit title: Merge DT-GOV-002 post-merge SSOT activation

The three mandatory authority/decision files were fetched from this exact commit:

| File | Blob SHA | Status / purpose |
|---|---|---|
| WORKER_SINGLE_SOURCE_OF_TRUTH.md | 5714e127aad7a81d3e26da2ac2d77fe875927fdc | Active project governance instructions |
| PROJECT_SOURCE_OF_TRUTH.md | 0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5 | Active authority register; records existing web baseline and governance gaps |
| docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md | efe0d261c50a4cfc706e82c832a6f052c676127c | PO-confirmed Bangla invoice layout and bill-QR purpose only |

The PO decision confirms the Bangla food-bill format, shop name/address/mobile/Google Maps location, bill number/date/time, item/quantity/price/total, individual bill verification/details QR and the specified Bangla heading/footer. It does not approve QR token mechanics, cancellation semantics, offline verification, payment/due fields, PDF paper size or implementation.

### 2.2 Inspected implementation inventory

The following files were inspected at the pinned commit. Blob SHAs are included for exact provenance.

| Area | Existing path | Blob SHA | Finding |
|---|---|---|---|
| Memo/invoice UI | src/app/dashboard/memo/page.tsx | 71e45fac104006623b403d1624e9fc37921ed5fd | Existing memo form, recent memo list, PDF, QR and WhatsApp actions; tightly coupled to customers, stock and due |
| Stock + catalog UI | src/app/dashboard/stock/page.tsx | d13854f15566b9e24bccaf4d410715a9fef58b26 | Catalog CRUD is embedded in inventory screen; stock creation/adjustment and catalog operations are mixed |
| Dashboard/shop profile | src/app/dashboard/page.tsx | ee6dc3733cd4d50ec1dd76106477d50ab4b25c0c | Shop name, phone, address, map_link, public shop toggle and dashboard navigation |
| Existing public shop route | src/app/shop/[shopId]/page.tsx | a13db5473d7d38ce16641774f3d2d1e93451377f | Reads public shop profile, public products and offers; not an individual bill page |
| Supabase client/types | src/lib/supabase.ts | 93c187a8384752346c0f0911c84b61f35b88cae6 | Browser client uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY; no server-only admin client in the inspected tree |
| Calculation helpers | src/lib/reliability-core.mjs | 5d6d14636197814015cb5c609242496ce531d1f6 | JS number-based minor-unit rounding, quantity validation and stock simulation |
| Memo pending outbox | src/lib/memo-pending-store.mjs | cbf73762367b45fb6b2358333302dbd4dd942506 | IndexedDB durable pending memo operation store with atomic claim and compare-delete |
| Catalog migration | supabase/migrations/20261019_inventory_catalog.sql | 1f72ad2c8d643ec2d536225d8c8c09992d53cdc3 | item_catalog table, owner policy and initial public-read policy |
| Reliability migration | supabase/migrations/20261019_reliability_foundation.sql | 6b6b51318a5b4d1f38880ec2007049409102931c | Tenant RLS, narrow public shop views, memo/stock/baki RPCs and grants |
| Idempotency migration | supabase/migrations/20261102_p0_idempotency.sql | 03c9cb2940799731d614e97a9b48da2d9418f707 | Adds payload-bound idempotency to create_memo_transaction and related RPCs |
| Canonical schema | supabase/schema.sql | e859b6de9660533962eddb6f9f3d17ad8a4c1cca | Existing shops, customers, memos, item_catalog, stock, ledger, transaction request and audit structures |
| Package/dependencies | package.json | ae172ae60fa1ea497ea57c076026b46d70790109 | Next.js 15.5.28, React 19.3.x, Supabase JS, jsPDF and qrcode already declared |
| Bengali document language | src/app/layout.tsx | e62a6c37b491d3e8c2b80170ef428650cc161e95 | Root HTML lang is bn |
| Current stage statement | docs/CURRENT_STAGE_BN.md | de65042cdab05f819038f48a2e4f5e492ed40074 | Reliability foundation / pilot preparation; not production-ready; offline transaction queue and runtime validation incomplete |

The recursive tree at the pinned commit contains no individual bill route, invoice-specific API route, invoice table/migration, Bengali font asset or server-side Supabase helper. No source path under src/app/api or public/fonts was present in the inspected tree. This is a source-tree finding, not a live deployment inspection.

### 2.3 Existing database objects and controls

The inspected schema/migrations define:
- shops: tenant root, owner user_id, shop_name, phone, address, map_link and is_public.
- item_catalog: id, shop_id, name, unit, purchase_price, sale_price, sort_order, is_active, created_at; unique(shop_id, name).
- memos: id, shop_id, nullable customer_id, items_json, total_amount, due_amount, created_at.
- customers and baki_entries: customer identity and financial ledger.
- stock_items and stock_movements: inventory balance and movement history.
- transaction_requests: shop-scoped operation_id uniqueness, operation_type, entity_id, status, created_at/completed_at and payload_json after the P0 migration.
- audit_events: actor, operation, event/entity identity and event_data.
- public_shop_profiles and public_shop_products: narrow public views for published shop pages.

The reliability migration removes the initial public-read policy from item_catalog. The remaining owner catalog policy is authenticated and checks that the referenced shop belongs to auth.uid(). The memos table is owner-readable through tenant RLS; direct insert/update/delete is revoked and the memo RPC is granted to authenticated users. The public shop views are explicitly granted to anon/authenticated; no equivalent public memo/bill view exists in this baseline.

Live database migration state, deployed RLS state and live function grants were not queried. The above is source-level evidence from the pinned SQL files only.

## 3. Issue-by-issue root cause and remediation matrix

| ID | Current condition / root cause | Proposed remediation | Dependencies / acceptance evidence |
|---|---|---|---|
| R1 Bangla invoice/PDF | createPdf() uses jsPDF default font and English labels; currency is rewritten to Tk; item names are truncated to 30 characters; QR is placed after content; page breaks are basic and do not repeat headings. No Bengali font asset is present. | Replace the memo PDF layout with a reusable Bangla InvoiceDocument and print stylesheet using a locally bundled Bengali-capable font. Render item names without silent truncation; use measured layout and pagination. | PO paper-size decision; font licensing/asset review; visual PDF/browser tests on Bengali conjuncts, vowel marks and line wrapping |
| R2 Individual bill QR | QR currently encodes /shop/{shopId}; it is a shop/profile QR, not a bill reference. | Generate a stable, bill-specific signed URL. QR points to one invoice ID plus server-verifiable signature; no shop ID-only QR. | Server-only signing secret, public route, invoice persistence, invalid/revoked/tampered reference tests |
| R3 Public bill details | /shop/[shopId] reads public shop profile/products/offers; there is no individual bill route. Raw memos are not public. | Add a dedicated read-only bill route and a narrow server-side lookup that verifies the signed reference and returns an explicit allow-list only. Never expose raw memo/customer/ledger tables. | RLS/grant review, service-role isolation or equivalent server-side access design, cross-tenant negative tests |
| R4 WhatsApp | share() sends an English Memo summary and shop page URL; it can target a stored customer phone. | Generate a Bangla message with bill number, date, total and the exact bill URL. Default to WhatsApp share chooser; do not require a customer record or phone. Add Web Share/copy fallback. | Final approved message wording; Android/Desktop share fallback tests |
| R5 Food menu | item_catalog exists, but its CRUD UI is embedded in /dashboard/stock and shares the screen with stock creation, stock quantities and inventory controls. | Add a menu-only owner screen over item_catalog. Add/edit name, unit and sale price; activate/deactivate via is_active. Do not create stock_items as a side effect. | PO confirmation of unit/name validation details; catalog RLS and normalized duplicate tests |
| R6 Invoice calculation/persistence | create_memo_transaction couples memo insert to stock matching/deduction and due-ledger insertion. It requires positive total, quantity >0 with max 3 decimals, price >=0; due >0 requires a customer. P0 adds payload-bound idempotency. | Add a separate create_invoice_transaction path with no customer_id, due ledger or inventory side effects. Use PostgreSQL numeric, immutable line snapshots, atomic bill numbering and request-payload idempotency. | New migration/RPC, decimal boundary tests, duplicate/lost-response retry tests, no-stock/no-ledger side-effect tests |

## 4. Target architecture and route structure

### 4.1 Application flow

Owner UI:
- /dashboard/invoices — create bill, list recent bills and open an existing bill for print/share.
- /dashboard/menu — add/edit food items, change sale price, activate/deactivate.
- /dashboard — prioritize invoice and menu actions; preserve links/data for existing modules until PM/PO decides whether legacy modules should be hidden from the Invoice-First customer path.

Customer UI:
- /bill/v1/[invoiceId]/[signature] — public read-only bill details and verification state.
- Existing /shop/[shopId] remains the separate opt-in promotional shop page. A bill URL must not require the shop marketing page to be public.

Server/API:
- POST /api/invoices/[invoiceId]/share-link — authenticated owner endpoint that verifies invoice ownership and returns the deterministic signed customer URL.
- Public bill page/server lookup validates the signature before retrieving invoice data and returns only approved bill fields.
- Do not create a public API that accepts arbitrary memo IDs and returns raw memos.

The owner invoice screen can replace the current memo-first entry point after explicit product approval; preserve /dashboard/memo as a redirect or compatibility route if required. No existing route should be deleted as part of the first implementation without a separate decision.

### 4.2 Components/modules to add or refactor

Proposed components:
- InvoiceComposer: menu selection, one-off line, quantity, price and live total.
- InvoiceLineEditor: editable snapshot line; no stock availability or customer selector.
- InvoicePreview / InvoiceDocument: PO-confirmed Bangla layout, reusable in browser preview and print.
- InvoicePrintActions: print/save-as-PDF, QR and WhatsApp/share fallback.
- InvoiceHistory: recent bills and owner-only detail.
- FoodMenuManager: item_catalog-only CRUD.
- PublicBillPage: allow-listed invoice details and server verification status.

Proposed domain modules:
- invoice-calculation.ts: decimal-safe normalization and preview contract.
- invoice-validation.ts: client-side UX validation, mirrored by server/RPC validation.
- invoice-print.css and InvoiceDocument.tsx: print layout and page-break rules.
- server-only invoice-link-signing module: HMAC signing/verification; never imported by client components.
- server-only Supabase admin client, if the selected public lookup architecture uses service-role access.

Reuse existing supabase.ts browser client, Shop profile types, qrcode package, layout shell, item_catalog data and transaction_requests idempotency design. Do not reuse create_memo_transaction for invoice creation.

## 5. Database/API/RPC proposal

### 5.1 New invoice persistence model

Recommended additive tables:

**invoice_counters**
- shop_id UUID primary key / FK to shops.
- next_number BIGINT not null, initialized per shop.
- Counter updates occur inside the invoice transaction and are row-locked.

**invoices**
- id UUID primary key.
- shop_id UUID not null.
- bill_number BIGINT not null.
- shop_name_snapshot, shop_address_snapshot, shop_phone_snapshot and shop_map_link_snapshot.
- total_amount NUMERIC(12,2) not null.
- status constrained to issued/revoked (or the PO-approved lifecycle).
- integrity_digest (optional source-integrity check).
- created_at, created_by, revoked_at, revoked_by and revocation_reason as approved.
- UNIQUE(shop_id, bill_number).

**invoice_lines**
- invoice_id UUID FK.
- line_no integer.
- item_name_snapshot text.
- quantity NUMERIC(12,3).
- unit_snapshot text.
- unit_price NUMERIC(12,2).
- line_total NUMERIC(12,2).
- PRIMARY KEY(invoice_id, line_no).

Invoice lines are immutable snapshots. Editing a menu item later must not change historical invoices. Customer name, phone, customer_id, due amount and ledger foreign keys are deliberately absent from the invoice model unless PO explicitly adds them.

A separate invoice table is preferred over extending memos because the existing memo lifecycle and RPC have inventory/ledger semantics. It avoids changing the meaning of existing memo records.

### 5.2 Idempotency and transaction RPC

Proposed RPC: public.create_invoice_transaction(p_request_id UUID, p_shop_id UUID, p_items JSONB).

Within one PostgreSQL transaction:
1. Require authenticated user and verify shops.user_id = auth.uid().
2. Validate request ID, non-empty item array, names, quantity precision, unit and price range.
3. Claim the shop-scoped operation ID in transaction_requests using operation_type invoice_create and a canonical payload_json.
4. If request ID already exists, compare exact canonical payload; return the same invoice only when type/status/payload match. Reject payload mismatch or unresolved processing state.
5. Lock/update invoice_counters and allocate one bill number.
6. Snapshot current shop details and insert invoices plus invoice_lines.
7. Calculate each line total and invoice total using PostgreSQL NUMERIC, not JavaScript floating point.
8. Write an audit event and complete the transaction request with entity_id.
9. Return invoice ID, bill number, total and duplicate indicator.

The existing transaction_requests operation_type CHECK currently lists memo_sale, stock_item_create, stock_adjustment and baki_entry. A migration must explicitly extend that constraint for invoice_create. The P0 migration already adds payload_json and compares payloads for create_memo_transaction. Reuse the pattern; do not alter the existing memo RPC.

The invoice RPC must not:
- insert or select customers;
- write baki_entries;
- read or deduct stock_items;
- create stock_movements;
- require an inventory match;
- change item_catalog or menu prices.

### 5.3 Public link and server-side verification

Recommended URL format: /bill/v1/{invoiceId}/{signature}.

- Invoice ID is a random UUID; signature is HMAC-SHA256 over a versioned, domain-separated invoice reference using a server-only secret.
- The signature is deterministic for a given invoice ID and key version, so an owner can re-open/reprint the same bill link without storing a plaintext bearer token in the database.
- The signing secret must never use a NEXT_PUBLIC_ variable or be bundled into browser code.
- Server verification uses constant-time signature comparison before reading the invoice.
- Versioned signing keys permit a controlled key rotation; old key versions must remain verifiable for the agreed retention period.
- The public page reads only invoices and invoice_lines after signature verification, using a server-only Supabase admin client or an equivalently constrained server-side RPC.
- Return an explicit allow-list DTO. Never serialize a Supabase row wholesale.

Operational prerequisite: the inspected app has no server-side Supabase helper and the environment example contains only public Supabase variables. This design therefore requires a server-only service-role secret and invoice-link signing secret in the hosting environment. The service-role key must never be sent to the browser. The server route must independently validate owner identity for owner actions; public lookup must validate HMAC and return only approved fields.

QR generation uses the existing qrcode package, but encodes the signed individual bill URL, not /shop/{shopId}. QR is a locator to the verification service; the server-side invoice record and status are the authority. The QR image itself is not proof of payment, legal certification or authenticity.

## 6. Public customer bill page and privacy

### 6.1 Approved display allow-list

Show only:
- shop name, address, mobile number and Google Maps location snapshot;
- heading খাবারের বিল;
- bill number, date and time;
- item name, quantity, unit price and line total;
- total bill amount;
- bill verification state;
- footer ধন্যবাদ, আবার আসবেন!

Do not show:
- customer name, customer phone, customer_id;
- customer due/paid history or ledger balance;
- owner email, auth user ID, credentials or private profile fields;
- other invoices, memo records, stock, purchase price or internal audit data.

The customer bill page must work independently of the shop promotional page's is_public setting. The customer is not required to register or authenticate.

### 6.2 Verification outcomes

| Condition | Customer response |
|---|---|
| Valid signature, invoice exists, status issued | Show bill details and “বিলটি DokanTools রেকর্ডে যাচাইকৃত” status |
| Invalid/altered signature or malformed reference | Generic invalid-reference page; do not query or disclose invoice data |
| Valid signature but no invoice row | Unavailable/not-found response; no data |
| Invoice status revoked | Show “বিলটি বাতিল” and verification failure; hide or show details only if PO explicitly approves |
| Stored integrity check fails | “বিলের তথ্য যাচাই করা যায়নি”; do not present it as valid |

A valid reference confirms that the server found the corresponding issued record. It does not prove that cash was paid or that the food was delivered. The PO must define whether revoked invoices retain visible line details or show only a cancellation notice.

Security controls:
- no direct anon SELECT on invoices, invoice_lines, memos, customers, baki_entries or transaction_requests;
- no public memo lookup by UUID;
- public response field allow-list and server-side signature verification;
- Cache-Control: no-store for status-sensitive bill views; no-referrer policy; noindex;
- avoid logging signatures or full public URLs;
- rate limiting at the server/edge/hosting layer; an in-process memory limiter alone is not reliable for multiple server instances;
- validate map_link as an HTTPS Google Maps URL before rendering it as a link;
- test cross-shop IDs, random signatures, revoked bills and attempted field over-fetching.

## 7. Bangla invoice, PDF and printing strategy

### 7.1 Font/rendering

The current jsPDF call creates a default document and uses built-in font output; no Bengali TTF/WOFF2 asset is in the inspected repository. The existing implementation therefore does not establish correct Bengali glyph coverage or shaping.

Recommended first implementation:
- build the invoice as semantic HTML/React with Bengali Unicode text;
- bundle a licensed Noto Sans Bengali WOFF2 (or another verified Bengali font) locally under public/fonts; do not depend on a third-party CDN at print time;
- define @font-face and wait for document.fonts.ready before enabling print;
- use browser-native text shaping and print rendering rather than assuming jsPDF's Unicode font embedding alone handles Bengali conjuncts and vowel-mark positioning;
- print via the browser's native Print / Save as PDF action, using the same InvoiceDocument component for preview and print;
- include the font license and asset version/hash in the implementation PR.

One-page behavior:
- PO must choose paper size. Recommendation for initial review: compact A5 portrait PDF; optionally add 80 mm thermal receipt output as a separately tested print profile.
- Use compact shop header, bill metadata, a clear item table and total section; keep QR and footer together.
- Measure actual rendered height. Normal bills fit one page; long item names wrap rather than truncate.
- For unusually long invoices, paginate automatically, repeat shop/bill header and table headings, keep the total/QR/footer block together where possible, and show page numbering. Never shrink text below the PO-approved readability threshold just to force one page.
- Do not silently omit lines or clip totals/QR.

Direct one-click binary PDF download is not guaranteed by browser print. If the PO requires a deterministic server-generated PDF file rather than Print → Save as PDF, evaluate a server-side Chromium renderer with the Bengali font installed. That adds runtime/browser dependencies and should be a separate implementation decision after a proof-of-rendering spike.

### 7.2 Print acceptance evidence required later

- Bengali conjuncts, কার/ফলা, vowel marks, punctuation and ৳ render correctly.
- Text remains selectable/searchable in the PDF.
- Font is embedded or otherwise reliably available in the generated PDF.
- One-page normal bill and multi-page long bill both preserve all content.
- QR remains sharp and scans from printed output.
- Test Chrome desktop and target Android browser/print path; no such runtime test was performed for this proposal.

## 8. WhatsApp sharing

Generate the message from the persisted invoice snapshot, not from the live form or current menu.

Suggested Bangla message (wording requires PO confirmation):

দোকানের নাম  
খাবারের বিল: {bill number}  
তারিখ: {date and time}  
মোট বিল: ৳{total}  
বিল দেখুন ও যাচাই করুন: {signed bill URL}  
ধন্যবাদ, আবার আসবেন!

Implementation:
- default share action opens https://wa.me/?text={encoded message}; customer does not need a DokanTools account;
- do not require or store a customer phone number for sharing;
- where supported, use navigator.share as an additional device-native fallback;
- if WhatsApp is unavailable, popup is blocked or sharing fails, provide Copy message, Copy bill link and Print/Save PDF actions;
- never send the shop profile URL as the bill link.

## 9. Food menu management

The existing item_catalog is the correct reusable data source. It already has shop_id, name, unit, purchase_price, sale_price, sort_order and is_active, with shop-scoped owner RLS. The initial migration created a public-read policy, but the reliability migration drops that policy; menu data should remain owner-only.

Recommended owner UI:
- add item: name, unit (default proposal: পিস), sale price;
- edit item: name, unit and sale price;
- activate/deactivate using is_active; do not delete menu rows as the normal removal action;
- simple list/search and clear active/inactive status;
- no categories, variants, recipe, stock, purchase workflow or inventory controls in the Invoice-First menu path unless separately approved.

The current /dashboard/stock page mixes item_catalog and stock_items. Its saveProduct() updates item_catalog, while submit()/addToStock() also creates inventory records. Do not call those stock-creation paths from the new menu screen.

Technical caveats:
- unique(shop_id, name) is case-sensitive and does not guarantee Unicode-normalized/case-folded duplicate prevention. Add a server-side canonical-name validation and a matching database uniqueness strategy after PO confirms duplicate semantics.
- Historical invoice lines must snapshot item name/unit/price so menu edits do not rewrite old bills.
- purchase_price remains in the existing schema for compatibility but is not needed in the first menu UI.
- The authority register records PO-B01–PO-B07 as NOT ESTABLISHED AS GITHUB BASELINE. Do not infer those historical rules. CH-1/PO must provide or approve the exact menu policy before implementation.

## 10. Invoice calculation, validation and persistence

### 10.1 Calculation contract proposal

- Quantity: positive finite decimal, maximum 3 decimal places, consistent with the current SQL precision.
- Unit price: finite non-negative BDT amount with 2 decimal places.
- Line total: round(quantity × unit price, 2) using PostgreSQL NUMERIC.
- Invoice total: sum persisted line totals, rounded to 2 decimals.
- Persist quantity, unit price and line total as NUMERIC; do not use JavaScript binary floating-point as the authority.
- Reject blank item names, invalid numeric strings, NaN, Infinity, negative quantity, negative price, excess precision and out-of-range numeric values in both UI and RPC.
- Server/RPC revalidates all inputs; client validation is usability only.
- PO decision required: whether a zero-value line is permitted and whether an invoice whose total is zero may be issued. The existing memo RPC rejects total <= 0; do not silently carry that policy into invoices.

### 10.2 Duplicate submissions and retry

- Generate one UUID request ID per invoice draft.
- Persist request ID and exact immutable payload in IndexedDB before calling the RPC, using the existing pending-store contract where appropriate or a dedicated invoice outbox key/store.
- Retry must reuse the same request ID and exact payload.
- transaction_requests unique(shop_id, operation_id) plus payload_json provides the existing idempotency foundation; extend operation_type with invoice_create.
- Same request ID + same payload returns the already-created invoice and bill number.
- Same request ID + different payload fails closed.
- A timeout/lost response must not cause a second invoice or second bill number.
- Clear the pending outbox only after the canonical invoice row and bill number are confirmed.
- If IndexedDB is unavailable or the pending payload cannot be saved, do not submit an invoice write. The UI must explain recovery state.
- Cross-tab concurrent submissions must be guarded by the database unique request key, not only a React useRef.

### 10.3 Bill number generation

Use a per-shop monotonic counter, allocated under row lock in the same database transaction as invoice creation. Enforce UNIQUE(shop_id, bill_number). Display a zero-padded representation (for example 000001) while storing a BIGINT. Never reuse a number after a bill is revoked. Recommendation: numbering is continuous per shop and does not reset daily; PO must confirm the desired visible format/reset policy.

## 11. Security and privacy assessment

| Surface | Current baseline | Required target control |
|---|---|---|
| Tenant isolation | shops ownership and owner RLS on financial/catalog tables | Retain owner-only RLS on invoices and invoice_lines; test two-shop isolation |
| Memo/customer privacy | Public shop views are narrow; customer/baki/memo are not public | Keep invoice public response separate from memos/customers/ledger |
| Public bill reference | No bill-specific reference exists | Versioned HMAC URL; server verification before retrieval |
| Server secrets | Browser Supabase anon key only in inspected helper | Server-only service-role key and invoice signing key; never NEXT_PUBLIC |
| Invoice mutation | No invoice model | Immutable issued invoice; revocation through narrow owner RPC and audit event |
| Public data | Existing public shop page is opt-in | Bill link access is separate from shop publication; response allow-list only |
| QR authenticity | Current QR points to shop page | QR only locates bill; verification status comes from server-side persisted record |
| Rate limiting | No bill endpoint/rate limiter in inspected tree | Add edge/hosting rate limits and generic failure responses |
| Auditability | audit_events exists for memo/stock/ledger | Add invoice_created and invoice_revoked events; no customer PII in public audit payload |

Do not grant anon SELECT on invoice tables. Prefer a server-side public bill route with signature verification and an explicit response DTO. If a SECURITY DEFINER public RPC is selected instead, it must accept only a non-guessable signed token, validate it server-side, set a fixed search_path, revoke default PUBLIC execute, grant only the intended role, and return only the allow-listed bill projection.

## 12. Dependency-aware implementation backlog

| Order | Work package | Main files / objects | Depends on | Exit evidence |
|---|---|---|---|---|
| 0 | PO decisions and design baseline | PO decision records; this design | CH-1/PM review | Paper size, bill lifecycle, menu policy, payment/due scope and offline scope recorded |
| 1 | Invoice schema and RPC | New migration; invoices, invoice_lines, invoice_counters; transaction_requests constraint; create_invoice_transaction | WP0 | SQL static tests; owner RLS; idempotency, concurrency and no-stock/no-ledger regression tests |
| 2 | Invoice domain and outbox | src/lib invoice modules; IndexedDB store | WP1 | Decimal boundary, duplicate request, lost response and reload recovery tests |
| 3 | Food menu UI | /dashboard/menu; item_catalog policies/constraints | WP0; catalog validation policy | Owner CRUD and cross-shop isolation tests; no stock writes |
| 4 | Invoice composer/history | /dashboard/invoices; InvoiceComposer; InvoiceHistory | WP1–WP3 | Create, list, retrieve, retry and immutable snapshot tests |
| 5 | Bangla document/print | InvoiceDocument; print CSS; local Bengali font | WP0 paper-size decision; WP4 | Browser/PDF glyph, wrapping, one-page and long-bill evidence |
| 6 | Signed bill link and public page | server-only signer; /bill/v1/[id]/[signature]; owner share-link route | WP1; server secrets configured | Valid/invalid/revoked/tampered/cross-tenant tests; public DTO audit |
| 7 | WhatsApp and fallback | share action; copy/share/print controls | WP4–WP6 | Encoded Bangla message, URL correctness and unavailable-app fallback |
| 8 | Independent acceptance | CH-4 test plan, staging environment | WP1–WP7 | Browser regression, RLS/RPC runtime, PDF and two-tenant security evidence |
| 9 | Release decision | CH-1/PM review | WP8 | Separate deployment and pilot authorization |

## 13. Milestones and effort estimate

Planning estimate only; assumes one engineer familiar with this repository, timely PO decisions and an available Supabase staging environment. It excludes implementation authorization delays, hosting procurement, production deployment and pilot operation.

| Milestone | Scope | Estimate |
|---|---|---:|
| M0 | PO decisions and final design baseline | 0.5–1 engineer day |
| M1 | Invoice schema/RPC/idempotency/RLS | 2–3 engineer days |
| M2 | Menu UI and invoice composer/history | 2–3 engineer days |
| M3 | Bangla document, font and print/PDF | 1.5–2.5 engineer days |
| M4 | Signed QR, public bill page and WhatsApp | 2–3 engineer days |
| M5 | Integration fixes and evidence preparation | 1–2 engineer days |

Indicative engineering total: 9–14.5 engineer days. Independent QA and staging verification should be planned separately (indicatively 2–4 days). This is not a delivery commitment.

## 14. Technical risks and mitigations

1. **Memo RPC side effects:** reuse would deduct inventory and write customer due. Mitigation: separate invoice RPC and explicit negative side-effect tests.
2. **Bengali PDF rendering:** Unicode font embedding alone does not prove Bengali shaping. Mitigation: locally bundled Bengali font, browser print pipeline and real PDF glyph inspection.
3. **Public link compromise:** signed URLs are bearer references. Mitigation: high-entropy HMAC secret, key versioning, no-referrer, no logging, rate limits and revocation.
4. **Service-role exposure:** server-side lookup may need privileged reads. Mitigation: server-only module, server env only, no client bundle, narrow DTO, no raw Supabase row serialization.
5. **Invoice mutation:** old invoices must not change after menu/profile edits. Mitigation: immutable snapshots, no direct owner UPDATE/DELETE, narrow revoke operation and audit.
6. **Decimal divergence:** JS and PostgreSQL may round differently. Mitigation: NUMERIC is authoritative; share test vectors and server-side validation.
7. **Duplicate bill numbers:** concurrent creation/retries. Mitigation: locked per-shop counter, unique constraint and atomic transaction.
8. **Legacy migration uncertainty:** source migrations do not prove the deployed database has applied them. Mitigation: before implementation, inspect the actual staging migration ledger and schema under separate authorization.
9. **Offline requirement:** current stage documentation says a complete offline transaction queue/PWA is not included. Invoice-first offline operation is not established by the inspected source. PO must decide online-only first release versus offline queue; do not advertise offline creation without runtime evidence.
10. **Catalog policy gap:** PO-B01–PO-B07 are not established as a GitHub baseline. Mitigation: obtain exact PO policy before coding menu validation/duplicate rules.

## 15. Explicit PO / PM decisions required

| ID | Decision required | CH-3 recommendation |
|---|---|---|
| PO-I01 | Print/PDF paper size: A5, A4 or 80 mm thermal | A5 portrait PDF first; add thermal profile only after printer/device confirmation |
| PO-I02 | Bill number format and reset policy | Per-shop monotonic sequence, zero-padded, never reset/reuse |
| PO-I03 | Payment, paid/due, discount and tax fields | Keep outside initial invoice unless PO explicitly approves; confirmed mockup shows total only |
| PO-I04 | Customer identity/phone requirement | No customer registration or phone required for an invoice; do not create customer rows |
| PO-I05 | Cancellation/revocation and correction | Issued invoices immutable; revoke with reason and create a new bill; confirm what customer sees on revoked link |
| PO-I06 | Public link lifetime and reprint behavior | Stable signed link, valid until explicit revocation; define retention and signing-key rotation |
| PO-I07 | Offline bill creation | Current source does not provide a complete offline transaction queue; confirm whether online-only is acceptable for first web MVP |
| PO-I08 | Menu item unit and duplicate policy | Reuse unit field/default, but require explicit approved Unicode/case duplicate rules; do not import unpinned PO-B01–B07 |
| PO-I09 | Zero-price lines / zero-total invoice | Confirm whether complimentary items and zero-total bills are allowed |
| PO-I10 | Long invoice pagination and maximum line count | Paginate without truncation; set a business maximum only after PO confirms normal bill size |
| PO-I11 | Verification wording | “DokanTools record verified” means a matching issued server record, not proof of payment or legal certification |

## 16. Verification boundary and acceptance conditions

**Performed for this proposal:**
- exact baseline main ref and commit verified through GitHub;
- mandatory governance and PO decision documents fetched from the exact commit;
- recursive source tree inspected;
- relevant Next.js pages, helper modules, package manifest, schema and migrations inspected at the pinned commit;
- source-level inventory and design analysis prepared.

**Not performed:**
- no source-code modifications;
- no migration/schema edits or SQL execution;
- no live Supabase database/RLS/RPC inspection;
- no npm install, build, lint, automated tests or browser runtime;
- no PDF/font runtime proof;
- no deployment, APK, pilot or production data operation.

**CH-1 review requested:** confirm whether this proposal is an acceptable technical direction, identify required PO decisions, and disposition the backlog order. PM implementation authorization remains a separate gate. No worker may start implementation, schema work, SQL, build, QA execution, deployment or pilot from this proposal alone.

---

**CH-3 conclusion:** the shortest safe path is a separate invoice domain/RPC with immutable invoice snapshots, a menu-only catalog UI, a Bangla HTML/print document, and a signed bill-specific public verification route. Reusing the current memo page/RPC without separating inventory and ledger side effects would not meet the Invoice-First objective.
