# DokanTools — Invoice-First Web MVP Technical Design v0.2

**Task:** DT-CH3-INVOICE-FIRST-WEB-MVP-TECH-DESIGN-001  
**Role:** CH-3 — Technical Design  
**Repository:** Hasnat26/DokanTools  
**Source baseline:** `main` at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Technical PR:** #28  
**Prior design:** v0.1 at `ec67f403a625acea195c7913d23e7a69254c5ecc` (preserved unchanged)  
**UX input:** PR #30 revision 0.2, HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`  
**Independent assurance input:** CH-4 Issue #29; PR #28 comment `6763798273`; reviewed v0.1 HEAD above  
**Version:** 0.2 + controlled technical addenda v0.3 / v0.3.1  
**Current cross-document UX:** PR #30 revision 0.2, HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`  
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
- `request_id` UUID NOT NULL; globally unique across all invoice-creation request IDs and operation types, enforced by the shared idempotency registry.
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
1. Global idempotency registry claim keyed by `request_id` alone; the record stores immutable `owner_user_id`, `shop_id`, `operation_type`, `canonicalization_version`, `payload_hash` and result reference. The globally unique request ID is acquired before shop/counter locks.
2. Shop ownership row (read/lock as required to prevent ownership race).
3. Invoice counter row.
4. New invoice and line rows.
5. Audit/lifecycle rows.
6. Idempotency completion row.

No path may acquire these in reverse order. Revocation uses invoice lifecycle lock → invoice/link event insert → audit insert. It must not acquire the counter or idempotency locks.

### 5.3 Atomicity and number-gap policy

The idempotency UUID claim is global, while authorization and invoice data remain tenant-scoped. Duplicate UUID lookup may compare only minimal registry metadata needed to determine whether the caller's authenticated owner, shop, operation and payload match. It must not reveal the original invoice ID, bill number, shop identity, canonical payload or stored response on mismatch. Cross-tenant requests receive a generic conflict response. Never perform an unrestricted invoice lookup using a caller-supplied request UUID.

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

### 6.3 Server idempotency contract — namespaced globally unique request UUID

The prior shop-scoped uniqueness proposal is superseded because it cannot detect reuse of the same UUID for another shop or operation. CH-1 review comment 6766053949 requires an explicit namespace. The UUID is globally unique within namespace `invoice-create/v1`; shop and operation are immutable comparison attributes, not uniqueness-key components.

**Proposed logical model (design only):** use a dedicated `invoice_idempotency_requests` registry, or redesign `transaction_requests` to provide the same global namespace:

For this API, persist `idempotency_namespace = invoice-create/v1`. Enforce database uniqueness on `(idempotency_namespace, request_id)` alone; do not include `shop_id` or `operation_type` in that unique key.
- `request_id UUID PRIMARY KEY` — globally unique across shops and operation types.
- `owner_user_id UUID NOT NULL` — authenticated actor who first claimed the UUID.
- `shop_id UUID NOT NULL` and `operation_type TEXT NOT NULL` — original immutable scope.
- `canonicalization_version INTEGER NOT NULL` and `payload_hash BYTEA NOT NULL` — canonical operation identity; payload hash includes target shop and operation.
- `result_invoice_id UUID NULL`, completion state and timestamps; an incomplete committed row is an error, not permission to retry as a new request.
- No bearer tokens, secrets or full client headers are stored in this registry.

Do not rely solely on composite uniqueness `(shop_id, operation_type, request_id)`: it is the P2 defect.

**Request handling and lookup order:**
1. Authenticate first; derive owner ID from the verified session, never the request body.
2. Validate request UUID syntax and canonicalize the requested payload.
3. Insert/locate a global claim keyed by request_id alone, storing owner, shop, operation, canonicalization version and payload hash. This is within the same transaction as invoice creation.
4. If newly claimed, authorize the owner for the requested shop. On denial, roll back the claim and all work; allocate no number.
5. If the UUID already exists, lock/read only the global registry row and compare owner, shop, operation, canonicalization version and hash.
6. If every field matches and the record is complete, verify the referenced invoice belongs to the same authenticated owner/shop; return the same invoice ID, number and canonical response with `replayed=true`.
7. If owner, shop, operation, canonicalization version or payload differs, return generic `IDEMPOTENCY_CONFLICT`. Do not reveal invoice ID, bill number, shop identity, payload or which field differed. Do not query another tenant's invoice. Allocate no number and create no invoice.
8. If the registry row is incomplete or inconsistent, return `REQUEST_STATE_REQUIRES_RECONCILIATION`; fail closed and never create a replacement invoice.
9. Concurrent duplicate inserts serialize on the namespace+UUID unique constraint. If the first commits, identical contenders replay the result and mismatched contenders conflict. If the first rolls back, a waiting request may acquire the UUID and become the sole creator.
10. Registry claim, invoice, lines, counter, audit and registry completion commit atomically. A rollback removes all claim/invoice effects.

**Response matrix:**

| Scenario | Response | Disclosure | New invoice / number |
|---|---|---|---|
| Same owner + shop + operation + version/hash; complete | Original response, `replayed=true` | Only after owner/shop check | No |
| Same UUID + changed payload | `IDEMPOTENCY_CONFLICT` | Generic only | No |
| Same UUID + different shop, same owner | `IDEMPOTENCY_CONFLICT` | No original shop/invoice metadata | No |
| Same UUID + different operation | `IDEMPOTENCY_CONFLICT` | Generic only | No |
| Same UUID + different authenticated owner | `IDEMPOTENCY_CONFLICT` | No ownership oracle or invoice detail | No |
| Concurrent identical UUID/scope/payload | One creator; others replay | Authorized result only | Exactly one |
| Concurrent conflicting UUID/scope/payload | One claim wins; all mismatches conflict | No winner details disclosed | At most one |
| Incomplete/inconsistent registry row | `REQUEST_STATE_REQUIRES_RECONCILIATION` | Generic controlled failure | No |

A rejected shop-ownership attempt rolls back the initial claim. Once a valid request commits, the UUID is never recycled, including after invoice revocation or result-retention cleanup; retain a minimal tombstone if response details are purged.

**Existing table compatibility:** the current `transaction_requests` pattern is shop-scoped and has operation constraints. It cannot detect cross-shop/cross-operation reuse while the composite key remains authoritative. A future authorized schema design must either add a dedicated global registry atomically linked to invoice creation, or redesign the existing request table with globally unique request_id and owner/shop/operation/hash fields. Perform duplicate-UUID preflight before adding a global constraint. This is design only; no SQL/migration was authored or executed.

**Tenant isolation:** global detection is not global data access. Only a narrow server/RPC boundary may access the registry; no broad client SELECT grants or public RLS policy. Return the invoice only after owner/shop equality is proven. CH-4 should assess existence/timing side channels.

- Client timeout/connection loss: retain the same request ID/payload; retry status/replay with the same identity. Never automatically mint a replacement ID.

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
| AT-IDEM-13 | Same UUID reused for different shop | Commit shop A then reuse UUID for shop B | Generic IDEMPOTENCY_CONFLICT; no original shop data; no new bill/number |
| AT-IDEM-14 | Same UUID reused for different operation | Commit invoice_create then reuse UUID for another operation | Generic IDEMPOTENCY_CONFLICT; no second operation |
| AT-IDEM-15 | Same UUID reused by another owner | Different authenticated user reuses committed UUID | Generic IDEMPOTENCY_CONFLICT; no original-owner data disclosed |
| AT-IDEM-16 | Concurrent identical global UUID requests | Multiple instances submit same owner/shop/operation/hash | One global claim and invoice; all valid retries replay |
| AT-IDEM-17 | Concurrent conflicting global UUID requests | Same UUID raced with changed shop/operation/payload | One claim wins; mismatches conflict; at most one invoice |
| AT-IDEM-18 | Incomplete registry row | Existing registry row has missing result/inconsistent state | REQUEST_STATE_REQUIRES_RECONCILIATION; no new invoice |

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
- Read CH-2 UX PR #30 revision 0.2 at exact HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`, including UX-01..UX-64, logo/tagline behavior and PO-gated category decisions.
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


---

# Controlled Addendum v0.3 — Shop Logo, Tagline and Historical Header Integrity

**Task:** DT-CH3-INVOICE-FIRST-WEB-MVP-TECH-DESIGN-002  
**Role:** CH-3 — Backend & Security Engineering  
**Parent document:** v0.2, blob `348ec933a2798ba2c790707397d723e8377a8442`  
**Source baseline:** `main` at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Technical submission branch:** `docs/dt-invoice-first-mvp-tech-design-002`  
**Status:** PROPOSED — CH-1 integrated review and CH-2 UX alignment required  
**Scope:** Documentation-only technical design  
**Implementation authorization:** NOT GRANTED  
**Database inspection / SQL / migration / build / QA:** NOT AUTHORIZED / NOT PERFORMED

## A. Authority and evidence delta

This addendum preserves v0.2 §§1–20 without rewriting their existing technical contracts. It adds the PM-requested optional shop logo and tagline assessment and clarifies how these values participate in immutable invoice rendering.

### A.1 Exact source evidence

Repository SQL snapshot `supabase/schema.sql` at `main`, blob `e859b6de9660533962eddb6f9f3d17ad8a4c1cca`, defines `public.shops` with:
- `shop_type TEXT NOT NULL DEFAULT 'grocery' CHECK (shop_type IN ('grocery','pharmacy','food','salon','general'))`;
- `logo_url TEXT`;
- current profile fields `shop_name`, `phone`, `address`, `map_link`.

The repository's current shop type is therefore a controlled, non-null enum-like text field in this checked-in schema snapshot. It is not free text and it is not absent. The application/profile UI and live deployed schema were not inspected for this assignment unless separately present in the exact pinned source; no claim is made about live Supabase state. The existing `logo_url` is a single URL-like nullable field and does not encode whether the owner deliberately selected blank, whether a generated logo is active, or which immutable asset revision belongs to a historical invoice.

**Important:** checked-in SQL/schema is source-level design evidence only. It is not evidence of the deployed Supabase schema, migration history, RLS, grants, Storage policies or object existence. No live database or storage service was accessed.

### A.2 Authority separation

- **PO-CONFIRMED:** existing Bangla invoice mockup fields and exact heading/footer; logo and tagline are not included in that pinned mockup.
- **PM REQUIREMENT — NEW:** upload takes priority; generated logo is fallback; owner can explicitly select blank; logo selection must render consistently on web invoice, PDF and print; optional owner-entered Bangla/English tagline, proposed max 80 characters, no automatic generation.
- **TECHNICAL DESIGN:** the state, storage, sanitization, snapshot and rendering contracts below are engineering proposals.
- **PENDING UX/PO/PM:** owner interaction details, shop-type taxonomy changes, tagline length and historical logo/tagline treatment must be reconciled by CH-2/CH-1/PO as applicable.
- **NOT VERIFIED:** no logo upload, rendering, font shaping, PDF, browser, storage, RLS or deployment test was executed.

## B. Shop logo state architecture

### B.1 Canonical state model

Use an explicit persisted `logo_mode` with exactly three values:

| State | Meaning | Active render source |
|---|---|---|
| `GENERATED` | Owner chooses the deterministic generated mark | Generated SVG/immutable generated artifact derived from the snapshotted generation inputs |
| `UPLOADED` | Owner chooses an uploaded, validated logo asset | Immutable raster asset version in private object storage |
| `BLANK` | Owner explicitly chooses no logo | No image and no logo placeholder |

Do not derive state from `logo_url IS NULL`. Null can mean legacy/unconfigured or no active asset reference; it cannot express explicit blank selection robustly.

**Default/precedence — aligned with CH-2 PR #30 revision 0.2:** a valid uploaded logo takes priority; otherwise GENERATED is the default unless the owner explicitly selected BLANK. Generated mode does not require separate opt-in. This follows UX-40/UX-42/UX-43 and supersedes the earlier v0.3 wording that made explicit generated selection a prerequisite.

For new shops, absent upload and absent explicit BLANK resolves to GENERATED. Preview is informational and is not a precondition to generated mode. Invoice issue must resolve and snapshot the generated asset/version; generation failure fails closed rather than silently behaving as BLANK.

For legacy shops, a non-null `logo_url` is not trusted solely because it exists. It must be classified as an owner-owned validated upload before UPLOADED precedence applies. Until then, do not fetch/render arbitrary remote URLs; resolve to GENERATED using an approved category or approved neutral fallback. Valid existing uploads remain UPLOADED after classification. Explicit BLANK persists and suppresses all logo output.

The steady-state modes remain `GENERATED | UPLOADED | BLANK`; any legacy unconfigured condition is transitional only and must not override the UX default.

### B.2 State transitions

| Current state | Owner action | New state | Required behavior |
|---|---|---|---|
| GENERATED default | Upload valid image and save | UPLOADED | Validate, decode/re-encode, store immutable asset version; switch pointer only after durable storage |
| UPLOADED | Replace upload | UPLOADED | Create immutable new object version; old bytes remain for issued invoices |
| UPLOADED | Remove upload without choosing BLANK | GENERATED | Resolve generated output from current name and approved category; never leave unconfigured/no-logo state |
| GENERATED / UPLOADED | Explicitly choose no logo | BLANK | Persist BLANK; no generated mark, icon or placeholder |
| BLANK | Clear BLANK / choose Generated | GENERATED | Generated default resumes immediately; preview is not a separate opt-in gate |
| GENERATED | Regenerate after name/category change or owner action | GENERATED | Same normalized inputs/template yield same digest; changed inputs create immutable new version for future invoices |
| GENERATED | Upload | UPLOADED | Upload takes priority after validation and atomic pointer update |
| GENERATED | Edit shop name/category | GENERATED | Refresh generated output for future invoices; issue snapshot stores resolved version |
| UPLOADED / BLANK | Edit shop name/category | State unchanged | Preserve uploaded asset or explicit blank semantics |
| Any state | Upload fails | Unchanged | Preserve current active logo and state; do not switch to blank or generated |
| Any state | Persist state update fails | Unchanged | Preserve last committed pointer/state; report retryable failure |

**Priority rule:** the stored explicit state is authoritative. UPLOADED is not automatically demoted because the image is temporarily unavailable; instead display a controlled unavailable/error state and block release rendering if the snapshot cannot be resolved. BLANK always renders blank. GENERATED never falls back to a generic remote/AI service.

### B.3 Data integrity invariants

1. `logo_mode = BLANK` implies active asset reference is null and all invoice renderers omit the logo entirely.
2. `logo_mode = UPLOADED` implies a verified immutable asset-version reference exists; otherwise save must fail.
3. `logo_mode = GENERATED` implies a generated artifact reference plus generator/template version and input digest exist, or that an exactly reproducible deterministic artifact can be materialized from snapshotted inputs.
4. A committed profile update may point to a new asset only after the object is fully uploaded, decoded, sanitized, and stored. Never expose a half-uploaded object.
5. Asset IDs are opaque random identifiers, not shop-name-derived paths.
6. Deleting/replacing a profile pointer must not delete an asset still referenced by an issued invoice snapshot.
7. Invoice renderers resolve only the immutable snapshot asset/version, never the current `shops.logo_url`.
8. If snapshot integrity fails, fail closed with an explicit document-generation error; never silently substitute a different logo.

## C. Deterministic generated logo

### C.1 Proposed generation strategy

Use a small, versioned local template renderer that emits canonical SVG from a bounded input model. It must have no external AI API, remote image fetch, paid service, analytics call or per-generation service cost.

Inputs:
- Unicode NFC-normalized `shop_name`;
- one approved controlled `shop_type` value;
- fixed `template_id` and `template_version`;
- fixed palette/geometry constants;
- optional deterministic initials rule.

Outputs:
- canonical SVG bytes with explicit viewBox and fixed dimensions;
- SHA-256 of canonical output;
- generator version and input digest;
- optionally a pre-rasterized PNG generated by the trusted server pipeline for PDF/print uniformity.

Determinism contract: identical normalized inputs and identical generator version yield identical canonical SVG bytes, digest and raster output under the pinned renderer. Do not embed current timestamps, random IDs, external URLs, CSS imports, network-loaded fonts or environment-dependent layout.

### C.2 Bengali and Unicode handling

- Preserve and store the owner-entered `shop_name` as NFC for canonical display snapshots, without case folding or destructive transliteration.
- Do not attempt to generate initials by taking arbitrary UTF-16 code units. Use a Unicode grapheme-cluster-aware implementation and a documented locale rule, which CH-4 must test against Bengali combining marks, conjuncts, Latin names, emoji and mixed scripts.
- Do not use generated text as a path, HTML fragment or CSS selector.
- The generated mark may use a simple geometric/shop-type motif plus a bounded textual treatment. If the generator cannot safely fit the text, render a stable icon-only mark rather than clipping or corrupting glyphs.
- The SVG should reference no remote font. Text must be rendered with the same pinned local font strategy as the invoice, or converted to paths only by a deterministic pinned renderer if text extraction/accessibility trade-offs are accepted. The preferred output keeps the shop name as accessible text in the invoice header independent from the logo artwork.

### C.3 Shop-type source and governance

The checked-in schema currently provides `shops.shop_type` as a controlled set: `grocery`, `pharmacy`, `food`, `salon`, `general`. It is neither missing nor free-form in that source snapshot.

However:
- The PO-confirmed Invoice-First mockup does not define a shop-type field or taxonomy.
- The UI may not currently require or expose a shop-type selection; this must be verified by CH-2 against its current UX branch.
- For food-shop Invoice-First workflow, the current `food` category is a plausible existing value, but auto-changing all shops to `food` based on invoice usage is not approved.
- Do not infer shop type from shop name or business description.
- Do not expand the enum or add new category values without explicit PM/PO approval and schema design review.

**Safe category dependency (aligned with UX-49/UX-50):** generated output may use only a category explicitly stored/selected under the eventually approved taxonomy. Never infer category from shop name, tagline, address or invoice activity.

If category is missing, legacy-only or unsupported: do not coerce it to `food` or another category; do not fabricate a category-specific icon; use a deterministic category-neutral generic template only if CH-1/CH-2 approve that fallback, otherwise block logo-dependent rendering with an actionable category-selection error; prompt the owner to choose from final approved choices, not unapproved legacy values; and record category provenance/template version in the asset manifest.

The checked-in schema's legacy values (`grocery/pharmacy/food/salon/general`) are source evidence only, not an approved final taxonomy. No new category field is proposed. Taxonomy, owner editability and neutral fallback remain PO/PM gates.

### C.4 Regeneration and user confirmation

Generated logo is the effective default whenever no valid owner upload exists and BLANK has not been explicitly selected:
1. Renderer computes output from current normalized shop name, approved stored category (or approved neutral fallback) and generator/template version.
2. Owner may preview; preview does not gate default GENERATED mode (UX-40/UX-42).
3. A profile with no valid upload and no explicit BLANK resolves to GENERATED.
4. Valid upload switches to UPLOADED. Removing upload returns to GENERATED unless owner chooses BLANK.
5. Explicit BLANK suppresses every logo/placeholder until cleared.
6. In GENERATED mode, name/category edits refresh output for future invoices; issued invoices retain their asset/version snapshot. UPLOADED and BLANK do not change on name/category edits.
7. Regeneration creates a new artifact version; historical invoice snapshots retain prior versions.

This avoids silent visual drift and respects explicit BLANK selection.

## D. Uploaded logo security and storage

### D.1 Initial MVP upload format

**Recommendation: raster-only upload. Reject SVG uploads in the initial MVP.**

Allowed input MIME/format proposals:
- JPEG/JPG;
- PNG;
- WebP only if the trusted image decoder and PDF renderer support it consistently; otherwise omit WebP from initial allow-list.

Reject:
- SVG/XML, animated GIF/WebP, HEIC/HEIF unless explicitly supported and normalized, AVIF unless explicitly supported end-to-end, BMP/TIFF, PDF, ICO, archives and all unknown formats.

Rationale: SVG is active document content and can contain script, event handlers, foreignObject, external references, CSS imports, data URLs or parser edge cases. Merely checking MIME or sanitizing by regex is insufficient. A future SVG capability would need a dedicated allow-list sanitizer, strict element/attribute policy, no script/event/style/foreignObject/external href, secure parse, rasterization and hostile corpus tests; this is outside the initial design.

### D.2 Proposed upload limits

These are technical starting limits for CH-1/CH-2 review, not PO-confirmed business requirements:
- Maximum compressed upload: **2 MiB**.
- Maximum decoded dimensions: **2048 × 2048 px**.
- Maximum total decoded pixels: **4,194,304**.
- Reject zero-byte, truncated, decompression-bomb, malformed, unsupported colour-profile or decoder-error files.
- Enforce dimensions and decode memory/time limits before storage.
- Apply EXIF orientation before normalization and strip EXIF/XMP/IPTC metadata, GPS coordinates, thumbnails and comments.
- Normalize output to a controlled PNG (preferred for renderer predictability) or JPEG/WebP only if a single supported encoding policy is chosen. PNG output is lossless, supports transparency and simplifies the renderer contract.
- Recompute byte size, MIME and dimensions from the normalized output. Store only normalized bytes, not the original untrusted upload.

### D.3 Validation and image processing pipeline

Perform on trusted server-side processing boundary, never only in the browser:
1. Authenticate owner and verify the requested shop belongs to `auth.uid()`.
2. Enforce request body/upload limit before reading full payload.
3. Treat filename and browser-provided MIME as untrusted hints only.
4. Inspect magic bytes and decode with a maintained image library in a resource-limited worker/process.
5. Verify the decoder's actual format and dimensions; reject file polyglots, malformed/truncated content and multi-frame/animated content.
6. Apply EXIF orientation, strip metadata, normalize colour space and re-encode to controlled PNG.
7. Reopen/re-decode the normalized output and verify dimensions, transparency and canonical format.
8. Compute SHA-256 and persist content digest, dimensions, MIME, byte length, processing version and object version.
9. Write object to a non-public tenant-scoped key; confirm durable write before updating the profile pointer.
10. Commit metadata/pointer transition atomically using a narrow owner-authorized service/RPC boundary. If DB pointer commit fails, leave the previous profile selection active and garbage-collect the orphan only after an explicit safe retention window.

Malware scanning is defense-in-depth where available, but not a substitute for safe decoding/re-encoding. Do not execute, render or proxy the original uploaded bytes.

### D.4 Storage model and access

Preferred logical storage design:
- Private object bucket/container, not the webroot and not a public-read bucket.
- Random object key such as `shop-assets/{shop_uuid}/{asset_uuid}/logo.png`; no user filename.
- Tenant path is not authorization: every upload/read/delete metadata operation must independently verify ownership.
- Storage policies restrict upload/read/delete to the owning authenticated user or a narrow server-side service with explicit authorization checks.
- Customer/public invoice rendering should not expose an unrestricted permanent object URL. The server should resolve the immutable asset reference and stream/render it as part of the invoice document or issue a short-lived, audience-limited signed object URL only when necessary.
- The public invoice DTO should not contain raw Storage keys, bucket names, service credentials or owner profile URLs.
- Random asset ID prevents easy enumeration but is not a substitute for access policy.
- Keep object metadata (shop_id, asset_id, digest, media_type, dimensions, processing_version, created_at, retention_state) in a private table/record; avoid using `logo_url` as the sole authority.
- Replacement marks an old object superseded, not immediately deleted. Garbage collection is allowed only if no profile or issued-invoice snapshot references it and retention policy permits deletion.

### D.5 Browser and document rendering controls

- Render only normalized server-produced PNG assets or deterministic generated SVG/PNG, never a raw uploaded SVG or untrusted HTML.
- Set explicit `width`, `height`, `object-fit: contain`, max bounding box and transparent/white background policy; maintain aspect ratio; do not crop by default.
- Use Content-Security-Policy restrictions and same-origin/authorized asset delivery; no arbitrary third-party image host.
- Escape shop name/tagline as text. Do not inject into inline SVG, CSS, HTML or PDF markup as raw markup.
- Reject or safely fall back on missing/corrupt logo bytes. Do not show a stale cache version under a new asset identity.

## E. Optional tagline design

### E.1 Persistence and contract

Tagline is independent of logo selection:
- Proposed field: `shops.tagline TEXT NULL`.
- Optional and blank is valid. `NULL` and empty/whitespace-only input normalize to `NULL`.
- Proposed UI maximum: **80 Unicode grapheme clusters**, not 80 UTF-8 bytes or UTF-16 code units. This 80-character limit is inherited from the new PM request as a proposal, not an already PO-confirmed rule.
- Preserve Bangla and English text. Normalize canonical persisted/display value to Unicode NFC; do not translate, transliterate, title-case or auto-generate.
- Do not infer tagline from logo, shop name or shop type.
- No HTML/Markdown is interpreted. Store plain text, escape at the output context and render line breaks only if the UX explicitly supports them.
- Strip or reject control characters other than allowed whitespace; reject bidi override/isolate controls unless CH-2/CH-4 approve a precise safe policy. Do not silently rewrite visible text.
- Length check occurs after NFC normalization and grapheme segmentation. Enforce both a grapheme limit and a generous UTF-8 byte ceiling to prevent abuse; exact byte ceiling is an engineering constant to be set and tested, not a PO-visible character limit.

### E.2 Update and historical behavior

- Tagline update affects future invoices only.
- An issued invoice stores an immutable `tagline_snapshot` (nullable).
- Setting tagline to blank/NULL removes it from future invoice headers but does not remove it from previously issued invoice snapshots.
- No automatic tagline generation, translation or suggestions.
- Tagline does not affect logo state or generated logo inputs.
- Public display of tagline follows the invoice header allow-list; it is not exposed by shop profile/public shop APIs unless separately approved.

## F. Immutable invoice header snapshot and reproducibility

### F.1 Proposed snapshot model

At invoice issuance, freeze every header input required to reproduce the document:
- Existing PO-confirmed identity: shop name, address, mobile, Maps URL.
- Logo: `logo_mode_snapshot`, asset ID, immutable asset version, SHA-256, media type/dimensions, and either immutable normalized bytes or a content-addressed immutable object reference.
- For GENERATED: `generator_id`, `generator_version`, `template_id`, `template_version`, normalized shop-name/type inputs, input digest and exact generated output digest; retain the generated artifact bytes for reproducibility.
- For UPLOADED: normalized raster bytes in immutable object storage and digest; never rely on a mutable `logo_url`.
- For BLANK: explicit state and null asset/digest; do not infer from null asset alone.
- Tagline: `tagline_snapshot TEXT NULL`, plus a small snapshot schema/version identifier.
- Existing/PO-confirmed header field snapshots and the same issued invoice timestamp/number as already defined in v0.2.

Do not snapshot a signed temporary URL. Do not snapshot a mutable Storage path without an immutable version/digest and retention guarantee.

### F.2 Asset retention and profile changes

- Profile edit creates a new profile asset pointer/version; it never modifies old asset bytes.
- Issued invoices point to immutable header snapshot and immutable asset version.
- Old logo object versions remain retained while referenced by any invoice snapshot, subject to legal/data-retention policy.
- Shop name/address/mobile/Maps/tagline/logo changes affect only bills issued after the new profile revision commits.
- Reprint/PDF render resolves the historical snapshot and verifies the asset digest before rendering.
- If historical asset bytes are unavailable or digest fails, show a controlled “historical invoice asset unavailable/integrity failure” state; do not substitute the current logo or silently omit the historical tagline.
- A canonical document manifest should include invoice snapshot hash, header snapshot schema version, logo asset digest, tagline digest (or null), font asset digest, renderer image digest and template versions.

### F.3 Public DTO and privacy

Add to the public bill DTO only:
- `logo_mode` as a display-safe enum if useful;
- a short-lived same-origin logo media URL or server-rendered document asset reference, not storage internals;
- `tagline` plain text snapshot if not null.

Do not include `shop_type`, storage key, original filename, private bucket name, owner user ID, object metadata or upload diagnostics in public DTO. Shop type is an internal template input, not a customer-facing profile disclosure.

On revoked/invalid/expired bill states, follow existing PO-approved disclosure boundary; no logo/tagline disclosure in a revoked response unless PO changes that policy.

## G. API/service and logical schema impact

All items below are design proposals; no SQL or migration is supplied.

### G.1 Profile fields and asset registry

Existing checked-in `shops` fields:
- `shop_type` — already exists as non-null constrained text in the pinned schema snapshot.
- `logo_url` — exists, but insufficient as a complete state or immutable asset identity.

Proposed additions (physical implementation requires a separately reviewed migration):
- `shops.logo_mode TEXT` with controlled check set `GENERATED | UPLOADED | BLANK`; temporarily nullable/legacy handling or a carefully planned backfill is required.
- `shops.logo_asset_id UUID NULL` referencing a new private `shop_assets` registry record, if a registry is adopted.
- `shops.tagline TEXT NULL`.
- optional `shops.profile_revision BIGINT` or UUID for optimistic concurrency and snapshot provenance.
- new private `shop_assets` logical record: `asset_id`, `shop_id`, source_type (`UPLOAD | GENERATED`), immutable object key/version, SHA-256, normalized MIME, dimensions, bytes, processing/generator versions, input digest, creation time, superseded/retention status.
- invoice immutable header extension: `logo_mode_snapshot`, `logo_asset_id_snapshot`, `logo_object_version_snapshot`, `logo_sha256_snapshot`, `logo_media_type_snapshot`, `logo_width_snapshot`, `logo_height_snapshot`, `logo_generator_version_snapshot`, `logo_template_version_snapshot`, `tagline_snapshot`, `header_snapshot_version`.
- if existing v0.2 invoice table is not yet implemented, these fields belong in the initial invoice/header snapshot design; if it is implemented later, add them through an additive, reviewed migration. Never mutate existing issued rows to retrofit a current shop logo/tagline as if historically present.

Alternative storage design: put immutable header JSON snapshot on invoice row, plus immutable asset registry/object version. This is preferred to many duplicated scalar columns if the JSON contract is schema-versioned, typed/validated, and protected by immutable invoice-row controls. Store a canonical digest. CH-1/CH-4 should select one physical mapping before migration design.

### G.2 Services and API boundaries

Proposed authenticated owner operations:
- `update_shop_logo_selection(shop_id, mode, asset_id?, expected_profile_revision)`: validates owner, state/asset consistency and profile revision; creates an audit event; never accepts arbitrary URL.
- `create_logo_upload_intent(shop_id, file_metadata)`: reserves one short-lived upload attempt and returns restricted upload authorization only after owner check.
- `finalize_logo_upload(shop_id, upload_id)`: server-side inspect/decode/re-encode/hash, write immutable object, then atomically set UPLOADED pointer after validation.
- `select_generated_logo(shop_id, expected_profile_revision)`: generates deterministic candidate and requires owner-confirmed selection. No external AI/API.
- `regenerate_logo(shop_id, expected_profile_revision, template_version)`: preview then explicit selection; immutable new version.
- `update_shop_tagline(shop_id, tagline, expected_profile_revision)`: normalize NFC, validate grapheme/byte/control limits, set NULL for blank; independent of logo selection.
- `get_invoice_header_snapshot(shop_id)`: internal owner-only projection for invoice creation; public clients never call private asset registry directly.

These are logical service contracts only. They must not be implemented as broad client-side table writes. A single profile update transaction should compare expected profile revision, validate logo state/reference, persist tagline and other allowed profile changes, and update profile revision atomically. Asset upload occurs before this transaction; failed transaction leaves prior active selection intact and the new asset as an orphan candidate for safe cleanup.

### G.3 Migration and compatibility

- Do not repurpose `logo_url` as the state enum or overwrite it with an object key without a data migration plan.
- Backfill strategy must classify legacy `logo_url` rows only after source/live data inspection; do not infer that a URL is safe, owned or accessible. Keep `UNCONFIGURED` compatibility until each legacy row is inspected.
- Add `logo_mode` with nullable legacy phase or explicit legacy enum handling. The steady-state allowed values remain the three owner choices.
- Keep `shop_type` as-is unless PO/PM approves a taxonomy change. No new shop type field is proposed.
- `tagline` is additive and nullable; existing rows remain NULL.
- Invoice header snapshot additions should be included at initial invoice table design if not yet implemented. If invoices already exist when this change is introduced, only new invoices receive new profile snapshot fields; old invoices remain historically blank/unconfigured, never retrofitted from current profile.
- Storage bucket creation, Storage RLS, object lifecycle and server processing configuration are migration/infra impacts; all need exact authorization and separate security review.

## H. PDF, print and Bengali rendering contract

### H.1 Single semantic document

Invoice preview, PDF and browser print must consume the same immutable semantic `InvoiceDocument` projection, versioned by `document_schema_version`. That projection includes:
- PO-confirmed shop/header fields and invoice details;
- logo state and resolved immutable asset bytes;
- optional tagline snapshot;
- line snapshots, financial totals, bill QR and mandatory Bangla heading/footer;
- font, renderer and layout version metadata.

Preview must not fetch current shop logo or tagline after issue. PDF generation and print must not read a different shop profile version than the preview. A reprint of an issued invoice must resolve the same snapshot.

### H.2 Layout and fallback

- Logo is optional and must preserve natural aspect ratio with a bounded max box; no cropping or distortion.
- BLANK means no logo and no empty placeholder gap larger than the layout's defined normal spacing.
- Tagline is optional; omit its line/block entirely when NULL. It must wrap on word/grapheme boundaries and must never overlap shop name, address or the mandatory invoice heading.
- Long Bangla/English taglines must wrap safely; do not scale below readable minimum merely to force a single line.
- Long bill pagination must preserve every item line and repeat the document context/column heading as defined in v0.2; QR, total and mandatory footer must not be split or clipped.
- If logo decode/asset digest/font loading fails, generation should stop with a deterministic error. Do not silently swap logo or claim PDF succeeded.
- The local Bengali font must shape tagline and shop text correctly. A logo SVG must contain no remote font; initial MVP's raster upload path avoids SVG font/external-resource issues.
- Keep all QR quiet-zone and scan-size requirements from v0.2; logo must not overlap or obscure QR.

### H.3 Reproducibility manifest

For a historical PDF render, record:
- invoice/header snapshot canonical hash and schema version;
- logo mode, asset ID/object version, content SHA-256, processing/generator/template version;
- tagline NFC text digest or explicit null;
- Noto Sans Bengali font artifact version and SHA-256;
- Chromium/Playwright/container image digest;
- invoice document template/layout version;
- generated PDF SHA-256 and generation timestamp (the timestamp is evidence metadata and must not alter invoice content).

A deterministic renderer should produce the same visual/text content from the same manifest. Binary PDF hashes can still vary if nondeterministic PDF metadata/creation time is included; either normalize metadata or distinguish content/visual reproducibility from byte-for-byte reproducibility. This distinction must be explicit in CH-4 acceptance.

## I. Requirement-to-design-to-test traceability

New requirement IDs for this addendum:
- **PM-LOGO-01:** uploaded owner logo wins when mode UPLOADED.
- **PM-LOGO-02:** when no upload exists, deterministic generated logo is available as fallback, subject to explicit owner selection.
- **PM-LOGO-03:** owner may explicitly choose BLANK; blank never auto-falls back.
- **PM-LOGO-04:** logo state/asset consistency across digital invoice, PDF and print.
- **PM-LOGO-05:** generated output has no external AI/API dependency and is deterministic.
- **PM-LOGO-06:** generated logo depends on persisted shop type and shop name; no type inference from name.
- **PM-LOGO-07:** uploaded asset processing, ownership, format and storage security.
- **PM-TAG-01:** optional owner-entered Bangla/English tagline.
- **PM-TAG-02:** proposed 80 grapheme-cluster maximum; blank valid.
- **PM-TAG-03:** tagline independent from logo state and not auto-generated.
- **PM-TAG-04:** tagline appears in future invoice header and is escaped text.
- **PM-HDR-01:** issued invoice freezes logo state, immutable asset revision and tagline.
- **PM-HDR-02:** subsequent profile changes affect future invoices only.

| Requirement | Design sections | Data/service effect | Proposed acceptance evidence (NOT EXECUTED) |
|---|---|---|---|
| PM-LOGO-01/02 | B, C | Generated default / upload priority / explicit Blank | UX-40/43/45/46/47; LG-01..LG-12 |
| PM-LOGO-03 | B | Explicit BLANK suppresses every fallback | UX-45/46/47; LG-04..LG-09 |
| PM-LOGO-04 | B, D, F, H | Snapshot-based renderer across surfaces | LG-06/07/14 |
| PM-LOGO-05/06 | C | Deterministic renderer; approved category or neutral-name fallback gated | UX-41/49/50; LG-10..LG-12 |
| PM-LOGO-07 | D, G | Private object store, safe raster pipeline and asset registry | LG-10..13 |
| PM-TAG-01..04 | E, F, H | Nullable text snapshot and safe rendering | TG-01..06 |
| PM-HDR-01/02 | F | Immutable header snapshot / asset retention | UX-60..64; HDR-01..06 |
| Existing v0.2 controls | §§4–10, 14–20 | Invoice/token/financial contracts retained; idempotency global UUID fixed in §6.3 | AT-IDEM-13..18 plus existing AT-* suites |

### I.1 Proposed logo/tagline acceptance scenarios

All tests below are proposed for future CH-4 review. No tests were executed.

**Logo state and transitions**
- **LG-01:** UPLOADED profile uses the selected uploaded asset in digital preview, PDF and print.
- **LG-02:** UPLOADED takes priority over any generated candidate; no generated logo overlays/replaces it.
- **LG-03:** A successfully replaced upload changes future invoices only; old issued invoices retain old asset digest/bytes.
- **LG-04:** BLANK selection persists across reload and all renderers emit no logo and no fallback placeholder.
- **LG-05:** BLANK→GENERATED requires explicit owner action/preview; a blank selection never automatically regenerates.
- **LG-06:** GENERATED→UPLOADED and UPLOADED→GENERATED follow the explicit state transition and preserve old asset references for history.
- **LG-07:** failed upload, decode or save leaves previous state/asset active.
- **LG-08:** absent upload and absent explicit BLANK resolves automatically to GENERATED; no separate opt-in is required.
- **LG-09:** valid upload takes priority; removing it returns to GENERATED unless owner explicitly selects BLANK.
- **LG-10:** same shop-name NFC + approved category + generator/template version yields identical canonical output digest.
- **LG-11:** missing/unsupported category is never inferred from shop name; approved neutral fallback or actionable block is applied.
- **LG-12:** preview is informational, not a gate to generated default; name/category edits refresh output for future invoices.
- **LG-13:** reject SVG, MIME spoof, malformed/truncated/polyglot/animated image, oversized upload and decoded pixel overflow.
- **LG-14:** two-shop security tests prove one owner cannot upload, overwrite, read or delete another shop's object.
- **LG-15:** normalized asset contains no EXIF GPS/metadata and uses allowed output MIME/dimensions.
- **LG-16:** object is private; public DTO leaks no storage key/permanent URL; unauthorized direct access fails.
- **LG-17:** logo aspect ratio is preserved and does not obscure item table, QR, total or footer.

**Tagline**
- **TG-01:** null, empty and whitespace-only tagline normalize to NULL and omit the block.
- **TG-02:** Bangla, English, mixed text and combining marks survive NFC normalization without visible corruption.
- **TG-03:** exactly 80 grapheme clusters accepted; 81 rejected; byte ceiling independently enforced.
- **TG-04:** HTML/script-looking text is rendered literally, not executed or interpreted as markup.
- **TG-05:** disallowed control/bidi characters follow documented rejection rules; no silent truncation.
- **TG-06:** changing tagline affects future invoices only; old snapshots and reprints remain identical.

**Historical header integrity / rendering**
- **HDR-01:** issue transaction captures profile revision and exact logo/tagline values atomically with invoice facts.
- **HDR-02:** profile changes immediately after issue do not alter invoice preview, public bill, PDF or print.
- **HDR-03:** asset replacement/deletion request cannot remove object bytes referenced by issued invoices.
- **HDR-04:** missing asset or digest mismatch raises a controlled integrity error; current profile is never substituted.
- **HDR-05:** same invoice snapshot, font and renderer manifest produces identical visual/text content; any byte-hash guarantee is tested separately.
- **HDR-06:** concurrent profile edit and invoice issue resolve to one complete profile revision, never a mixture of old and new header fields.

## J. Schema/API impact and change-impact matrix

All entries are design proposals; no SQL, migrations, storage bucket or runtime service was created.

| Area | Current checked-in source evidence | Proposed impact | Migration / release implication |
|---|---|---|---|
| `shops.shop_type` | Exists; controlled CHECK set `grocery/pharmacy/food/salon/general` | Reuse as generator input | No new field. Taxonomy expansion requires PM/PO and migration review |
| `shops.logo_url` | Exists; nullable URL-like field | Deprecate as authoritative state; maintain compatibility during transition | Backfill/legacy classification needed; do not overwrite blindly |
| Logo mode | No explicit mode observed in checked-in schema | Add controlled `logo_mode` | Additive schema change; legacy null/unconfigured treatment and backfill plan required |
| Logo asset metadata | No asset registry observed | Add private `shop_assets` logical table/record or equivalent immutable object metadata | Table/storage policy and retention design require separate review |
| Object storage | No logo storage contract verified in source | Private bucket/container, random immutable object keys, version/digest | Storage config, policies, processing service and retention are new infrastructure |
| Tagline | No tagline field observed in `shops` snapshot | Add nullable `tagline TEXT` | Additive column; existing values NULL; no default text |
| Profile concurrency | No revision token identified in inspected schema | Optional `profile_revision` to prevent stale form writes and ensure issue captures one profile version | Additive field or equivalent optimistic-concurrency token |
| Invoice snapshot | Invoice schema is proposed, not implemented in pinned source | Add immutable header JSON/schema version plus logo asset reference/digest and tagline snapshot | Include before first invoice migration where possible; later rollout must not retrofit old invoices |
| Invoice services | Invoice APIs/RPCs not present in pinned source tree | Narrow owner-authenticated upload/finalize/select/regenerate/tagline update contracts; issue uses single profile revision snapshot | New server-side authorization and audit; no broad client table access |
| Public DTO | v0.2 defines explicit allow-list | Add snapshot tagline and safe same-origin logo/document media; never reveal storage internals or shop_type | Must preserve token-before-lookup, revocation and no-store rules |
| PDF/render | v0.2 local Bengali font and pinned renderer proposal | Render resolved immutable logo and optional tagline from same semantic InvoiceDocument | Requires local font/hash, renderer digest, asset reproducibility and CH-4 visual evidence |
| Historical invoices | v0.2 immutable facts/lines | Extend immutable header snapshot and asset retention | Old invoice must remain as originally issued; current profile never used to reconstruct it |

### J.1 Physical model choice still required

Preferred design is a typed, versioned immutable `header_snapshot` JSON object on invoice plus an immutable `shop_assets` record/object. This reduces a long set of scalar columns while retaining a strict schema:
- `snapshot_schema_version`;
- `shop`: name/address/phone/map URL;
- `logo`: mode, asset UUID/version/digest, media/dimensions, generator/template metadata, or explicit BLANK;
- `tagline`: NFC string or null.

CH-1/CH-4 must decide whether to adopt the JSON snapshot or scalar immutable columns before physical migration design. Either model must be immutable, canonicalizable, digestible and independently testable.

## K. Security and release risk register

| ID | Severity | Risk / failure mode | Required control / closure evidence | Blocks |
|---|---|---|---|---|
| LG-R01 | MAJOR | SVG/script/external-resource upload executes or leaks data | SVG rejected; raster decode/re-encode; hostile corpus negative tests | Logo upload release |
| LG-R02 | MAJOR | Tenant object ID/path guessing exposes or overwrites another shop logo | Private bucket, random IDs, owner checks, storage policy negative tests | Upload/public render release |
| LG-R03 | MAJOR | Decompression bomb, malformed image, polyglot or oversized content exhausts decoder | Strict limits, magic-byte sniff, resource-limited decode, canonical re-encode | Upload release |
| LG-R04 | MAJOR | Mutable `logo_url` or object overwrite changes historical invoice | Immutable asset versions, digest and retention/GC reference checks | Historical invoice/PDF release |
| LG-R05 | MAJOR | BLANK treated as null/unconfigured and generated placeholder appears | Explicit `logo_mode`; state invariants; blank regression tests | Logo release |
| LG-R06 | MAJOR | Shop name/type edit silently changes generated logo or type inferred incorrectly | Controlled persisted shop_type; owner preview/confirmation; generator version pin | Generated logo release |
| TG-R01 | MAJOR | Tagline interpreted as HTML/script/unsafe markup | Plain text only, context-sensitive escaping, no raw HTML/SVG interpolation | Tagline release |
| TG-R02 | MINOR | Unicode grapheme counting/truncation corrupts Bangla combining marks | NFC + grapheme segmentation; test corpus; reject rather than truncate | Tagline release |
| HDR-R01 | BLOCKER | Reprint/public page uses current profile rather than issued header snapshot | Invoice issue captures atomic immutable header revision and asset version; historical reprint tests | Invoice release |
| HDR-R02 | MAJOR | Old asset deleted while historical invoices still reference it | Referential retention / mark-and-sweep only when unreferenced and retention permits | Historical PDF release |
| HDR-R03 | MAJOR | Concurrent profile update produces mixed logo/tagline/header fields in one invoice | Profile revision lock/snapshot transaction; concurrent issue/edit tests | Invoice issue release |
| PDF-R01 | MAJOR | Preview/PDF/print render different logo or tagline versions | One semantic document projection and fixed renderer/font artifacts | PDF release |
| PDF-R02 | MAJOR | Logo/tagline causes header overflow, overlaps QR/footer or clips Bangla | Bounded aspect ratio, grapheme-safe wrap, pagination/visual evidence | PDF/print release |
| PDF-R03 | MAJOR | Byte-level PDF differs due timestamps despite same snapshot | Normalize metadata or claim visual/text reproducibility only; CH-4 compare content/visual hashes separately | Deterministic PDF claim |

## L. CH-4 independent evidence package (future, NOT EXECUTED)

CH-4 should receive:
1. Exact revised PR #28 HEAD and v0.3 document blob.
2. Exact CH-2 revised UX commit/blob containing logo/tagline screen and state behavior; do not use an unpinned moving branch.
3. Schema snapshot identity and proposed logical schema change table; no live DB assertions.
4. Sanitized positive and hostile raster fixture corpus with test manifest/hashes, created only under later authorized QA scope.
5. Generated logo fixture vectors: Bengali names, English names, mixed script, blank, missing/unknown shop type and generator-version changes.
6. Tagline fixture corpus: 0, 1, 80, 81 grapheme clusters; NFC/NFD; combining marks; HTML-like text; control/bidi edge cases.
7. Historical header snapshot fixtures: upload replacement, blank state, generated regeneration, profile edits, concurrent issue/edit, missing asset and digest mismatch.
8. PDF manifest with font binary/license/hash, renderer/container digest, invoice template version and sample output hashes.
9. Storage authorization evidence: owner access, cross-tenant denial, no public bucket/object access, upload body/dimension/format rejection and cleanup retention behavior.
10. Exact test commands/results and environment only after separate PM QA authorization. Until then every item is a proposed evidence requirement, not a pass.

## M. PO/PM/CH-2 decision and coordination register

| ID | Owner | Decision / clarification | Current status |
|---|---|---|---|
| PM-LOGO-01..07 | PM / CH-1 / CH-2 | Confirm logo states GENERATED/UPLOADED/BLANK, default for new/existing shops, explicit preview/selection, regeneration behavior and blank semantics | PM requirement received; UX and CH-1 confirmation pending |
| PM-TAG-01..04 | PM / CH-1 / CH-2 | Confirm optional Bangla/English tagline; max 80 grapheme clusters; blank/null behavior; placement/wrapping | PM requirement received; max 80 remains proposed pending UX confirmation |
| PM-HDR-01/02 | PM / PO | Confirm issued invoice permanently preserves logo selection/asset and tagline at issue; later profile changes apply to future invoices only | Technically recommended; explicit PO confirmation requested |
| LOGO-TYPE-01 | PM / CH-2 | Confirm source for shop type and whether current controlled taxonomy is adequate for the Invoice-First food-store experience | Existing checked-in schema has shop_type; UX control and taxonomy not confirmed |
| LOGO-DEFAULT-01 | PM / CH-2 | Generated is default absent valid upload/explicit BLANK; preview is not opt-in | ALIGNED TO PR #30 UX-40/42/43, revision 0.2 |
| LOGO-UPLOAD-01 | PM / CH-1 | Approve proposed raster allow-list and engineering limits (JPEG/PNG, 2 MiB, 2048×2048, 4.19 MP) | Engineering proposal; UX/security review required |
| TAG-LIMIT-01 | PM / CH-2 | Confirm whether “80 characters” means Unicode grapheme clusters (recommended), and decide any multiline behavior | PENDING |
| HDR-RET-01 | PO / PM | Confirm retention expectations for old uploaded/generated assets while any invoice snapshot references them, plus shop deletion/legal retention policy | PENDING |
| HDR-PUBLIC-01 | PO / CH-2 | Confirm tagline and logo appear on valid public bill page as part of invoice header; revoked/expired states follow existing disclosure gate | PENDING |
| CH2-CROSSWALK-01 | CH-2 | PR #30 revision 0.2; preserve UX-01..64 and re-pin later revisions before implementation | CURRENT UX REFERENCE PINNED |

**Issue #31 status:** the current PO-response table still marks PO-02, PO-04, PO-05, PO-06, PO-11, PO-12, PO-I11 and PO-I06A as PENDING. This addendum does not change those decisions or imply any response. Logo and tagline are new requirements and must be added to a controlled PO/PM decision record only by the authorized owner.

## N. PR #32 AC-10 coordination

CH-1 has separately assigned the AC-10 correction to the existing PR #32 branch and supplied exact replacement wording in PR #32 comment `6765449022`. The correction states that Phase A1 must not introduce, extend, refactor, regress or otherwise change non-A1 features; existing memo/PDF, WhatsApp, stock, customer-ledger and Master QR flows may remain present exactly as at the baseline; acceptance is judged by no A1 diff/regression in those flows, not by their absence.

CH-1 owns that governance-branch change. This CH-3 technical design addendum does not edit PR #32 or duplicate its authority register. CH-3 treats the exact CH-1 instruction as coordination evidence; completion remains for CH-1 to verify.

## O. Existing v0.2 controls retained unchanged

This addendum does not weaken or replace:
- invoice/line immutability and append-only lifecycle/audit contracts (§4);
- transactional per-shop bill numbering and lock order (§5);
- canonical idempotency, same-key replay and unknown-outcome recovery (§6);
- BDT numeric bounds, per-line rounding and golden vectors (§7);
- versioned HMAC, key ID, expiry, revocation and token-before-lookup (§8);
- public DTO, tenant isolation, no-store/CDN/log/referrer/CSP/rate limits (§9);
- online-only issue/verification boundary (§10);
- Bengali font provenance, pinned renderer, pagination and QR controls (§11);
- menu policy authority gap (§12);
- WhatsApp fallback and persisted data source (§13);
- PO/UX/technical/test traceability (§14);
- acceptance IDs AT-TOK/DB/PUB/IDEM/FIN/PDF/MENU/OFF/UX/SHARE (§15);
- PO decision gates (§16), planning-only sequence (§17), CH-4 mapping (§18) and no-authorization statements (§19–20).

## P. Updated technical release gates

Before logo/tagline can ship:
1. CH-2 current UX revision 0.2 is pinned at HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`; map its UX-40..UX-64 individually before CH-4 test-plan freeze.
2. CH-1 must accept the revised technical design at the exact commit/blob.
3. PM/PO must decide logo default, shop-type taxonomy use, historical header promise and public/revoked display treatment.
4. Physical migration/storage architecture must be reviewed separately; never infer the checked-in `logo_url` field is sufficient.
5. Upload pipeline must reject SVG and all unrecognized/malformed formats; only normalized safe raster output is stored.
6. Storage policies and cross-tenant isolation must be independently verified.
7. Invoice issue must atomically snapshot profile revision, logo state/asset digest and tagline.
8. Font and renderer artifacts must be pinned and verified; CH-4 must confirm Bengali text and visual consistency across preview/PDF/print.
9. Retention policy must prevent garbage collection of any asset referenced by an issued invoice.
10. All LG/TG/HDR/PDF acceptance scenarios remain PROPOSED / NOT EXECUTED until separately authorized QA execution.

## Q. Final CH-3 disposition

The proposed approach is technically feasible without an external AI/logo service and without introducing a new shop-type field in the current checked-in schema snapshot. It does require explicit persisted logo state, immutable asset identity/storage, an optional nullable tagline field and invoice-header snapshot expansion. The existing `logo_url` is insufficient to express explicit BLANK and reliable historical asset identity. SVG upload is rejected for the initial MVP; raster upload must be decoded, normalized and re-encoded on a trusted server boundary. Generated logo must be deterministic/versioned and is the default unless a valid upload or explicit BLANK exists; owner preview is not an opt-in gate. Tagline is plain optional text, never generated, normalized to NFC and escaped at rendering. Issued invoices must retain the exact header snapshot and asset bytes/version; profile changes affect future invoices only.

No live schema or database statement is made. No SQL, migration, code, storage bucket, API, dependency, build, test, PDF render or QA was executed.

**Implementation authorization: NOT GRANTED.**  
**QA execution authorization: NOT GRANTED.**  
**PR merge authorization: NOT GRANTED.**  
**Deployment / pilot: NOT AUTHORIZED.**

---

# Controlled Addendum v0.3.1 — P2 Idempotency and Generated Default Alignment

**Task:** DT-CH3-PR33-FOLLOWUP-001  
**Parent candidate:** `00a3fcaa44b55a6a2b505aa2e756cd47ce4f723d`, blob `5f3e35fefe1890ffc93379d4415bb8ec86aba868`  
**Exact UX source:** PR #30 revision 0.2, HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`  
**Codex finding:** PR #33 comment `4524063634`, P2  
**Status:** Corrected design candidate — CH-1 / CH-4 re-review required  
**Implementation / DB / QA authorization:** NOT GRANTED

## R.1 P2 failure scenario

A request UUID R commits for shop A and operation `invoice_create`. A later request reuses R with shop B or a different operation. Under the old composite key `(shop_id, operation_type, request_id)`, no uniqueness collision occurs; lookup may report “No existing key”, allowing a second number allocation and invoice/operation. This contradicts the earlier conflict guarantee.

## R.2 Corrected namespaced global idempotency identity

CH-1's integrated review requires the global identity to state its namespace explicitly. Define the idempotency namespace as `invoice-create/v1` for this invoice-creation API contract. The database uniqueness key is **(`idempotency_namespace`, `request_id`)**, where the namespace identifies the API/domain contract and is independent of shop and operation. If another operation is later deliberately placed in the same namespace, `operation_type` remains a compared attribute and cannot evade collision detection. A different independently versioned API namespace may use the same UUID without collision only when that namespace boundary is explicitly defined and its side effects are independent.

Preferred logical storage is `invoice_idempotency_requests` with:
- `idempotency_namespace TEXT NOT NULL`;
- `request_id UUID NOT NULL`;
- database UNIQUE/PRIMARY KEY on (`idempotency_namespace`, `request_id`) — no `shop_id` or `operation_type` in the uniqueness key;
- immutable `owner_user_id`, `shop_id`, `operation_type`, canonicalization version, payload hash, result reference and completion state.

Alternatively redesign `transaction_requests` to enforce the same namespace+UUID uniqueness. Composite-only uniqueness on shop/operation/request is insufficient.

**Authorization and collision lookup order:** authenticate first and derive owner from the verified session. For a newly claimed UUID, authorize the requested shop before any invoice counter access; ownership failure rolls back the claim. For an existing UUID, first authorize the current caller for the requested shop. If the caller does not own the requested shop, return the normal authorization denial without revealing whether a matching or conflicting UUID exists. If authorized for the requested shop, load the unique registry row through the narrow server/RPC boundary and compare namespace, authenticated owner, shop, operation, canonicalization version and payload hash. Return the original result only if every comparison matches and the referenced invoice is confirmed to belong to the same owner/shop. A different shop that the same owner owns is still a mismatch and returns generic `IDEMPOTENCY_CONFLICT`; no prior invoice metadata is disclosed. A cross-tenant caller who does not own the requested shop receives only authorization denial, not a global registry result. Never query another tenant's invoice to resolve a mismatch.

Any authorized-scope mismatch (different owner, different owned shop, operation, canonicalization version or payload) returns generic `IDEMPOTENCY_CONFLICT`; disclose no existing invoice ID, bill number, shop identity, canonical payload or mismatch field. Allocate no number and create no invoice. Incomplete/inconsistent records return `REQUEST_STATE_REQUIRES_RECONCILIATION`.

Concurrent identical requests serialize on the namespace+UUID unique constraint and replay one result. Concurrent requests with different shops or operations but the same namespace+UUID serialize on that same key; at most one can create, the other receives conflict after the winning transaction resolves. Claim, invoice, lines, counter, audit and registry completion commit together; rollback removes all. Committed namespace+UUID pairs are never recycled; retain a minimal tombstone after result data retention ends.

**Database proposal only:** namespace+UUID unique key; duplicate-pair preflight across existing request rows; owner/shop/operation/hash attributes; dedicated registry or redesign of `transaction_requests`; narrow server/RPC access and atomic transaction. Do not add a global unique constraint without migration preflight. No SQL or migration is authored/executed.

## R.3 Logo resolution aligned to current UX

PR #30 UX-40 says no upload and no explicit Blank resolves to Generated by default; UX-43 gives upload priority; UX-46 says Blank suppresses every mark/placeholder; UX-42 provides preview but not a separate opt-in.

Effective state:
1. Valid upload and no explicit Blank: `UPLOADED`.
2. Explicit owner Blank selection: `BLANK`, suppressing generated and placeholder output.
3. No valid upload and no explicit Blank: `GENERATED` by default; no separate opt-in.

Removing an upload returns to Generated unless Blank is explicitly selected. Clearing Blank resumes Generated. Preview is informational. Issued invoices snapshot exact generated/uploaded asset version.

## R.4 Category dependency

Final category taxonomy remains PO/PM-pending. Never infer it from shop name or other free text. Use only explicitly stored/selected values from the approved taxonomy. If missing/unsupported, use a deterministic category-neutral template only with CH-1/CH-2 approval; otherwise block logo-dependent rendering with an actionable category-selection error. Do not coerce legacy values or default to `food`. UX-49/50 remain PO-gated.

## R.5 Exact UX source

PR #30 revision 0.2 HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`. Aligns with UX-40/42/43/45/46/47/49/50/64. Remaining category taxonomy, upload limits, tagline limit and historical header retention remain PO/PM gates.

## R.6 Proposed tests — NOT EXECUTED

AT-IDEM-13..18 cover cross-shop, cross-operation, cross-owner, identical concurrency, conflicting concurrency and incomplete-record behaviour. Existing AT-IDEM-01..12 remain. Logo LG-08..12 are corrected for Generated default and category fallback. All are PROPOSED / NOT EXECUTED.

## R.7 Verification boundary

No application code, SQL, migration, database operation, build, automated test, browser/PDF QA, merge, deployment or pilot was performed. Runtime/security behaviour remains UNVERIFIED pending separate authorization.

## R.8 CH-1 integrated review alignment

CH-1 review comment `6766053949` requires a namespace-defined identity and authorisation before disclosing any prior record/result. This revision adopts namespace `invoice-create/v1` and database uniqueness on namespace+request UUID only; shop and operation are comparison attributes, not unique-key components. Existing-shop authorization is checked before returning or distinguishing any prior result. If the requested shop is not owned by the caller, return authorization denial without a registry-existence signal. All conflict results are generic and disclose no invoice data. This is a technical design correction; CH-1 review finding remains reviewer-controlled until re-review.


## R.9 PR #30 UX-40..UX-64 technical crosswalk (exact revision 0.2)

Source: PR #30 HEAD `c7b0d8bddad3afcdf48b0b8fba8331ad46dda309`, blob `3b34e6b9075b65ee027ac368fb964a5f9e98ae8f`. No UX criterion is replaced or renumbered.

| UX IDs | UX intent | Technical design mapping | Proposed CH-4 evidence |
|---|---|---|---|
| UX-40 | Generated default when no upload/explicit Blank | §§B.1–B.3, C.4, R.3 | LG-08, HDR-01 |
| UX-41 | Generated uses current name/category; preview regenerates on changes | §§C.1–C.4, R.4 | LG-10–12 |
| UX-42 | Generated preview before invoice use | §§C.4, R.3; preview not an opt-in gate | LG-08, LG-12 |
| UX-43 | Uploaded priority | §§B.1–B.3, R.3 | LG-01–03, LG-09 |
| UX-44 | Replacement retains current logo until successful | §§B.2, D.3 | LG-03, LG-07 |
| UX-45 | Owner removes upload and chooses Generated or Blank | §§B.2, R.3 | LG-05, LG-06, LG-09 |
| UX-46 | Blank suppresses all logo/placeholder in all renderers | §§B.1–B.3, H.1–H.2 | LG-04, LG-05 |
| UX-47 | Blank can return to Generated | §§B.2, C.4, R.3 | LG-05 |
| UX-48 | Regenerate Generated without overwriting Uploaded | §§B.2, C.4 | LG-06, LG-12 |
| UX-49 | Only accepted taxonomy choices | §§C.3, R.4 | LG-11 |
| UX-50 | Missing category prompts from accepted choices | §§C.3, R.4 | LG-11 |
| UX-51–53 | Unsupported/oversized file rejection; failed upload preserves previous logo/tagline | §§D.1–D.4 | LG-07, LG-13–15 |
| UX-54–56 | Owner-only Bangla/English tagline; blank valid; independent edit | §E and G.1–G.2 | TG-01, TG-02, TG-06 |
| UX-57 | 80 grapheme limit remains proposed until approval | §E.1; PO/PM gate register | TG-03 |
| UX-58 | Bangla/English tagline renders without clipping | §§H.1–H.3 | TG-02, TG-04, PDF-R01/02 |
| UX-59 | Logo and tagline state independent | §§B, E | LG-06, TG-06 |
| UX-60 | Owner previews complete invoice header | §§H.1–H.2 | HDR-01, PDF-R01 |
| UX-61–62 | Same issued header across surfaces; profile edit follows historical policy | §§F, H; PM-HDR-01/02 remains PO/PM gate | HDR-01–06 |
| UX-63–64 | Aspect ratio/Blank reflow; corrupt/missing assets report safely | §§D.5, H.2 | LG-14–17, PDF-R02 |

All crosswalked scenarios are PROPOSED / NOT EXECUTED. CH-4 must preserve UX-01..UX-39 and include UX-40..UX-64 in its criterion-level QA mapping.


## R.10 CH-1 P2 correction traceability

CH-1 review comment 6766053949 requires namespace-defined uniqueness and authorization before disclosure. This revision pins `invoice-create/v1` as the namespace and requires database uniqueness on `(idempotency_namespace, request_id)` only; shop and operation are comparison attributes. The caller must be authorized for the requested shop before any prior result is disclosed. A caller without access to the requested shop receives ordinary authorization denial without any UUID-existence signal. A caller authorized for that requested shop but reusing the same namespace/UUID against a different owned shop or operation receives generic `IDEMPOTENCY_CONFLICT`, with no previous invoice disclosure or new side effect. CH-1 review remains reviewer-controlled until re-review of this exact commit.
