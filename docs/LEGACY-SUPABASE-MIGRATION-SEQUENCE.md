# DokanTools — Remaining Supabase-Dependent Modules and Migration Sequence

**Status:** Proposed controlled migration plan  
**Architecture authority:** PO-approved browser-first/local-first V1 decision (2026-11-24)  
**Current implementation boundary:** PR #55 local invoice workspace only

## Current modules that still require Supabase

| Module / capability | Current dependency | V1 disposition |
|---|---|---|
| Authentication and dashboard account | Supabase Auth; shop ownership/user identity | Excluded from standalone local invoice workspace. Local workspace is browser-profile scoped; no account login or cross-device identity in this stage. |
| Shop profile administration | Supabase shop records and ownership | Legacy cloud feature. Local invoice workspace has a separate local shop profile. Migration/import mapping is required before consolidation. |
| Product catalogue and customers | Supabase catalogue/customer records and tenant relationships | Legacy cloud feature. Local invoice workspace has independent IndexedDB product/customer records. No automatic synchronization. |
| Stock/inventory | Supabase PostgreSQL/RPC, inventory records and transaction guards | Excluded from local invoice V1 until atomic inventory ledger, stock reconciliation and recovery tests are approved. |
| Memo / sales ledger | Supabase RPC and PostgreSQL transactions, including stock/customer effects | Excluded from local invoice V1. Do not replace database transaction semantics with naive browser writes. |
| Baki / customer balance | Supabase-backed balance/ledger operations | Excluded until local transaction ordering, correction/reversal, audit and reconciliation semantics are specified and tested. |
| Public shop profile / QR storefront | Supabase shop/profile data loaded by public route | Static `/shop?shopId=...` routing is only a route compatibility change; it does not make profile data local or independently publishable. Public dynamic storefront remains cloud-dependent. |
| Existing Draft Memo workflow | IndexedDB draft store but shop/catalogue data loaded from Supabase | Legacy hybrid workflow; not part of standalone local invoice acceptance boundary. |

## Controlled migration sequence

### M0 — Local workspace and recovery (PR #55)
- Standalone local invoice workspace; no Supabase or invoice API requests for create/edit/calculate/save/PDF/share.
- IndexedDB workspace, drafts, products and customers.
- Local JSON export/import and customer-owned Google Drive manual backup.
- Fail-closed invoice issuance OFF; PO-10 total-only fields retained.
- Acceptance gate: exact-head CI, offline browser test, recovery test, and hosted preview validation.

### M1 — Shop profile and catalogue migration
- Define canonical local workspace/shop IDs and a versioned import mapping from existing Supabase shop, catalogue and customer rows.
- Build read-only export from existing cloud data, then explicit user-confirmed import into IndexedDB.
- Preserve IDs where safe; report duplicate names/phones and unresolved references instead of silently merging.
- Acceptance gate: record-count reconciliation, field-level sample audit, import repeatability/idempotence, backup-before-import and restore drill.
- Keep old cloud module read-only during pilot; do not enable dual-write.

### M2 — Stock/inventory ledger
- Specify inventory event model (receipt, issue/sale, adjustment, reversal), concurrency/locking expectations and negative-stock policy.
- Implement atomic IndexedDB transactions and idempotency keys; establish local audit trail and reconciliation report.
- Acceptance gate: invariant tests, crash/reload recovery, duplicate-submit tests, full stock ledger reconciliation and explicit approval of single-device/local-only limitations.
- Do not migrate stock until M1 identities and catalogue mapping are stable.

### M3 — Memo and baki transactions
- Document existing RPC transaction boundaries and business rules before porting.
- Model memo, customer balance, stock movement and correction/reversal as one atomic local transaction; no partial writes.
- Define rounding, void/correction, audit history, backup consistency and restore conflict policy.
- Acceptance gate: parity tests against existing Supabase behavior using synthetic fixtures; transaction rollback tests; ledger reconciliation; independent QA and PO approval.
- This is a separate workstream and must not be inferred as included in local invoice V1.

### M4 — Public storefront and multi-device access
- Choose a publishing model: retained cloud read API, approved edge/backend service, or explicit static customer-generated publishing/export.
- Static Pages alone cannot expose arbitrary customer-owned IndexedDB data to other users/devices. A query-string route does not provide data hosting.
- Define privacy, shop ownership, public data projection, update/deletion and QR URL behavior.
- Acceptance gate: published data freshness, access control/privacy, offline behavior, cross-device test and cost/operational owner approval.

### M5 — Legacy retirement
- After each module passes its acceptance gate, disable the corresponding cloud write path and verify no unintended calls.
- Keep rollback/export artifacts and a documented recovery window.
- Remove Supabase dependency only after all included modules have passed migration and the PO explicitly approves retirement.

## Architecture constraints and release boundaries

- Browser-first/local-first means local records are primary for modules explicitly migrated; it does not imply multi-device sync, secure shared-user tenancy, public storefront hosting or cloud backup without customer authorization.
- IndexedDB is best-effort browser storage. Browser/profile loss can remove local records; frequent export/backup and tested restore are required.
- Separate browser profiles are the current workspace isolation boundary. This is not equivalent to authenticated multi-user access or encrypted at-rest application storage.
- No invoice issuance, production deployment, production data migration or paid infrastructure is authorized by this plan.
