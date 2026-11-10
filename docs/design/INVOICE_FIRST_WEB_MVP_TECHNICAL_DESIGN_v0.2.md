# DokanTools — Invoice-First Web MVP Technical Design v0.2

**Task:** DT-CH3-INVOICE-FIRST-WEB-MVP-TECH-DESIGN-001  
**Role:** CH-3 — Technical Design  
**Repository:** Hasnat26/DokanTools  
**Source baseline:** `main` at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Technical PR:** #28  
**Prior design:** v0.1 at `ec67f403a625acea195c7913d23e7a69254c5ecc` (preserved unchanged)  
**UX input:** PR #30, HEAD `ca8324005048148b8d82c5151528ea41a2aa8a5a`  
**Independent assurance input:** CH-4 Issue #29; PR #28 comment `6763798273`; reviewed v0.1 HEAD above  
**Version:** 0.2  
**Status:** REVISED TECHNICAL DESIGN — CH-1 / PO disposition required  
**Scope:** Design documentation only  
**Implementation authorization:** NOT GRANTED  
**Runtime verification:** NOT PERFORMED

---

## 1. Executive disposition

Version 0.2 preserves the separate invoice-domain direction from v0.1 and makes the previously conceptual controls explicit: a versioned HMAC bill-link contract; per-link and invoice-level revocation; append-only invoice and lifecycle records; transactionally serialized numbering and idempotency; decimal input and rounding rules; an online-only issuance boundary; an explicit public response DTO and cache/logging controls; a reproducible Bengali font/rendering pipeline; and a testable traceability/acceptance matrix.

This document resolves CH-4 design findings CH4-01 through CH4-11 at the **design-specification level** and incorporates CH-2 PR #30 P1/P2 UX conditions. It does not claim implementation, runtime proof, PO approval or release readiness.

**Design decision classes used throughout:**
- **PO-CONFIRMED:** explicitly present in `docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md` at the pinned baseline. Binding.
- **UX-CONDITION:** stated in CH-2 PR #30. It is the UX review baseline, not a PO business decision.
- **TECHNICAL DESIGN:** a proposed engineering contract. It becomes implementable only after CH-1 approval and any required PO decisions.
- **PO-PENDING / BLOCKER:** business policy is not established. A safe interim behavior is specified, but the unresolved choice is not silently decided.
- **NOT VERIFIED:** requires implementation/runtime evidence under separate authorization.

### 1.1 Product boundary

The first web MVP is a shop-owner invoice workflow: shop profile → menu → compose → review → issue → Bangla print/PDF → WhatsApp/share → public bill verification. It does not include inventory, stock deduction, customer ledger, accounting, payment gateway, customer account, multi-branch or public ordering.

The invoice domain must not reuse `create_memo_transaction`: the pinned baseline RPC performs stock matching/deduction and can create customer due-ledger entries. Existing memo, stock and baki behavior remains separate and unchanged.

### 1.2 Gate status

- Technical design v0.2: submitted in PR #28 for CH-1/PO review.
- CH-4 v0.1 disposition: REJECT; findings mapped below.
- CH-2 PR #30 disposition of v0.1: ACCEPT WITH CONDITIONS; conditions mapped below.
- PO business decisions listed in §16 remain pending unless explicitly marked PO-CONFIRMED.
- Implementation, SQL/migrations, database operations, builds, tests/QA execution, deployment, merge and pilot: **NOT AUTHORIZED by this document**.

## 2. Authority, evidence and retained baseline

### 2.1 Pinned source evidence

The design is based on the source baseline `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`, not on an assumed current deployment state.

Mandatory documents at that baseline:
- `WORKER_SINGLE_SOURCE_OF_TRUTH.md` — blob `5714e127aad7a81d3e26da2ac2d77fe875927fdc`.
- `PROJECT_SOURCE_OF_TRUTH.md` — blob `0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5`.
- `docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md` — blob `efe0d261c50a4cfc706e82c832a6f052c676127c`.

The PO mockup confirms:
1. Shop name, address, mobile number and Google Maps shop location.
2. Exact heading `খাবারের বিল`.
3. Bill number, date and time.
4. Food/item name, quantity and price.
5. Total bill amount.
6. An individual bill QR for bill verification/details; a shop promotional QR is not a substitute.
7. Exact footer `ধন্যবাদ, আবার আসবেন!`.

The examples in the mockup are illustrative values, not price, number-format or quantity policy. The PO record does not decide token lifetime, key rotation, cancellation details, offline verification, paper size, price-column semantics, payment fields or menu policy.

### 2.2 Relevant source inventory

The v0.1 inventory remains the source-level baseline:
- `src/app/dashboard/memo/page.tsx`: memo form, English jsPDF, shop-level QR, WhatsApp/shop URL; customer/stock/due coupling.
- `src/app/dashboard/stock/page.tsx`: catalog operations mixed with stock creation/adjustment.
- `src/app/dashboard/page.tsx`: shop name, phone, address, map link and shop settings.
- `src/app/shop/[shopId]/page.tsx`: promotional shop page, not a bill-details route.
- `src/lib/supabase.ts`: browser Supabase client; no server-only admin client was present in the inspected tree.
- `src/lib/reliability-core.mjs`: JavaScript number-based calculation helpers.
- `src/lib/memo-pending-store.mjs`: IndexedDB pending memo operation store; this is not proof of offline invoice issuance.
- `item_catalog`, `memos`, `transaction_requests`, `audit_events` and related policies/functions in the pinned migrations/schema.
- `package.json`: Next.js/React, Supabase JS, jsPDF and qrcode dependencies.
- `src/app/layout.tsx`: document language set to `bn`.

At the pinned tree there was no invoice table/migration, invoice-specific route/API, Bengali font asset or server-side Supabase helper. These are source-tree observations only. Live Supabase migration state, grants, RLS and hosting configuration were not queried.

### 2.3 Design changes from v0.1

v0.1 is preserved unchanged. v0.2 supersedes it as the current technical design candidate and makes these corrections:
- Replaces deterministic invoice-only signature assumptions with an explicit key-ID and per-link HMAC capability contract.
- Separates immutable invoice facts from append-only lifecycle events so revocation does not require editing invoice snapshots.
- Defines transaction serialization, counter initialization, lock order, canonical request bytes and unknown-outcome recovery.
- Defines decimal grammar, storage bounds, rounding sequence, vectors and zero-value fail-closed behavior.
- Pins the Bengali font source/version/license and defines the binary-hash gate and deterministic PDF renderer.
- Makes web invoice issue and public verification online-only in the interim.
- Defines the exact public DTO, post-validation lookup predicate, response headers, cache bypass and abuse controls.
- Adds requirement-to-design-to-acceptance traceability and positive/negative acceptance scenarios.

## 3. Target application architecture and owner/customer journeys

### 3.1 Owner journey (CH-2 UX baseline)

1. Authenticate through existing application authentication.
2. Complete or review shop profile: shop name, address, mobile and Maps location.
3. Open the menu-only screen. Menu field rules remain gated by PO-B01–PO-B07.
4. Start a new bill. Only active, policy-approved menu items may be selected.
5. Review item names, quantities, price presentation and total.
6. Issue online using one durable request ID and exact payload.
7. On success, show the canonical server-assigned bill number/time and individual bill QR/link.
8. Open the persisted Bangla invoice preview; print or Save as PDF.
9. Share the persisted bill URL/message through WhatsApp; offer copy/native-share/print fallbacks.
10. Reopen bill history and reprint/re-share the same immutable invoice without issuing another bill.

Owner navigation proposal from CH-2: **নতুন বিল**, **বিলসমূহ**, **খাবারের মেনু**, **দোকানের তথ্য**. Legacy memo/stock links are not deleted by this design; their hide/de-emphasize treatment remains a CH-1/PO decision.

### 3.2 Customer journey

1. Scan the individual bill QR or open the exact bill URL.
2. Show a verification-in-progress state; do not render bill content as verified before server verification.
3. For a valid, issued bill, show only the public DTO and the bounded statement “বিলটি DokanTools রেকর্ডে যাচাইকৃত”.
4. For revoked/invalid/expired/unavailable/integrity-failure/offline states, show the distinct safe state defined in §10.
5. The verification statement means only that a matching issued DokanTools record was found. It is not proof of payment, delivery, food quality, tax compliance or legal certification.

### 3.3 Proposed routes and components

Owner routes:
- `/dashboard/invoices`: composer, review, history and persisted invoice detail.
- `/dashboard/menu`: menu-only owner UI; exact fields/validation gated by PO-B01–PO-B07.
- Existing shop profile/dashboard remains the source of shop details.

Customer route:
- `/bill/v1/{invoiceId}/{linkId}/{keyId}/{expiresAt}/{mac}`: public read-only bill page. This is a technical route proposal, not PO-approved URL syntax.
- Existing `/shop/{shopId}` remains a separate promotional shop route.

Server responsibilities:
- Authenticated invoice-creation endpoint/RPC.
- Authenticated owner endpoint to create/reissue or revoke an individual public link.
- Authenticated owner endpoint to revoke an invoice.
- Public server route validates HMAC before any invoice/link lookup and returns a typed allow-listed DTO only.

## 4. Persistence model and database-enforced immutability

The following is a proposed logical schema contract, not executable SQL. Physical types, FK names, indexes, grants and policies require a later authorized migration design/review.

### 4.1 Immutable invoice facts

**invoice_counters**
- `shop_id` PK/FK to `shops`.
- `next_number` BIGINT NOT NULL, initially 1.
- Counter row is allocated/locked inside the invoice transaction; no PostgreSQL sequence is used for bill numbering.

**invoices** (append-only issued facts)
- `id` UUID PK (server-generated UUIDv4 or UUIDv7; public token still required).
- `shop_id` UUID NOT NULL.
- `bill_number` BIGINT NOT NULL; UNIQUE(`shop_id`, `bill_number`).
- `issued_at` TIMESTAMPTZ NOT NULL, server-generated.
- Shop snapshots: `shop_name_snapshot`, `shop_address_snapshot`, `shop_phone_snapshot`, `shop_map_url_snapshot`.
- `currency_code` fixed to `BDT` for this MVP.
- `total_amount` NUMERIC(14,2) NOT NULL.
- `created_by` UUID NOT NULL, owner actor reference.
- `request_id` UUID NOT NULL; unique within shop/operation through the idempotency record.
- No customer, due, paid, discount, tax, payment-method, inventory or ledger foreign keys.

**invoice_lines** (append-only line snapshots)
- `invoice_id` FK, `line_no` INTEGER, composite PK(`invoice_id`, `line_no`).
- Optional `catalog_item_id_snapshot` UUID as provenance only; it is not a live FK dependency for historical rendering.
- `item_name_snapshot` TEXT, `unit_snapshot` TEXT NULL pending PO unit policy.
- `quantity` NUMERIC(12,3), `unit_price` NUMERIC(14,2), `line_total` NUMERIC(14,2).
- Item name/unit/quantity/price/line amount are copied at issue time. Later catalog/profile changes cannot rewrite them.

### 4.2 Append-only lifecycle and audit records

Do not mutate issued invoice facts to revoke a bill. Separate state into append-only events:

**invoice_status_events**
- `event_id` UUID PK, `invoice_id` FK, `event_type` (initial `issued`, later `revoked`), `occurred_at` TIMESTAMPTZ, `actor_user_id`, `reason_code` and bounded `reason_text` where approved.
- One initial issued event per invoice; at most one effective revoke event. Enforce uniqueness/transition constraints.
- Effective state is derived from the event stream or a security-reviewed view: issued if no revoke event exists; revoked if a revoke event exists.
- No transition from revoked to issued. Correction requires a new invoice, not editing/reopening the old one.

**audit_events**
- Add invoice-created / invoice-revoked / public-link-created / public-link-revoked / public-link-key-compromise events.
- Audit event and corresponding invoice/link event are inserted in the same database transaction.
- Do not put raw bearer URLs, MACs, customer data or secrets in audit payloads.

**invoice_public_links**
- `link_id` UUID PK, `invoice_id` FK, `key_id` TEXT, `expires_at` TIMESTAMPTZ NULL, `created_at`, `created_by`, `link_generation` INTEGER.
- Immutable link issuance record. One invoice may have multiple links during planned key rotation/reissue.
- A link is active only if it has no matching row in append-only `invoice_public_link_events` with event_type `revoked`, it has not expired, and the invoice has no revoke event.

**invoice_public_link_events**
- Append-only link lifecycle: `revoked`, `key_compromise_revoked`, optionally `superseded`.
- Unique effective revocation event per link.
- Revoke-link operation cannot alter the invoice or another link.

### 4.3 Database permissions and enforcement

The database, not only React/server code, must enforce immutability:
1. Revoke direct INSERT/UPDATE/DELETE on invoice facts, invoice lines, counters, link rows and lifecycle/audit tables from anon and ordinary authenticated roles.
2. Grant authenticated callers EXECUTE only on narrowly scoped SECURITY DEFINER RPCs for create, link issue/reissue, link revoke and invoice revoke. Revoke default PUBLIC execute; set a fixed safe `search_path`; schema-qualify referenced objects; validate `auth.uid()` and shop ownership inside every RPC.
3. The invoice-create RPC is the only path that inserts invoice facts/lines. It does not grant general UPDATE/DELETE.
4. No UPDATE/DELETE path exists for `invoices` or `invoice_lines`, including service-role application code. Operational DB owners remain a privileged break-glass trust boundary and must be audited.
5. Lifecycle is append-only. Database constraints/triggers enforce allowed event types, uniqueness and no transition back to issued. A revoke RPC inserts the invoice revoke event and audit event atomically.
6. A failed audit insert rolls back revocation; a failed status-event insert rolls back audit.
7. No cascade delete may erase invoice facts, lines, status events or audit history. Shop deletion/retention is a separate PO/legal decision; interim FK behavior should restrict destructive deletion.
8. If a digest is retained, use SHA-256 over a versioned canonical serialization of immutable header+ordered lines, store algorithm/version and digest, recompute on public read, and fail closed on mismatch. It is an integrity consistency check, not a substitute for DB permissions or a keyed signature. Do not make it optional at implementation time: either adopt and test it, or omit it explicitly. v0.2 recommends adopting it.

**Atomic invoice revocation:** owner-authorized `revoke_invoice(invoice_id, reason)` locks the invoice lifecycle key, verifies owner/shop, rejects already-revoked or returns the existing revoked state idempotently, inserts exactly one revoke event and matching audit event, then commits. Any failure rolls back both. Public reads derive state from the committed event. Revocation blocks all public links for the invoice without changing immutable invoice data.

## 5. Concurrency-safe bill numbering and transaction boundary

### 5.1 Number allocation

Use a transactional per-shop counter, not a non-transactional sequence:
1. Verify authenticated user owns `p_shop_id`.
2. Ensure counter row exists with `INSERT ... ON CONFLICT (shop_id) DO NOTHING`.
3. Lock it with `SELECT ... FOR UPDATE`.
4. Read `next_number` as allocated bill number; increment `next_number`.
5. Insert invoice and all dependent records before commit.
6. Enforce UNIQUE(`shop_id`, `bill_number`) as final collision guard.

The counter-row insertion race is serialized by the PK conflict. The row lock serializes all bill allocations for that shop. Different shops allocate independently.

### 5.2 Canonical lock order

For invoice creation, use one order everywhere:
1. Idempotency key row/unique-key claim for `(shop_id, operation_type, request_id)`.
2. Shop ownership row (read/lock as required to prevent ownership race).
3. Invoice counter row.
4. New invoice and line rows.
5. Audit/lifecycle rows.
6. Idempotency completion row.

No path may acquire these in reverse order. Revocation uses invoice lifecycle lock → invoice/link event insert → audit insert. It must not acquire the counter or idempotency locks.

### 5.3 Atomicity and number-gap policy

Request claim, counter increment, invoice, lines, initial issued event, audit event and idempotency completion occur in one PostgreSQL transaction. No intermediate committed `processing` row is required. A concurrent same-key request waits on the unique-key conflict and then reads the completed result after the first transaction commits. If the first transaction rolls back, its claim/counter/invoice writes roll back and the waiting request can become the creator.

**Number-gap interim contract:** failed/rolled-back creation does not consume a number because counter increment is transactional. Successfully committed invoices consume a number permanently, including invoices later revoked. Numbers are never reused. No daily/monthly reset or prefix is inferred. This sequence/gap behavior is a technical proposal; visible formatting/reset remains PO-pending.

### 5.4 Required concurrency behavior

- Concurrent first use creates exactly one counter row.
- Concurrent distinct requests serialize allocation and receive unique numbers.
- Concurrent same request ID and same canonical payload yields one invoice and the same invoice ID/number to all callers.
- Same request ID with changed shop, operation or payload is rejected.
- A failure at any point before commit leaves no partial invoice, line, event, audit or idempotency record and consumes no number.
- A lost response after commit is recovered by replaying the same request ID/payload; it returns the committed invoice.

## 6. Idempotency, canonical payload and lost-response recovery

### 6.1 Request identity

Client creates one cryptographically random UUID request ID per logical invoice draft. Before sending any network write, persist the request ID and exact versioned payload to IndexedDB. A new request ID is allowed only after the prior request is conclusively known not to have committed and the owner intentionally changes the draft into a new logical invoice.

### 6.2 Canonical request schema

Canonicalization version: `invoice-create/v1`.

Canonical fields, in fixed order:
1. `schema_version = 1`.
2. `operation_type = invoice_create`.
3. `shop_id` canonical lowercase UUID.
4. `currency_code = BDT`.
5. Ordered `lines[]`, each containing:
   - optional catalog item UUID (or null for approved source types only);
   - item name normalized to Unicode NFC for canonical identity and stored/rendered in NFC;
   - unit normalized to NFC or null (unit policy still PO-pending);
   - quantity as a plain decimal string, no exponent, no grouping separators, max 3 fractional digits;
   - unit price as a plain decimal string, no exponent, no grouping separators, max 2 fractional digits.
6. No client-supplied bill number, issued timestamp, total, owner ID or lifecycle state. The server derives these.

Serialization contract:
- UTF-8 JSON with fixed field order, no insignificant whitespace, exact array order retained, null represented explicitly, and no duplicate JSON object keys.
- Decimal strings are canonicalized by removing redundant leading integer zeros and trailing fractional zeros while retaining at least one integer digit; e.g. `001.250` → `1.25`, `1.000` quantity → `1`.
- Item display text is trimmed only at outer whitespace if that trim rule is confirmed by PO; until then preserve display text and canonicalize only Unicode NFC. No case-folding or punctuation stripping is inferred.
- Canonical hash: SHA-256 over the exact canonical UTF-8 bytes. Store canonicalization version, payload hash and canonical payload needed for conflict diagnostics; do not store bearer secrets in it.

Item order is meaningful and preserved. Reordering lines changes the request hash. Menu duplicate equivalence is separate from idempotency canonicalization and remains PO-gated.

### 6.3 Server idempotency contract

Use the existing shop-scoped `transaction_requests` pattern only after extending its operation-type constraint through a future authorized migration. Unique key must include shop + operation type + request ID (or the existing equivalent must be proven to enforce the same uniqueness).

- No existing key: insert claim, allocate number, persist invoice and mark completed in the same transaction.
- Existing key, same operation/shop/hash/version, completed: return the same invoice ID, bill number and canonical result with `replayed=true`.
- Existing key, different hash/version/shop/operation: reject with stable `IDEMPOTENCY_CONFLICT`; no invoice or number allocation.
- Existing key with incomplete state: should not occur under the single-transaction contract. If found due to legacy/manual intervention, do not allocate a new number; return `REQUEST_STATE_REQUIRES_RECONCILIATION` and require owner/admin recovery.
- Client timeout/connection loss: retain same request ID/payload; retry status/replay with the same identity. Never automatically mint a replacement ID.

### 6.4 Client outbox state machine

`draft` → `persisted` → `submitted` → one of:
- `confirmed`: canonical invoice response stored; pending request may be cleared.
- `known_not_committed`: server explicitly confirms no transaction; retry same request ID/payload.
- `unknown`: timeout, connection reset or ambiguous server failure; preserve outbox, query/replay same request ID.
- `conflict`: same key different payload; stop and show recovery error; do not overwrite payload.
- `local_persistence_failed`: do not send request; preserve visible draft in memory only with explicit warning that it is not safely saved.

IndexedDB is request-recovery storage, not an offline invoice ledger. It does not assign bill numbers or create a verified invoice.

## 7. Financial precision, bounds and deterministic calculations

### 7.1 Currency and storage

- Currency: BDT (৳), fixed for this MVP.
- Quantity: `NUMERIC(12,3)`; storage range 0.001 through 999,999,999.999.
- Unit price: `NUMERIC(14,2)`; storage range 0.00 through 999,999,999,999.99.
- Line amount: `NUMERIC(14,2)`; maximum 999,999,999,999.99.
- Invoice total: `NUMERIC(14,2)`; maximum 999,999,999,999.99.
- At most 100 lines per invoice as a provisional technical abuse/complexity ceiling. This is NOT PO-approved business capacity; implementation must not enable the cap as final policy until PO confirms expected bill size. Raise/revise if PO requires more.
- Every multiplication/sum must be checked against the target NUMERIC range before persistence. Overflow is a validation error, never silent wrap, truncation or client-only rejection.

These are technical envelope proposals for the schema and API. PO price, quantity and maximum-business-value rules remain pending. The safe interim issue policy rejects zero-price lines, zero-total invoices and any value outside this envelope. No negative amount is accepted.

### 7.2 Accepted lexical grammar

- Quantity: unsigned base-10 decimal; 1–9 integer digits and 0–3 fractional digits; at least one non-zero digit; no sign, exponent, comma, grouping separator, NaN, Infinity or whitespace-only value.
- Unit price: unsigned base-10 decimal; 1–12 integer digits and 0–2 fractional digits; no sign, exponent, comma, grouping separator, NaN, Infinity or whitespace-only value.
- Parse into exact decimal/NUMERIC on the server. Client parsing is preview-only and must use a decimal arithmetic library or integer/rational arithmetic, not binary floating-point.
- Excess fractional scale is rejected, not silently rounded at input.
- Zero unit price and a line amount that rounds to zero are rejected pending PO decision.
- Server revalidates all values and recomputes all amounts; client-supplied totals are ignored.

### 7.3 Rounding sequence

For each line:
1. Multiply exact decimal quantity × exact decimal unit price.
2. Round the line amount to 2 decimal places using PostgreSQL NUMERIC `round()` semantics (ties away from zero). Since negative inputs are rejected, positive half-cent ties round upward.
3. Persist the rounded line amount.
4. Sum persisted rounded line amounts exactly to produce invoice total; do not sum unrounded products and round only once.

The same stored line amounts and total drive owner preview after server response, PDF, public DTO and WhatsApp. If client preview differs from server result by any 0.01 BDT, block issue confirmation and show server-calculated values for owner review.

### 7.4 Golden calculation vectors

| ID | Quantity | Unit price (৳) | Exact product | Persisted line (৳) | Expected |
|---|---:|---:|---:|---:|---|
| FV-01 | 1 | 30.00 | 30.0000 | 30.00 | Accept |
| FV-02 | 1.125 | 0.10 | 0.11250 | 0.11 | Accept |
| FV-03 | 0.5 | 0.01 | 0.005 | 0.01 | Accept; half-cent rounds away from zero |
| FV-04 | 1.5 | 0.01 | 0.015 | 0.02 | Accept; half-cent rounds away from zero |
| FV-05 | 0.333 | 0.10 | 0.03330 | 0.03 | Accept |
| FV-06 | 1.005 | 1.00 | 1.00500 | 1.01 | Accept; fractional quantity allowed to 3 places |
| FV-07 | 2 | 0.29 | 0.5800 | 0.58 | Accept |
| FV-08 | two lines each 0.5 × 0.01 | 0.01 | 0.005 + 0.005 | 0.02 total | Per-line rounding then sum; not 0.01 |
| FV-09 | 0 | 30.00 | 0 | — | Reject: quantity must be > 0 |
| FV-10 | 1 | 0.00 | 0 | — | Reject pending PO zero-price decision |
| FV-11 | 1.0001 | 1.00 | — | — | Reject: quantity scale > 3 |
| FV-12 | 1 | 1.001 | — | — | Reject: price scale > 2 |
| FV-13 | -1 | 1.00 | — | — | Reject: negative quantity |
| FV-14 | 1 | -1.00 | — | — | Reject: negative price |
| FV-15 | 1e2 | 1.00 | — | — | Reject: exponent notation |
| FV-16 | 1,000 | 1.00 | — | — | Reject: grouping separator |
| FV-17 | maximum storage value | value causing product overflow | overflow | — | Reject before persistence |
| FV-18 | positive inputs whose rounded line is 0.00 | any | < 0.005 | 0.00 | Reject pending zero-value policy |

The vectors are a proposed deterministic test oracle, not executed results. PO must approve whether fractional quantities and zero-value cases belong in the business workflow.

### 7.5 Price-column ambiguity

The data model retains both unit price and extended line amount. CH-2 correctly identifies that PO mockup column `মূল্য` does not settle which one is printed. Composer may show unit price and calculated line amount separately for owner clarity, but the final printed/public item column must not be finalized until PO-UX-04 is decided. This is an implementation blocker, not an engineering assumption.

## 8. Bill-specific QR and HMAC capability lifecycle

### 8.1 Token contract

The bill QR contains a public URL with a signed, bill-specific capability. HMAC authenticates the URL claims; it does not encrypt them. Possession of the URL is bearer access to the public bill projection.

Canonical route:

`/bill/v1/{invoiceId}/{linkId}/{keyId}/{expiresAt}/{mac}`

- `invoiceId`: canonical lowercase UUID.
- `linkId`: canonical lowercase UUID identifying one independently revocable link record.
- `keyId`: strict ASCII key identifier, e.g. `k2026a`; maps to one configured verification key.
- `expiresAt`: Unix seconds as canonical decimal integer; `0` means no expiry.
- `mac`: unpadded base64url encoding of exactly 32 HMAC-SHA256 bytes.

Canonical signed message is UTF-8 bytes of exactly:

`DOKANTOOLS|PUBLIC-BILL|v1\n{invoiceId}\n{linkId}\n{keyId}\n{expiresAt}`

Signature:
`mac = HMAC-SHA256(key[keyId], canonicalMessage)`.

Key requirements:
- Each key is at least 32 cryptographically random bytes (256 bits), generated by a cryptographically secure random generator.
- Keys are held only in server-side secret storage/KMS, never in NEXT_PUBLIC variables, browser bundles, source control, client storage or logs.
- Route version `v1` and signing key ID are separate concepts.
- Parser rejects non-canonical UUIDs, unknown key IDs, unsupported route versions, invalid decimal expiry, oversized path components, padding/non-base64url characters and wrong MAC length.
- Verify with constant-time MAC comparison. Never use string equality for MAC comparison.
- Validate route syntax and key ID, compute and compare MAC, and only then query link/invoice tables. Invalid MAC or unknown key ID causes no invoice/link lookup.

### 8.2 Expiry policy and safe interim

**PO-PENDING:** public link lifetime is not approved by the PO record or CH-2. To preserve a printed QR's stable reprint/scan behavior, the interim technical proposal is `expiresAt=0` (non-expiring) while the link and invoice remain active. This is a deliberate bearer-link risk, not a claim that links are confidential or safe to forward.

Mitigations required before any release:
- per-link revocation;
- invoice-level revocation;
- strict no-store/no-referrer/no-third-party/log-redaction controls;
- rate limits and generic failures;
- owner ability to revoke a compromised link and issue a replacement;
- PO decision on whether a finite lifetime is required.

If PO selects finite expiry, store exact UTC expiry in the link row and signed claim; reject when server time is at or beyond expiry. Do not extend expiry by editing an existing link; create a new link record.

### 8.3 Link creation and reissue

Authenticated owner link-issue operation:
1. Verify caller owns invoice's shop and invoice is not revoked.
2. Select currently active signing key ID.
3. Create a random link UUID and immutable `invoice_public_links` row with key ID, generation and approved expiry (interim 0).
4. Commit link row and audit event atomically.
5. Generate URL/MAC from the persisted row and return it to the owner. No URL is logged.
6. QR encodes the exact URL for that invoice/link only.

Reissue creates a new link ID under the current key. Old links remain active until individually revoked/expired or invoice revoked; the owner can revoke old link(s). A reissue does not change invoice facts or bill number.

### 8.4 Per-link and invoice revocation

- **Link revoke:** authenticated owner operation inserts one append-only `invoice_public_link_events` revocation and audit event in one transaction. Every subsequent request for that link is denied. Other links for the same invoice remain valid.
- **Invoice revoke:** authenticated owner operation inserts invoice revoked event and audit event atomically. All links for the invoice become unusable. Public customer view shows only the approved safe revoked state, with no item lines until PO explicitly approves retaining details.
- Repeated revocation is idempotent or returns a stable already-revoked response; it never creates multiple effective revoke events.
- No invoice or line snapshot is edited/deleted.
- A link revocation without invoice revocation returns generic invalid/unavailable wording; invoice revocation may return the explicit cancelled state requested by CH-2 UX, without exposing details.

### 8.5 Signing-key rotation and compromise

Routine rotation:
1. Provision new key with a new unique key ID; mark it active for new links.
2. Retain prior keys as verify-only for their outstanding active links.
3. Track active link rows by key ID.
4. A prior key may be retired only when no unexpired/unrevoked links refer to it. Under the interim non-expiring policy, a key cannot be retired while any active link signed with it remains.
5. If product requires retirement without invalidating old printed QR, issue new links and reprint/re-share them before revoking old links. No transparent migration can preserve an old HMAC without retaining its key.

Emergency compromise:
1. Mark compromised key ID disabled for new signing and verification.
2. In one audited operation, append revocation events for all active links signed by that key ID.
3. Issue replacement links using a clean key ID for affected, non-revoked invoices.
4. Notify owners that previously printed/shared compromised-key QR links must be replaced.
5. Other key IDs and links remain valid; do not globally invalidate unrelated invoices.
6. Record incident, affected link count and completion evidence without recording raw tokens.

### 8.6 Token acceptance rules

- Valid MAC + active link + unexpired link + issued invoice + matching link row → continue to integrity check and allow-listed DTO.
- Valid MAC + revoked link → generic invalid/unavailable state; no invoice lines.
- Valid MAC + revoked invoice → cancelled state only; no invoice lines by interim rule.
- Expired link → generic expired/unavailable state; no invoice lines.
- Invalid MAC, unknown key ID, malformed claims, link/invoice mismatch → generic invalid-reference response.
- Stored invoice digest mismatch → integrity-failure state; no “verified” label and no bill lines.
- Server unavailable → unavailable/retry state, never verified from cached content.

## 9. Public bill privacy, tenant isolation, cache and abuse controls

### 9.1 Validation and query order

1. Parse and strictly validate path syntax.
2. Resolve key ID from server key registry; unknown key ID fails without DB access.
3. Recompute HMAC and compare constant-time; invalid MAC fails without DB access.
4. Fetch exactly one link row by `link_id = claim.linkId AND invoice_id = claim.invoiceId AND key_id = claim.keyId`.
5. Check link not revoked and not expired; compare persisted expiry with signed expiry exactly.
6. Fetch invoice by `id = claim.invoiceId`; require invoice shop association and issued lifecycle; check not revoked.
7. Fetch only ordered invoice lines for that invoice.
8. Recompute immutable digest and compare.
9. Map to the explicit DTO; never serialize raw database rows.

No query accepts arbitrary shop ID, customer ID, memo ID, or user-supplied select/expand parameters. No direct anon SELECT on invoice/link/line/event tables.

### 9.2 Public DTO v1

Only the following fields may be returned for a verified issued bill:

```ts
type PublicBillV1 = {
  version: 1;
  verification: "verified";
  shop: {
    name: string;
    address: string;
    mobile: string;
    googleMapsUrl: string | null; // HTTPS Google Maps URL after allow-list validation
  };
  bill: {
    displayNumber: string; // presentation only; server-assigned source
    issuedAt: string;        // ISO-8601 UTC; local display timezone awaits PO
    currency: "BDT";
    lines: Array<{
      itemName: string;
      quantity: string;      // canonical decimal
      unit: string | null;   // null until PO unit policy is established
      unitPrice: string;     // internal DTO value; public display semantics gated
      lineTotal: string;     // internal DTO value; public display semantics gated
    }>;
    total: string;
  };
};
```

The route may include an invoice UUID in the URL because it is a signed claim; the JSON response must not echo invoice UUID, link UUID, owner ID, auth metadata or database identifiers.

Explicitly excluded: customer name/mobile, customer_id, due/paid/payment status, discount/tax, ledger, inventory, stock, purchase price, audit payload, owner email/user ID, internal request ID, signing key ID/secret, MAC, raw link record and other invoices.

For a revoked bill, return a separate minimal state DTO with `verification: "revoked"` and a generic cancellation message only; no shop/item/amount details until PO approves. For invalid/expired/malformed links, use a generic response that does not distinguish whether an invoice UUID exists.

### 9.3 Maps URL and text safety

- Accept only HTTPS URLs whose hostname is on an explicit Google Maps allow-list (e.g. `maps.google.com`, `www.google.com/maps`, `maps.app.goo.gl`); validate redirects only if server-side resolution is separately approved. Reject javascript:, data:, file:, arbitrary hosts and malformed URLs.
- If invalid or absent, render the stored location as non-clickable text or omit the link; do not invent a map location.
- Shop/item/address values are text, never trusted HTML. Escape by normal React text rendering; no dangerouslySetInnerHTML.
- Link targets use safe rel attributes and do not pass user-provided arbitrary schemes.

### 9.4 HTTP, cache and browser controls

Every public bill response, including invalid/revoked/error responses:
- `Cache-Control: private, no-store, max-age=0`
- `CDN-Cache-Control: no-store`
- `Surrogate-Control: no-store`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or equivalent CSP `frame-ancestors 'none'`
- `X-Robots-Tag: noindex, nofollow, noarchive`
- Content Security Policy allowing only self-hosted scripts/styles/fonts/images plus QR data URI if needed; no third-party analytics, pixels, tag managers, remote fonts or embeds.

Next.js route must be explicitly dynamic/no-store (no static generation, ISR, route cache or fetch cache). CDN/reverse proxy must bypass cache for `/bill/*`. No ETag/304 behavior for bill state. A revocation must be reflected on the very next origin request.

### 9.5 Logging and abuse protection

- Redact the full public bill path (invoice ID, link ID, key ID, expiry and MAC) at application, reverse proxy, hosting access log, error telemetry and analytics layers. Prefer log route template and request correlation ID only.
- Never log QR image payload, full URL, MAC, signing key or canonical token message.
- Do not load third-party resources on the bill page; no analytics/cookie SDK.
- Apply distributed rate limits at edge/hosting/API gateway across all instances; in-memory per-process limits are insufficient. Use conservative IP/network and endpoint buckets, with generic 429 behavior. Avoid logging raw capability URLs as rate-limit keys.
- Limit request body/query sizes; reject extra query parameters where not expected.
- Monitor abnormal invalid-MAC rates without retaining tokens. Alert on key-ID misuse and unusual request volume.
- Generic invalid response must not reveal whether the invoice UUID, link UUID or shop exists.

## 10. Online/offline issuance and verification boundary

**Interim web MVP behavior: ONLINE-ONLY issuance and ONLINE-ONLY public verification.** This is the safe technical boundary consistent with the current source evidence and CH-2 UX condition. It is not a PO-confirmed business decision; PO-UX-02 must approve or replace it before release.

- No offline bill number allocation, no locally “issued” invoice and no offline verified QR.
- If connectivity is absent before issue submission, block issue and show an offline banner; do not show a final bill number or “বিল তৈরি হয়েছে”.
- A local draft is only safely retained if a future implementation explicitly persists it and displays “খসড়া সংরক্ষিত”; otherwise warn that it is not saved. No offline draft durability is claimed by this design.
- Before sending an issue request, persist request ID and canonical payload to IndexedDB. This supports retry/recovery for a request that may have reached the server; it does not authorize offline issue.
- If connection is lost after submission, mark result unknown, preserve request ID/payload, and on reconnect query/replay the same request. Do not create a new bill or request ID automatically.
- Customer QR page requires a live server verification. Offline shows “ইন্টারনেট সংযোগ নেই। বিল যাচাই করতে সংযোগ চালু করুন।” and no bill data as verified.
- A server-side committed bill may be recovered after a client timeout; the client must resolve it with the same idempotency key.

If PO requires offline issuance, stop and produce a separate offline architecture decision covering device-bound provisional numbering, durable local transaction log, signed provisional reference, conflict/reconciliation, device loss, multi-device collisions, customer verification-pending UX and recovery. It is not an extension of the current IndexedDB request outbox.

## 11. Bengali document, PDF and print architecture

### 11.1 Font selection and provenance

Selected font family: **Noto Sans Bengali**, variable TTF, release **v3.011**, upstream source repository `https://github.com/notofonts/bengali`, upstream source commit `85d80394cbbbb798ca0a41c983902e6cf77be3a3`, Google Fonts metadata identifies the family as OFL and references the v3.011 release archive. The Noto Bengali font project publishes under SIL Open Font License 1.1. Sources: Google Fonts metadata `https://github.com/google/fonts/blob/main/ofl/notosansbengali/METADATA.pb`; upstream license `https://github.com/google/fonts/blob/main/ofl/notosansbengali/OFL.txt`; source repository `https://github.com/notofonts/bengali`.

Font artifact path in implementation proposal: `public/fonts/NotoSansBengali-v3.011.ttf`; license copied to `public/fonts/OFL-NotoSansBengali-1.1.txt`. Use the upstream variable TTF file `NotoSansBengali[wdth,wght].ttf` from the pinned source commit. Do not fetch fonts from a CDN at runtime.

**Binary integrity gate:** the exact TTF binary SHA-256 is not asserted in this design because no font binary was added or processed in this documentation-only task. The implementation PR must vendor the exact file from the pinned source commit, compute and record its SHA-256 in a font manifest, include OFL text, and verify the artifact hash in CI. Until that exact binary hash and asset are in the repository, the font asset is a release blocker. The upstream version/source commit/license are pinned here; binary hash is an explicit remaining artifact gate, not a fabricated value.

### 11.2 Rendering pipeline

Use one semantic React/HTML `InvoiceDocument` component for screen preview and PDF rendering. Do not use jsPDF default fonts for Bangla output.

**Deterministic PDF target:** server-side Chromium/Playwright PDF generation in a controlled rendering service/container with:
- pinned Chromium build/container image digest;
- vendored Noto Sans Bengali v3.011 TTF and recorded SHA-256;
- local font registration and font readiness check;
- fixed locale, timezone parameter and print CSS;
- no external network resources;
- PDF generation from the persisted invoice snapshot only;
- output inspected for embedded/subset font, selectable text and expected page count.

Browser-native Print / Save as PDF remains an owner fallback, not the authoritative reproducible artifact, because browser/OS/printer font substitution and print behavior vary. The same HTML document and CSS are used by Chromium PDF and browser print.

No dependency or runtime selection is authorized by this design. The actual Chromium version/container digest must be pinned in the implementation design/CI manifest before a reproducible PDF claim.

### 11.3 Print layout contract

- Paper size is PO-pending; do not hardcode A5 as approved. Renderer accepts a named page profile selected only after PO-UX-01. A5/A4/80 mm thermal are separate profiles with independent acceptance evidence.
- Standard invoice should fit one page at the PO-selected paper size only after PO defines the normal bill/line count and minimum readable type size.
- Long invoice behavior: paginate; never truncate, clip or shrink below approved readable size. Repeat shop identity, bill number/date context and item-table headings on continuation pages. Do not split one item row. Keep total block together; keep QR, caption and footer together where possible; if they cannot fit, move the complete block to the next page. Add page numbering only if PO accepts it.
- Preserve exact heading `খাবারের বিল` and footer `ধন্যবাদ, আবার আসবেন!`.
- QR must be vector or high-resolution output with sufficient quiet zone and contrast; test actual print-size scan.
- The item-table `মূল্য` field is not rendered until PO-UX-04 decides unit price versus extended line amount. Internally both values are stored.
- Date/time is stored as UTC `TIMESTAMPTZ`; display timezone/format is configurable and remains PO-UX-16 pending. Do not hardcode a business timezone in the persisted data.
- Shop Maps location is a validated HTTPS link; if invalid, display safe non-clickable text or omit link without inventing a location.

### 11.4 Required Bengali corpus and PDF evidence

Fixed rendering corpus must include:
- Bengali conjuncts and reph;
- কার/ফলা and dependent vowel signs before/after consonant clusters;
- nukta and punctuation;
- Bangla and Latin numerals, BDT symbol ৳;
- maximum-length item/shop/address strings;
- exact heading/footer strings.

Acceptance must inspect Chrome desktop and target Android Chrome/WebView/print path selected by PO. PDF inspection must confirm text remains selectable, the selected font is embedded/subset or a documented equivalent is verified, no tofu/missing glyph/reordered marks/clipping occurs, page breaks are stable, and printed QR scans at selected physical size. No such rendering test has been run.

## 12. Food menu and PO-B01–PO-B07 authority gap

### 12.1 What is established

The pinned schema has `item_catalog` with shop scope, name, unit, purchase_price, sale_price, sort_order and is_active. The reliability migration removes the initial public-read policy; owner-scoped access remains the design baseline. The current UI mixes catalog and stock actions.

CH-2 UX PR #30 proposes a menu-only screen, active/inactive distinction, search, add/edit/deactivate/reactivate and no stock controls. This is a UX condition, not proof that PO-B01–PO-B07 are approved.

### 12.2 Technical boundary

- Menu screen must not read/display purchase price, supplier, stock balance or stock movements.
- Menu CRUD writes only `item_catalog`; it must not create/update `stock_items`, `stock_movements`, `memos`, `customers` or `baki_entries`.
- Invoice line stores immutable name/unit/price snapshots; historical invoice rendering never joins live catalog for display.
- Inactive menu items are not selectable for new bills under the CH-2 UX proposal; existing invoices remain readable. This rule is conditional on PO confirming the active/inactive lifecycle.
- No one-off/custom line is included in the first UX baseline until PO-UX-10 is decided.
- No unit default (including “পিস”), unit list, name-length limit, price precision policy, duplicate normalization, punctuation/case folding, repeated-item merge rule or permanent delete behavior is inferred.
- Do not invent Unicode duplicate rules. Canonical NFC for request idempotency does not establish menu-name equivalence.
- No schema uniqueness/normalization constraint is specified until PO-B01–B07 are recovered/pinned.

### 12.3 Required PO-B01–B07 closure record

Before menu implementation, PO must provide/pin the exact seven decisions and map each to:
- field visibility and requiredness;
- unit semantics and allowed values/default;
- name length/whitespace rules;
- duplicate behavior (case, whitespace, NFC/NFD, visually equivalent characters, punctuation);
- price precision/range/zero policy;
- active/inactive/delete behavior;
- repeated-item and custom-line behavior.

Until the canonical decision exists, the menu implementation gate is **BLOCKED**. The design preserves the CH-2 screen structure only.

## 13. WhatsApp and share behavior

- Share content is generated from the persisted invoice snapshot, never from unsaved composer values or current menu/profile.
- Suggested Bangla text from CH-2 is provisional, not PO-approved: shop name, bill number, date/time, total, bill URL and exact footer only if PO approves footer in message.
- Use WhatsApp share chooser without a customer phone or contact record. Do not silently send to a stored contact.
- If WhatsApp is absent, blocked or cancelled, preserve invoice and offer Copy bill link, Copy message, device-native Share (where supported) and Print/Save PDF.
- Share failure/cancellation never revokes or duplicates the invoice.
- URL/token must not be copied into application logs or analytics.

## 14. Traceability: PO → UX → technical design → acceptance

### 14.1 PO-confirmed invoice requirement matrix

| PO ID | PO-confirmed requirement | CH-2 UX mapping | Technical design mapping | Acceptance |
|---|---|---|---|---|
| PO-F01 | Shop name | PR #30 §4.1, §5.3 | Immutable `shop_name_snapshot`; public DTO `shop.name`; §4, §9 | AT-PO-01 |
| PO-F02 | Shop address | PR #30 §4.1, §5.3 | `shop_address_snapshot`; text-only safe rendering; §4, §9 | AT-PO-02 |
| PO-F03 | Mobile number | PR #30 §4.1, §5.3 | `shop_phone_snapshot`; allow-listed `shop.mobile`; §4, §9 | AT-PO-03 |
| PO-F04 | Google Maps shop location | PR #30 §4.1, §5.3 | `shop_map_url_snapshot`; HTTPS allow-list; invalid URL non-clickable; §9 | AT-PO-04 |
| PO-F05 | Exact heading `খাবারের বিল` | PR #30 §5.2, UX-20 | Shared `InvoiceDocument`; §11 | AT-PO-05 |
| PO-F06 | Bill number | PR #30 §5.3 | Server counter; immutable bill number; display formatting pending PO; §5 | AT-PO-06 |
| PO-F07 | Date | PR #30 §5.3 | UTC `issued_at`; display format/timezone pending PO; §11 | AT-PO-07 |
| PO-F08 | Time | PR #30 §5.3 | Same authoritative timestamp; display format/timezone pending PO; §11 | AT-PO-08 |
| PO-F09 | Food/item name | PR #30 §5.3 | `item_name_snapshot`; NFC canonical storage; §4, §6 | AT-PO-09 |
| PO-F10 | Quantity | PR #30 §5.3 | Exact NUMERIC quantity; semantics/precision PO-gated; §7 | AT-PO-10 |
| PO-F11 | Price | PR #30 §5.3; unit-vs-line ambiguity noted | Store unit price and line total; do not choose printed `মূল্য` semantics until PO-UX-04; §7, §11 | AT-PO-11 |
| PO-F12 | Total bill amount | PR #30 §5.3 | Persisted sum of rounded line amounts; BDT; §7 | AT-PO-12 |
| PO-F13 | Individual bill verification/details QR | PR #30 §7.3 | Versioned HMAC URL bound to invoice+link; not shop QR; §8 | AT-PO-13 |
| PO-F14 | Exact footer `ধন্যবাদ, আবার আসবেন!` | PR #30 §5.2, UX-20 | Shared `InvoiceDocument`; §11 | AT-PO-14 |
| PO-F15 | Shop QR is not bill QR | PR #30 §7.3, UX-23/30 | Separate route/capability per invoice link; §3, §8 | AT-PO-15 |

### 14.2 CH-2 UX condition matrix

| UX condition | CH-2 source | v0.2 technical response | Acceptance |
|---|---|---|---|
| P1-01 Online/offline issuance unresolved | PR #30 §11.1 P1; PO-UX-02 | Online-only interim; block offline issue/verification; IndexedDB only unknown-outcome recovery; §10 | AT-OFF-01..04 |
| P1-02 PO-B01–B07 not established | PR #30 §11.1 P1; §12 | Menu screen structural only; all field/validation/duplicate/unit rules blocked; §12 | AT-MENU-01..06 |
| P1-03 Paper size and long-bill behavior | PR #30 §11.1 P1; PO-UX-01 | Page profile configurable; no A5 assumption; paginate losslessly; §11 | AT-PDF-01..08 |
| P1-04 `মূল্য` unit-vs-line meaning | PR #30 §11.1 P1; PO-UX-04 | Store both unit price and line amount; printed/public column blocked pending PO; §7, §11 | AT-PRICE-01..03 |
| P1-05 Customer revoked/invalid wording and details | PR #30 §11.1 P1; PO-UX-13 | Valid/invalid/revoked/integrity/offline states; revoked details hidden interim; §8, §9 | AT-TOK-09..12 |
| P1-06 WhatsApp exact wording and cancel fallback | PR #30 §11.1 P1; PO-UX-15 | Persisted snapshot share; copy/native/print fallback; message wording provisional; §13 | AT-SHARE-01..04 |
| P2-01 Owner navigation and mobile states | PR #30 §11.1 P2; §§3–4, 8.3 | Routes and owner flow defined; network states and 320px/44px accessibility retained from UX; §3, §10 | AT-UX-01..06 |
| P2-02 One-off/custom line | PR #30 §11.1 P2; PO-UX-10 | Excluded from first baseline until PO decision; no null catalog item accepted by default; §12 | AT-MENU-07 |
| P2-03 Post-issue history, retry and duplicate taps | PR #30 §11.1 P2; §§4.4–4.5, 9.2 | Immutable history; same request identity; canonical replay; §5–6 | AT-IDEM-01..08 |
| P2-04 Public page loading/unavailable/accessibility | PR #30 §11.1 P2; §§7.2, 8 | Verification-first UI, no-store, distinct unavailable/offline state, text not color only; §3, §9–10 | AT-TOK-01..14, AT-UX-07 |
| P2-05 Bangla print proof and overflow | PR #30 §11.1 P2; §7.1 | Pinned Noto source/version/license, binary hash gate, deterministic Chromium, pagination corpus; §11 | AT-PDF-01..08 |

P3 observations are retained: legacy memo/stock navigation hide/de-emphasize decision remains CH-1/PO-owned; device-native share variations are covered by fallback tests after QA authorization.

## 15. Acceptance scenario catalogue (proposed; NOT EXECUTED)

All tests below are future acceptance specifications. They must be executed only after explicit QA authorization and implementation. Positive and negative tests are both required. “Pass” requires exact expected state/data side effects, not merely a successful HTTP response.

### 15.1 Token, revocation and key lifecycle

| Test ID | Positive/negative scenario | Setup/action | Expected result / evidence |
|---|---|---|---|
| AT-TOK-01 | Positive valid token | Issued invoice, active link, known key, exp=0; GET exact URL | DTO v1 only; verified label; query trace follows MAC validation |
| AT-TOK-02 | Negative one-bit MAC change | Change one MAC bit | Generic invalid; zero invoice/link DB lookups |
| AT-TOK-03 | Negative wrong invoice ID | Reuse MAC with different invoice UUID | Generic invalid; zero invoice lookup |
| AT-TOK-04 | Negative malformed/oversized claims | Bad UUID, unknown kid, bad expiry, padded/non-base64url MAC, oversized path | 400/404 generic response; no data lookup |
| AT-TOK-05 | Negative link/invoice mismatch | Validly signed claims but persisted link belongs to another invoice | Denied; no DTO |
| AT-TOK-06 | Negative expired link | Valid MAC with expiry at or before server time | Expired/unavailable state; no bill details |
| AT-TOK-07 | Positive routine key overlap | Old-key link active; new key active for new links | Both verify while old link remains active and old key is verify-only |
| AT-TOK-08 | Negative retired/compromised key | Retire only after no active links, or emergency revoke compromised kid | Retired key fails; compromised-kid links denied; other key IDs unaffected |
| AT-TOK-09 | Positive per-link revoke | Revoke one of two links for an invoice | Revoked link denied; other active link remains valid |
| AT-TOK-10 | Positive invoice revoke | Revoke invoice with multiple links | All links show safe revoked state; no line/shop detail returned |
| AT-TOK-11 | Negative repeated/reverse revoke | Repeat revoke or attempt revoked→issued | Idempotent already-revoked result or stable conflict; no duplicate effective event; no reissue |
| AT-TOK-12 | Negative audit failure | Force audit insert failure during revoke | Entire transaction rolls back; invoice remains issued; no partial revoke event |
| AT-TOK-13 | Negative key compromise isolation | Compromise kid-A; revoke its active links | kid-B links still verify; all kid-A links fail |
| AT-TOK-14 | Negative log leakage | Exercise valid/invalid paths and inspect all configured logs/telemetry | No full URL, MAC, key or token in logs; route template/correlation ID only |

### 15.2 Immutability, tenant isolation and public privacy

| Test ID | Positive/negative scenario | Setup/action | Expected result / evidence |
|---|---|---|---|
| AT-DB-01 | Negative owner mutation | Attempt direct UPDATE/DELETE on invoice and lines | Permission/trigger denial |
| AT-DB-02 | Negative anonymous table access | Attempt anon SELECT/INSERT/UPDATE/DELETE | Denied |
| AT-DB-03 | Positive snapshot stability | Issue bill; change shop profile/menu name/unit/price/status | Historical invoice and public DTO remain byte-equivalent for immutable fields |
| AT-DB-04 | Positive atomic create audit | Create invoice | Invoice, lines, issued event, audit and completed idempotency record commit together |
| AT-DB-05 | Negative audit-write failure | Fail audit insert on creation | Whole transaction rolls back; no invoice/counter/request residue |
| AT-DB-06 | Negative cross-tenant owner access | Owner A requests Owner B invoice/link/revoke | Denied; no cross-tenant data |
| AT-PUB-01 | Positive exact DTO | Fetch valid public bill | Only DTO v1 allow-list; no internal UUID/owner/customer/ledger/stock/purchase/audit/request/token fields |
| AT-PUB-02 | Negative arbitrary query/over-fetch | Add select/expand/owner/shop/customer query parameters | Ignored or rejected; response unchanged and allow-listed |
| AT-PUB-03 | Negative XSS | Store script/HTML payload in shop/item/address text | Rendered as text; no script execution |
| AT-PUB-04 | Negative malicious Maps URL | javascript:, data:, arbitrary host, malformed redirect | Non-clickable/omitted; no navigation |
| AT-PUB-05 | Positive cache/revocation freshness | Fetch bill, revoke, fetch again via origin/CDN | Every response no-store; next request shows revoked; no stale cache |
| AT-PUB-06 | Negative ID enumeration | Random invoice/link UUID with invalid MAC | Generic response; no DB lookup; no existence oracle |
| AT-PUB-07 | Negative service-role boundary | Attempt client import/access or public direct DB query | Service key absent from bundle/network; anon table access denied |
| AT-PUB-08 | Positive headers/CSP | Inspect all public states | no-store, no-referrer, noindex, nosniff, frame denial, self-only CSP; no third-party requests |
| AT-PUB-09 | Positive distributed rate limit | Flood invalid and valid paths across multiple app instances | Shared rate limit enforced; generic 429; no raw token logged |

### 15.3 Numbering, idempotency and recovery

| Test ID | Positive/negative scenario | Setup/action | Expected result / evidence |
|---|---|---|---|
| AT-IDEM-01 | Positive concurrent first use | 50 concurrent requests for a shop with no counter row | One counter row; 50 unique numbers; 50 invoices |
| AT-IDEM-02 | Positive concurrent duplicate | Same request ID + canonical payload sent concurrently | Exactly one invoice/number; all callers receive same result |
| AT-IDEM-03 | Negative payload mismatch | Same request ID, changed line/quantity/price/shop/op | IDEMPOTENCY_CONFLICT; no second invoice/number |
| AT-IDEM-04 | Positive rollback at counter | Inject failure after counter lock/increment | No invoice/request residue; counter increment rolls back |
| AT-IDEM-05 | Positive rollback at lines/audit | Inject failure after invoice/line/audit stage | Entire transaction rolls back |
| AT-IDEM-06 | Positive lost response after commit | Commit then drop response; replay same key/payload | Original invoice/number returned; no duplicate |
| AT-IDEM-07 | Positive browser reload recovery | Reload with persisted IndexedDB request | Same request ID/payload checked/replayed; canonical bill recovered |
| AT-IDEM-08 | Negative local persistence failure | IndexedDB write fails before network request | No request sent; visible recoverable warning |
| AT-IDEM-09 | Positive canonical equivalence | JSON key order/insignificant whitespace differ; decimal lexical forms normalize | Same canonical hash where semantic fields identical |
| AT-IDEM-10 | Negative meaningful payload difference | Change ordered lines, item text, unit, quantity or price | Different hash; same-key replay rejected |
| AT-IDEM-11 | Unicode canonicalization | Submit Bengali NFC and NFD forms | NFC normalization contract yields same canonical text/hash; display snapshot stored NFC |
| AT-IDEM-12 | Number uniqueness under load | Concurrent distinct requests across one and multiple shops | Unique per shop; independent shop counters; no duplicate bill number |

### 15.4 Financial calculations and input boundaries

| Test ID | Scenario | Expected result |
|---|---|---|
| AT-FIN-01 | Run FV-01 through FV-08 golden vectors | Exact expected line and total values |
| AT-FIN-02 | Reject FV-09 through FV-18 invalid/zero/overflow vectors | Stable validation error; no writes or number allocation |
| AT-FIN-03 | Exact quantity/price storage maxima | Max accepted only if product/total also within NUMERIC bounds |
| AT-FIN-04 | One unit beyond each field/total bound | Rejected before persistence |
| AT-FIN-05 | UI preview versus server | Exact agreement to 0.01 BDT; mismatch blocks final confirmation |
| AT-FIN-06 | Per-line versus aggregate rounding | Two 0.005 products persist as 0.01 + 0.01 = 0.02 |
| AT-FIN-07 | Negative, exponent, comma, NaN, Infinity, whitespace | Rejected by client and RPC |
| AT-FIN-08 | Zero price/zero total | Rejected until explicit PO policy; no silent default |
| AT-FIN-09 | Output consistency | Persisted total equals owner detail, PDF, public DTO and WhatsApp amount |

### 15.5 Bengali font, PDF and print

| Test ID | Scenario | Expected result / evidence |
|---|---|---|
| AT-PDF-01 | Font artifact provenance | Exact v3.011 source commit, OFL file and binary SHA-256 match manifest |
| AT-PDF-02 | Bengali corpus rendering | No missing glyph, tofu, broken conjunct, reordered mark or clipping |
| AT-PDF-03 | Cold font cache / no network | Local font loads; render does not depend on CDN/network |
| AT-PDF-04 | Deterministic Chromium output | Pinned container/browser digest produces stable output from same invoice snapshot |
| AT-PDF-05 | PDF text/font inspection | Text selectable; expected Bengali font embedded/subset; metadata recorded |
| AT-PDF-06 | Normal and long bills | No truncated/missing/duplicated lines; repeated headers; rows not split |
| AT-PDF-07 | QR/total/footer block | QR scans at PO-approved physical size; QR/caption/footer not clipped or split |
| AT-PDF-08 | Target-device browser print | Chrome desktop and PO-selected Android browser path meet legibility/layout baseline |

### 15.6 Menu, UX and offline behavior

| Test ID | Scenario | Expected result |
|---|---|---|
| AT-MENU-01 | Menu create/edit/activate/deactivate after PO-B decisions | Only approved fields/rules appear; writes item_catalog only |
| AT-MENU-02 | Negative stock/ledger side effects | Zero writes to stock_items, stock_movements, memos, customers, baki_entries |
| AT-MENU-03 | Cross-shop menu access | Other shop reads/writes denied |
| AT-MENU-04 | Inactive item selection | Cannot add inactive item to new invoice if PO confirms lifecycle; history remains readable |
| AT-MENU-05 | Historical snapshot after menu edits | Old invoice unchanged |
| AT-MENU-06 | Duplicate normalization | Test case/whitespace/NFC/NFD/punctuation exactly per pinned PO-B01–B07; no inferred rule |
| AT-MENU-07 | One-off line | Not available until PO-UX-10 approved |
| AT-OFF-01 | Offline before issue | Issue blocked; no bill number, issued status or verified QR |
| AT-OFF-02 | Connection lost after submit | Unknown state; same request ID/payload retained and replayed after reconnect |
| AT-OFF-03 | Customer opens QR offline | Unavailable/no connection; never verified from stale local data |
| AT-OFF-04 | Product wording | No offline-sale claim; IndexedDB described only as request recovery |
| AT-UX-01 | 320 CSS px layout | No horizontal scrolling; primary action does not obscure last line |
| AT-UX-02 | Touch/accessibility | ~44×44 CSS px practical targets; labels, focus, text status not color-only |
| AT-UX-03 | Profile edit after issue | New profile affects future invoices only |
| AT-UX-04 | History reprint/share | Same invoice ID/number/snapshot; no new issuance |
| AT-UX-05 | WhatsApp cancel/failure | Bill unchanged; copy/native-share/print fallbacks remain available |
| AT-UX-06 | Unknown issue result | “বিল তৈরির অবস্থা যাচাই করা হচ্ছে”; no new request ID |
| AT-UX-07 | Customer verification-first | No bill details shown as verified before server response |
| AT-SHARE-01 | Bangla share message | Values taken from persisted snapshot and exact bill URL |
| AT-SHARE-02 | WhatsApp unavailable/cancelled | Copy link/message, native share and print fallbacks |
| AT-SHARE-03 | No customer contact | Issue/share succeeds without customer row/phone |
| AT-SHARE-04 | Share failure | Does not mutate/revoke/duplicate invoice |

### 15.7 Release no-go criteria

Do not recommend release if any of these occur:
- token verification can be bypassed, or invalid MAC triggers invoice lookup;
- invoice or line snapshots can be updated/deleted through ordinary application roles;
- revocation and audit can commit partially;
- concurrent creation can duplicate bill numbers or invoices;
- same-key changed-payload replay is accepted;
- a committed request cannot be recovered after lost response;
- UI/PDF/public/WhatsApp totals differ by 0.01 BDT or more;
- cross-tenant or public DTO leakage occurs;
- revoked data is served from cache;
- Bengali corpus, PDF font embedding or QR print tests fail;
- any PO-confirmed field or exact heading/footer is missing;
- unresolved PO blockers are implemented by assumption;
- offline issuance/verification is represented as supported without an approved separate design and evidence.

## 16. PO decision register and explicit remaining blockers

No row below is PO-approved by v0.2 unless it is one of PO-F01–F15 in §14.1. “Safe interim” is a technical fail-closed behavior, not a business decision.

| Decision ID | Owner | Unresolved decision | Safe interim / gate |
|---|---|---|---|
| PO-UX-01 / PO-I01 | PO | Paper size/profile: A5, A4, 80 mm thermal or multiple | No final print profile; page size must be selected before PDF release |
| PO-UX-02 / PO-I07 | PO | Offline issue requirement | Online-only interim; offline issue blocked; PO must approve online-only or commission separate offline design |
| PO-UX-03 / PO-I02 | PO | Bill number display format, prefix, sequence scope/reset | Server monotonic per-shop integer; no prefix/reset; visible format pending |
| PO-UX-04 | PO | Printed `মূল্য` means unit price or extended line amount | Store both; printed/public mapping blocked |
| PO-UX-05 | PO | Quantity semantics, precision, unit and repeated-item behavior | Technical vectors proposed; business precision/units/merge policy pending |
| PO-UX-06 / PO-B01–B07 | PO | Canonical menu policy record and seven decision contents | Menu implementation blocked; do not infer fields/validation/duplicate rules |
| PO-UX-07 | PO | Unit required/default and allowed values | No default “পিস”; unit nullable until policy set |
| PO-UX-08 | PO | Duplicate food-name normalization | No case-fold/whitespace/punctuation rule; no uniqueness migration until approved |
| PO-UX-09 | PO | Price precision, zero price, zero-total and maximum business amount | Safe interim rejects zero/negative/overflow; limits are technical envelope only |
| PO-UX-10 | PO | One-off/custom line without menu item | Excluded from MVP baseline |
| PO-UX-11 / PO-I03 | PO | Discount, tax, paid, due, payment method/change | Excluded; no fields/calculations |
| PO-UX-12 / PO-I04 | PO | Customer name/mobile | Not collected; no customer record needed |
| PO-UX-13 / PO-I05 | PO | Invoice cancellation/correction and revoked details | Immutable issued bill; revoke only; revoked page hides details; correction is new bill |
| PO-UX-14 / PO-I06 | PO | Link expiry/retention and public-link lifetime | Stable non-expiring link interim with bearer risk, per-link revoke; expiry remains PO decision |
| PO-I06A | PO + Security/CH-1 | Key-retention and compromise response acceptance | Old keys retained while active links exist; compromised-key links revoked/reissued |
| PO-UX-15 / PO-I message | PO | Exact WhatsApp message wording/footer | Suggested copy provisional; persisted data and fallback fixed |
| PO-UX-16 | PO | Date/time timezone and display format | Store UTC; display zone/format configurable, no hardcoded final format |
| PO-UX-17 | PO | Expected maximum bill lines and pagination/page numbering | Lossless pagination; 100-line technical ceiling provisional, not final capacity |
| PO-UX-18 | PO | Mobile validation and accepted Google Maps URL formats | Required fields retained; exact validation/allow-list to be approved |
| PO-I11 | PO | Customer verification wording | Narrow meaning in §3.2; final Bangla wording requires PO approval |
| PO-I08 | PO | Menu units/name/duplicate policy | Same gate as PO-B01–B07; no default assumed |
| PO-I09 | PO | Zero-value lines / zero-total invoice | Rejected until explicit approval |
| PO-I10 | PO | Long invoice line maximum/pagination | Pagination defined; business maximum remains pending |

### 16.1 Remaining blockers classification

**PO/business blockers before implementation of affected features**
1. PO-UX-01 paper size and minimum readable type size.
2. PO-UX-04 printed price-column semantics.
3. PO-UX-05 quantity/unit/repeated-item policy.
4. PO-UX-06 canonical PO-B01–B07 menu record.
5. PO-UX-07/08 menu unit and duplicate policy.
6. PO-UX-09 zero/maximum financial policy.
7. PO-UX-10 one-off line inclusion/exclusion confirmation.
8. PO-UX-13 revocation wording/reason and customer-visible revoked details.
9. PO-UX-14 link expiry/retention acceptance.
10. PO-UX-15 final WhatsApp wording.
11. PO-UX-16 date/time timezone and display format.
12. PO-UX-17 normal bill size/maximum lines/page numbering.
13. PO-UX-18 mobile and Maps URL validation.
14. PO-I11 final verification wording.
15. PO-UX-02 online-only release approval or separate offline design.

**Engineering/security artifact blockers before release**
1. Actual font binary vendored; SHA-256 recorded; OFL included.
2. Chromium/container version and image digest pinned.
3. Secret manager/KMS configured for active and verify-only HMAC keys.
4. Distributed rate limiting, path redaction and CDN cache bypass configured and verified.
5. Typed DTO, server-only data access and DB grant/RLS/RPC contract implemented and independently reviewed.
6. Authorized staging migration/schema state inspection and DB security review.
7. Positive/negative acceptance suite executed under separate QA authorization.
8. Target browser/PDF/print/QR evidence captured.

These blockers are not concealed by the completion of this design document. No PO decision is fabricated.

## 17. Dependency and implementation sequence (planning only)

1. CH-1/PO disposition of v0.2; resolve PO blockers that affect scope.
2. Separate physical schema/RPC migration design and DB security review; inspect actual staging migration state only under authorization.
3. Implement invoice persistence, append-only events, numbering, idempotency and audit.
4. Implement menu-only UI only after PO-B01–B07 is pinned.
5. Implement invoice composer/history and persisted snapshot flow.
6. Vendor font artifact and license; pin binary hash and Chromium image; implement deterministic document renderer after paper/price/date decisions.
7. Implement HMAC link creation, public verification DTO, revocation, key rotation, headers, logging and distributed rate limits.
8. Implement WhatsApp and fallback actions after copy approval.
9. Execute the acceptance matrix under explicit QA authorization.
10. Separate CH-1/PM release, merge, deployment and pilot gates.

No estimate is treated as a commitment; no work package is authorized by this sequence.

## 18. Finding-to-correction matrix — CH-4 CH4-01 through CH4-11

| CH-4 finding | Severity in CH-4 report | v0.2 correction | Evidence section | Acceptance mapping | Residual |
|---|---|---|---|---|---|
| CH4-01 bearer URL/HMAC lifecycle incomplete | BLOCKER | Exact path/claims/canonical bytes/HMAC-SHA256/kid/256-bit keys/strict parse/constant-time check; expiry=0 interim; per-link and invoice revoke; routine/emergency rotation; no token logs/referrers/cache | §§8–9 | AT-TOK-01..14, AT-PUB-05/08/09 | PO expiry/retention decision; actual secret/KMS/rate-limit implementation |
| CH4-02 immutability and atomic revoke/audit | MAJOR | Append-only invoice/line facts; direct DML denied; append-only status/link events; atomic revoke+audit; digest contract; no reverse transition | §4 | AT-DB-01..05, AT-TOK-10..12 | Physical trigger/grant/RPC design and DB runtime proof |
| CH4-03 numbering/concurrency/atomicity | MAJOR | Insert-on-conflict counter initialization; row lock; unique constraint; canonical lock order; all writes one transaction; rollback/no-gap semantics | §5 | AT-IDEM-01,02,04,05,12 | Runtime concurrency and deadlock evidence |
| CH4-04 canonical idempotency/recovery | MAJOR | Versioned schema; NFC; fixed JSON; decimal normalization; ordered lines; same-key replay; mismatch conflict; IndexedDB state machine; unknown retry same key | §6 | AT-IDEM-02..11, AT-UX-06 | Runtime multi-tab/network-loss proof |
| CH4-05 precision/bounds/rounding/zero | MAJOR | BDT; NUMERIC bounds; lexical grammar; half-away rounding; per-line round then sum; golden vectors; reject overflow/zero pending PO | §7 | AT-FIN-01..09 | PO business maximum and zero-value decision |
| CH4-06 Bengali font/PDF reproducibility | MAJOR | Noto Sans Bengali v3.011, upstream commit and OFL; binary hash gate; deterministic Chromium; fixed corpus; pagination/QR rules | §11 | AT-PDF-01..08 | Actual binary SHA, renderer image digest and runtime rendering proof |
| CH4-07 menu policy/PO-B gap | MAJOR | Menu-only scope; no stock/ledger writes; no inferred unit/duplicate/default/one-off rules; implementation blocked until PO-B01–07 pinned | §12, §16 | AT-MENU-01..07 | Canonical PO-B01–07 decision record |
| CH4-08 offline outbox misinterpretation | MAJOR | Online-only issue and verification interim; IndexedDB only recovery; offline blocks issuance and verification; separate architecture if PO needs offline | §10 | AT-OFF-01..04 | PO approval of online-only scope |
| CH4-09 public privacy/tenant/cache/abuse | MAJOR | Exact DTO; validate MAC before DB; scoped query; service-role boundary; no-store/CDN bypass/no-referrer/CSP; map allow-list; XSS safety; distributed rate limit | §9 | AT-PUB-01..09, AT-DB-06 | Hosting/CDN/KMS config and independent security runtime proof |
| CH4-10 PO→design→test traceability | MAJOR | PO-F01..F15 to CH2 UX, technical fields/routes and acceptance IDs; separate UX P1/P2 and PO decision register | §§14,16 | AT-PO-01..15 plus linked suites | PO pending decisions remain blockers, not falsely closed |
| CH4-11 complete positive/negative acceptance | MAJOR | Versioned scenario catalogue with preconditions/action/expected state; no-go criteria and evidence separation | §15 | AT-TOK, DB, PUB, IDEM, FIN, PDF, MENU, OFF, UX, SHARE | Tests are specified only; no QA authorization/execution |

**CH4-01 is design-resolved only conditionally:** non-expiring links are an interim technical proposal to preserve printed QR stability. The bearer risk is explicitly accepted as a design risk pending PO expiry decision; per-link/invoice revocation and release security controls are mandatory. If CH-1/PO does not accept this risk, finite expiry or an alternate customer verification model must be decided before implementation.

## 19. Verification boundary and non-claims

**Performed for v0.2 design preparation:**
- Read the complete CH-4 finding report at PR #28 comment `6763798273`.
- Read CH-4 Issue #29 disposition and findings summary.
- Read CH-2 UX PR #30 at exact HEAD `ca8324005048148b8d82c5151528ea41a2aa8a5a`, including the owner/customer journey, PO field mapping, P1/P2 review conditions, acceptance criteria and unresolved decision register.
- Re-read the pinned PO mockup at exact baseline; blob `efe0d261c50a4cfc706e82c832a6f052c676127c`.
- Prepared design contracts and acceptance specifications only.

**Not performed:**
- No application source or configuration changes.
- No SQL, schema, migration, database access or database mutation.
- No dependency installation, build, lint, automated test or browser runtime.
- No font binary was added or hashed; no PDF generation/font shaping/QR print test.
- No live secret manager/KMS/CDN/rate-limit configuration was inspected.
- No deployment, merge, release or pilot.
- No acceptance scenario in §15 has been executed; all are PROPOSED / NOT EXECUTED.

## 20. CH-3 conclusion and authorization boundary

The v0.2 technical design now specifies the missing controls and maps every CH-4 finding and CH-2 P1/P2 condition to design sections and test scenarios. It preserves all unresolved PO choices as explicit gates. The safe interim is online-only invoice issue/verification, no one-off line, no unapproved menu rules, no unapproved optional financial/customer fields, no final printed price-column semantics until PO decision, and no final paper/time format until PO decision.

**This document is a design deliverable, not implementation approval.** No worker may modify application code, schema, SQL, migrations, database, dependencies, build/test/QA, deployment, merge or pilot on the strength of v0.2 alone.

**Implementation authorization: NOT GRANTED.**  
**QA execution authorization: NOT GRANTED.**  
**Merge authorization: NOT GRANTED.**  
**Deployment / pilot: NOT AUTHORIZED.**
