# CH-3 Invoice-First backend contract

## Scope
Invoice-only additive schema, authenticated server RPC, owner issue/history/detail API, transactional per-shop numbering, immutable snapshots, namespace-scoped idempotency and owner-only RLS. Public QR/verification is absent and disabled.

## API contract confirmed by CH-2
Issue #36 comment 6787539534 confirms the contract initially proposed in comment 6787430943. POST /api/invoices accepts shopId, requestId, idempotencyNamespace=invoice-create/v1, header and lines; decimal quantities and unit prices are strings. CH-2 adapter sends the Supabase access token as Authorization: Bearer. GET /api/invoices?shopId=...&limit=50 and GET /api/invoices/{invoiceId}?shopId=... provide private owner history/detail. POST returns {invoice,replayed}; history returns {invoices}; detail returns {invoice}. All responses use no-store.

## Profile snapshot and idempotency
RPC locks and authorizes the shop row using auth.uid() and FOR SHARE before reading the private idempotency registry. It fingerprints the exact request header/lines so exact retries still replay the persisted invoice after the live profile changes. For a new claim only, the RPC compares the supplied header against required current shop profile fields and stores the DB-derived values. A changed payload under the same key returns a generic conflict.

## Transaction/isolation
The migration does not modify legacy transaction_requests, memo RPCs, stock/inventory, customers or baki tables. One PostgreSQL function transaction claims the namespaced key, advances the per-shop counter, writes invoice/lines/issued event/audit and completes the registry. Exceptions rollback all effects including the counter. Invoice facts and lines reject UPDATE/DELETE and have no client write grants. RLS exposes owner-only SELECT; no anon grants exist.

## Migration
Forward-only additive migration 202611110001_invoice_first_foundation.sql. It is intended only for a disposable isolated acceptance database after baseline schema and existing migrations. Not applied to any database. Rollback is destructive and requires separate approval/disposal confirmation: drop the RPC, triggers and invoice objects in reverse FK order. Never delete issued invoices or decrement counters where records/evidence must be retained.

## Limitations / gates
PO-02/04/05/06/11/12/I11/I06A remain pending. Menu eligibility, price-column semantics, unit/quantity policy and revocation are not decided. This RPC deliberately does not read item_catalog; catalogItemId is stored only as a provenance snapshot and must not be treated as verified menu eligibility. Public bill QR/token, HMAC/KMS, public DTO, revocation and customer verification are not implemented. Logo/tagline historical snapshots are deferred. No database migration, runtime RLS, concurrency or two-tenant DB test has been run.


## CH-1 remediation — runtime gate, profile provenance and catalog decision

### Issue gate (enforced twice)
Invoice issuance is default-OFF in `public.invoice_runtime_controls`. The migration seeds `invoice_issue=false`, enables RLS and grants no client access. The SECURITY DEFINER RPC checks this flag before idempotency/counter/write work. The HTTP POST handler also has a compile-time `INVOICE_ISSUE_ENABLED=false` guard. Only a separately reviewed PO-gate closure change may alter either guard. The disposable harness explicitly flips the database flag to true as the postgres test administrator; this is test-only and never applied to hosted environments.

### Existing profile schema compatibility
The exact baseline `supabase/schema.sql` defines `shops.shop_name TEXT NOT NULL`, but `phone`, `address`, and `map_link` are nullable. PO-confirmed invoice mockup fields include shop name, address, mobile and Google Maps location; the approved Shop Profile UX requires name/address/mobile. The RPC remains fail-closed when shop name, address or mobile are absent. Maps URL is optional: per technical design section 9.3, only HTTPS Google Maps allow-list hosts are stored as clickable snapshots; absent, malformed or non-allow-listed URLs are snapshotted as NULL/non-clickable. This preserves the baseline nullable map_link field and does not alter the shops schema. POST remains disabled pending PO approval.

### Catalog validation — proposed design only; not implemented
Baseline `item_catalog` is per-shop (`shop_id`), has `is_active BOOLEAN NOT NULL DEFAULT true`, and `sale_price NUMERIC(12,2) NOT NULL DEFAULT 0`. PO menu policy PO-06 / PO-B01–B07 remains pending. No runtime eligibility or price policy is assumed and the current RPC continues to treat `catalogItemId` as provenance only.

Before enabling POST, PO must approve:
1. Whether every invoice line must reference an active `item_catalog` row or ad-hoc lines are permitted.
2. Whether `sale_price` is the authoritative invoice unit price, and whether price changes between cart review and issue cause a stale-price rejection or use current price.
3. Whether inactive/deleted catalog items may be sold from an already-open cart.
4. Unit and quantity precision/rounding semantics.

**Proposed safe server contract, conditional on PO approval:** client submits `catalogItemId` and quantity, not an authoritative price or item name. After owner/shop authorization and idempotency replay resolution, the RPC locks each distinct catalog row in ascending UUID order using `FOR SHARE`; it requires `item_catalog.id = requested id AND shop_id = authorized shop AND is_active = true`; reads `name`, `unit`, and `sale_price` from that row; validates approved unit/quantity policy; computes line totals server-side; and snapshots catalog ID/name/unit/price. Missing, foreign-shop, inactive or stale-price references fail before the counter is advanced. Lock order proposal: shop row → idempotency registry → catalog rows sorted by UUID → per-shop counter → invoice/lines/events/audit → idempotency completion. This design is not active until PO approval and CH-1 contract update.

### Security-definer posture
The migration creates the RPC as the migration role (expected `postgres` in Supabase migration context), sets `search_path=pg_catalog` only, schema-qualifies `auth.uid()`, `public.*` and `extensions.digest`, revokes PUBLIC/anon execute, and grants EXECUTE only to authenticated. The test harness asserts function owner, SECURITY DEFINER flag, exact search_path, ACLs and table privileges. Runtime assertions apply to local PostgreSQL only; hosted role ownership must be verified separately before release.


### Maps DTO compatibility
The request contract retains header.mapUrl as a string for compatibility with the CH-2 request payload; an absent profile value is sent as an empty string. Response DTOs expose header.mapUrl as string or null because unsafe/absent values are normalized to NULL by the database. CH-2 must mirror the response type before integrating invoice history/detail.
