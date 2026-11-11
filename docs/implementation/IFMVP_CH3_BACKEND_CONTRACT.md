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
