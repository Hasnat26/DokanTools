# CH-3 Invoice-First backend contract

## Scope delivered
Invoice-only additive schema, authenticated server RPC, owner issue/history/detail API, transactional per-shop numbering, immutable snapshots, namespace-scoped idempotency and owner-only RLS. Public QR/verification is absent and disabled.

## API contract
Issue #36 comment 6787430943 proposes POST /api/invoices with shopId, requestId, idempotencyNamespace, header and lines; decimal inputs are strings. POST returns {invoice,replayed}; collection GET returns {invoices}; detail GET returns {invoice}. Responses are no-store. CH-2 contract confirmation is pending.

## Profile snapshot
RPC authorizes and locks the requested shop through auth.uid() and FOR SHARE, reads profile fields from public.shops, and rejects if required fields are missing or the request's header differs from the stored profile. Header snapshots are database-derived, not browser-trusted.

## Atomicity/isolation
The migration does not modify legacy transaction_requests, memo RPCs, stock, inventory, customers or baki tables. One PostgreSQL function transaction claims the namespaced key, advances the shop counter, writes invoice/lines/issued event/audit and completes the registry. Any exception rolls back all effects including the counter. Owner authorization precedes private registry comparison. Invoice facts and lines have UPDATE/DELETE rejection triggers and no client write grants.

## Migration strategy
Forward-only additive migration 202611110001_invoice_first_foundation.sql. Apply only to an isolated disposable acceptance DB after baseline and previous migrations. Not applied to any DB. Destructive rollback requires separate review and data disposal confirmation; remove function and invoice objects in reverse FK order. Never delete issued invoices or decrement counters in a retained acceptance environment.

## Limitations
PO-02/04/05/06/11/12/I11/I06A remain pending. Menu eligibility, quantity/unit policy, price-column meaning and cancellation policy are not decided. Public bill token/QR, HMAC/KMS, public DTO, revocation and verification are intentionally absent. Logo/tagline historical snapshots are deferred. No live DB, RLS, two-tenant, build or runtime tests are claimed.
