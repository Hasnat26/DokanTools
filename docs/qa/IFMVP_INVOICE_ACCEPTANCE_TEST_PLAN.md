# CH-4 Invoice-First executable test plan and synthetic fixtures

**Issue:** #36 — PM-authorized Invoice-First implementation  
**Branch:** `test/ifmvp-invoice-acceptance`  
**Base:** `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Authority:** Issue #36 comment 6786978430  
**Design:** PR #30 v0.3; PR #33 v0.4.2  
**Scope:** QA preparation and policy-neutral fixture/oracle tests. No production/customer data. No staging/production database access or mutation.

## 1. Current implementation baseline / execution boundary

At the time this test package was prepared, the QA branch was at the authorized base commit and contained no invoice-specific migration, invoice API/RPC, invoice routes or invoice tables. The existing `supabase/schema.sql` and migration inventory contain legacy memo/stock/customer-ledger behavior only. Existing test command is `npm test` → `node --test tests/*.test.mjs`.

The plan therefore separates:
- **Fixture-model tests:** deterministic in-memory examples only. They exercise the test model's logic, not the application implementation. They are not PostgreSQL, RLS, transaction, database concurrency, UI, or persistence proof.
- **Implementation integration tests:** explicitly blocked until CH-3 invoice migration/API is merged or made available on an implementation branch and a disposable local PostgreSQL/Supabase test target exists.
- **Browser/render tests:** blocked until CH-2 UI route/components are available and a local browser harness is installed/configured.
- **PO-dependent scenarios:** parameterized/blocked; not asserted as product policy.

**Status terminology:** `MODEL ORACLE` means only that an in-memory model assertion exists. `BLOCKED` means no executable test is claimed until the real implementation and the named integration harness exist. No fixture-model result may be represented as PostgreSQL, RLS, transaction atomicity, real concurrency, persistent snapshot, or production no-side-effect proof.

## 2. Safety invariants

1. Tests use deterministic synthetic owners, shops, menu identifiers and invoices only.
2. No connection string or service-role credentials are required for the contract suite.
3. Integration harness must reject any target except an explicitly named disposable local test database. Refuse non-local hosts and production/staging project references.
4. Tests run inside a rollback transaction or isolated schema/database; concurrency tests use independent connections to the disposable database.
5. No test calls `create_memo_transaction`, and no invoice adapter may invoke memo, stock, inventory movement, customer, due-ledger or legacy transaction-request writes.
6. QR minting is disabled by default. Tests must prove “no link/token/QR issued” in default configuration; public verification tests stay skipped until PO-12, PO-I06A and PO-I11 plus CH-3 security controls and PM authorization are available.
7. Draft is never labelled issued/verified and never gets a bill number.
8. Pending PO semantics are not supplied with guessed defaults.

## 3. Synthetic fixture catalogue

The fixture module exports:
- `owners.ownerA`, `owners.ownerB`: stable synthetic UUIDs.
- `shops.shopA1`, `shops.shopA2`, `shops.shopB1`: tenant-separated shops.
- `catalog.shopA1`: synthetic read-only menu references with IDs/names; no stock fields.
- `drafts.minimal`: one-line draft with PO-neutral identifiers and decimal strings.
- `headers.shopA1`: synthetic shop header values used only for immutable snapshot tests.
- `invoices.issuedA1`: sample immutable invoice snapshot; it does not assert disputed price-column display or payment semantics.
- `requests.sameKeySamePayload`, `requests.sameKeyDifferentPayload`, `requests.concurrentDuplicate`: idempotency test vectors.
- `legacyState.baseline`: counters for memos, stock movements, stock items and customer ledger entries used by no-side-effect assertions.

Fixture IDs are synthetic and contain no customer or production data.

## 4. Test IDs and intended assertions

| Test ID | Area | Assertion / oracle | Status before invoice implementation |
|---|---|---|---|
| IF-QA-001 | Tenant isolation | Owner A cannot read/issue/replay Owner B shop invoice; no invoice/header/sequence side effects on denial. | Fixture contract executable; RLS/API integration blocked |
| IF-QA-002 | Shop authorization | Auth required; requested shop must belong to authenticated owner before idempotency lookup/claim comparison. | Fixture contract executable; API integration blocked |
| IF-QA-003 | Numbering isolation | Sequential in-memory per-shop counter model only. | Model oracle; DB uniqueness/concurrency blocked |
| IF-QA-004 | Number allocation atomicity | No rollback/number-consumption claim from the fixture suite. | BLOCKED pending CH-3 disposable PostgreSQL transaction test |
| IF-QA-005 | Idempotent exact replay | In-memory model canonicalizes recursively sorted object keys; reordered equivalent JSON replays same model invoice. | Model oracle only; production canonicalization/API integration blocked |
| IF-QA-006 | Idempotency conflict | Same namespace + UUID with changed payload/shop/operation yields generic conflict and no number/side effects. | Oracle executable; API integration blocked |
| IF-QA-007 | Concurrent duplicate request | No concurrent behavior is asserted by this fixture suite. | BLOCKED pending CH-3 disposable PostgreSQL multi-connection harness |
| IF-QA-008 | Concurrent numbering | No distinct-request interleaving or concurrency behavior is asserted by this fixture suite. | BLOCKED pending CH-3 disposable PostgreSQL multi-connection harness |
| IF-QA-009 | Rollback | No partial-mutation rollback behavior is asserted by this fixture suite. | BLOCKED pending CH-3 transaction-level fault injection on disposable PostgreSQL |
| IF-QA-010 | Immutable snapshot | Static fixture independence model only; not persistence proof. | Model oracle only; database integration blocked |
| IF-QA-011 | No-side-effect guard | In-memory legacy-counter model remains unchanged; not evidence about actual tables/triggers. | Model oracle only; DB side-effect inspection blocked |
| IF-QA-012 | Draft vs issued | Draft has no issued number/time/events and is never represented as issued/verified; issued requires server commit. | Fixture contract executable; UI/API tests blocked |
| IF-QA-013 | QR disabled by default | Default configuration emits no public URL, token, MAC or QR payload; disabled verification returns fail-closed unavailable outcome. | Fixture contract executable; actual gate inspection blocked |
| IF-QA-014 | History/detail privacy | In-memory owner-filtered history/detail lookup returns no Owner A invoice to Owner B. | Model oracle only; API/RLS integration blocked |
| IF-QA-015 | PO policy gate | PO-dependent behavior stays disabled/parameterized; no expectation for PO-04/05/06/11 or L01–L04 until decisions exist. | Contract executable |
| IF-QA-016 | Legacy regression boundary | Invoice adapters have no dependency/call to memo transaction; invoice write path does not insert into legacy transaction_requests. | Static source guard executable when implementation appears |
| IF-QA-017 | Bangla mockup content | No source/rendered-mockup assertion in current executable suite. | Blocked pending CH-2 UI integration and source-backed content assertion |
| IF-QA-018 | Public QR PO gate | No production/public link issuance unless PO-12, PO-I06A and PO-I11 evidence and PM release flag all present. | Gate-oracle executable; production verification explicitly skipped |
| IF-QA-019 | Snapshot concurrency | No concurrent profile-update behavior is asserted by this fixture suite. | BLOCKED pending CH-3 disposable PostgreSQL two-session test |
| IF-QA-020 | Lost response retry | Retry uses same request UUID and exact payload; it recovers one committed invoice or remains unknown; no automatic new key. | Oracle executable; end-to-end network test blocked |

### PO-dependent cases intentionally not assigned expected product results
- **PO-02:** online/offline issuance promise. This package tests only that a local draft is not an issued bill; exact offline policy must be bound after PO response.
- **PO-04:** printed unit-price versus line-amount meaning.
- **PO-05:** quantity precision, units and repeated-item behavior. Use string inputs as fixture data; do not assert business acceptance range beyond already approved technical contract until PO decision.
- **PO-06:** menu fields/lifecycle/duplicate policy.
- **PO-11:** cancellation/revocation/correction/customer-visible status.
- **PO-12, PO-I06A, PO-I11:** public link lifetime, key-compromise risk acknowledgement and verification wording.
- **PO-L01–L04:** category, history, upload and tagline policy.
These tests remain marked `SKIP` or use a test parameter supplied by an explicit PO decision record. Do not hard-code CH-1 recommendations as approved values.

## 5. Commands and environment

Expected local commands once source files are committed:
```bash
npm test -- --test-reporter=spec
npm run verify:sql
npm run lint
npm run typecheck
npm run build
```

The QA contract tests themselves use Node's built-in `node:test` and `node:assert`; no new dependencies are required.

Database integration (NOT RUN by this QA package):
```bash
# Only after CH-3 provides a disposable local DB setup and a reviewed test-only connection guard:
npm run test:invoice:db
```
No script may default to a hosted Supabase project. A test-only DB harness must validate an explicit local host/database allow-list before opening a connection.

Browser tests: no command is claimed until CH-2 implementation provides selectors/route contracts and Playwright (or another approved runner) is available. No Render deployment or preview is performed by CH-4.

## 6. Execution results / limitations (truthful initial report)

- Branch/base identity: PASS — QA branch exists and is at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`.
- Invoice implementation discovered on QA branch: NOT PRESENT at preparation start — no invoice API/migration/routes/tables.
- Existing legacy test infrastructure: PRESENT — `npm test`, `npm run verify:sql`, lint/typecheck/build scripts exist.
- Fixture-model test execution: NOT RUN in this authoring environment; source changes do not constitute execution. Test cases are model-only and not implementation proof.
- IF-QA-007/008 concurrency: BLOCKED (explicit skipped Node tests); requires distinct request IDs, forced interleaving and independent DB connections in CH-3 harness.
- IF-QA-009 rollback: BLOCKED (explicit skipped Node test); requires failure injection after partial SQL mutations inside a disposable PostgreSQL transaction.
- IF-QA-014: owner-scoped history/detail model oracle added; actual API/RLS authorization remains BLOCKED.
- Database integration: SKIPPED — no invoice schema and no disposable local DB target was configured.
- Browser/UI tests: SKIPPED — no invoice UI implementation/browser harness is available on this branch.
- Lint/typecheck/build: NOT RUN in this preparation pass; dependencies/environment not inspected or installed.
- Staging/production DB: NOT ACCESSED.
- Production/customer data: NOT USED.
- Render: not provisioned/deployed; Issue #36 comment 6787378387 selects Render but explicitly does not authorize infrastructure or deployment.

## 7. Entry criteria for executable implementation integration

CH-3 coordination request (pending response): please provide the disposable local PostgreSQL harness owner/status, schema/RPC contract, transaction fault-injection seam, independent-connection concurrency mechanism, and safe test command. CH-4 has deliberately marked IF-QA-007/008/009 BLOCKED rather than substituting synchronous Map behavior for DB evidence.

CH-2 coordination request (pending response): please provide the invoice UI route/component contract, history/detail selectors, and a synthetic-data browser test entry point. CH-4 will then bind IF-QA-012/017/020 UI assertions to the delivered implementation; current fixture checks are not UI proof.

CH-3 must provide:
1. Invoice migration path and exact schema/RPC contract.
2. Server route/API names, request/response/errors and auth boundary.
3. Idempotency namespace/key and canonical payload version.
4. Test-only local DB bootstrap/rollback instructions.
5. A deterministic injection seam for transaction failure and concurrency tests.
6. QR disabled-default configuration key and observable unavailable response.
7. A written no-side-effect boundary for the legacy tables.

CH-2 must provide:
1. Draft/issued UI status selectors and route contract.
2. Accessible selectors for composer/review/history/detail.
3. A way to inject synthetic fixture data without Supabase hosted credentials.

CH-1 integrates the branches only after reviews and records any PO decision evidence.

## 8. Acceptance / sign-off rule

No PASS will be claimed for tenant isolation, RLS, atomic transaction, DB uniqueness, real concurrent requests, immutable persistence or no-side-effect guarantees until tests run against the actual invoice implementation with a disposable local PostgreSQL/Supabase target. Contract-oracle tests are necessary but not sufficient.

**CH-4 — QA & Test Engineer**