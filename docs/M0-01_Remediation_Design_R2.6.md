# DokanTools — M0-01 Remediation Design R2.6
**Revision:** R2.6 — Focused CH-4 F25 remediation (documentation only)  
**Role:** CH-3 Backend & Security Engineer  
**Repository:** Hasnat26/DokanTools  
**Exact R2.5 base:** daeeb7ae8e1df9b51c1f474b3d34f215f83c8512  
**QA source:** CH-4 PR #11, exact head 207a196458d2e81ca3d50e3dde9f5ae648706449  
**Implementation approval:** NOT GRANTED | **Financial pilot:** NO-GO | **Runtime/database verification:** NOT EXECUTED

> Documentation-only. R2.6 supersedes R2.5 only for F25-01–F25-08 and lifecycle, provenance, reciprocal-link, lock, test, schema mapping and governance provisions. Other non-conflicting R2.5 provisions remain inherited. No application code, SQL migration, database, staging or production changes.

## 1. Authority, precedence and status

1. R2.5 exact base is the source baseline. CH-4 PR #11 findings F25-01–F25-08 are authoritative.
2. R2.6 §§3–10 replace conflicting R2.5 §§4–7, 11–13 and supplemental-test ambiguity.
3. R2.5 F22-01–F22-11 traceability is accepted by CH-4 and remains unchanged.
4. PO-01–PO-10 remain PENDING. CH-3 recommendations are not PO decisions.
5. Any PO-gated writer is DISABLED / NO-WRITE until signed PO decision, approved schema/ACL, CH-1/CH-4 review and runtime evidence.
6. This document does not grant design closure, implementation approval, pilot authorization, merge or deployment.

### Pre-approval behavior

For any PO-gated workflow, before approval the RPC returns stable DT_FEATURE_DISABLED (implementation may map to SQLSTATE P0001 with stable code/detail) and commits no operation, ledger, balance, stock/catalog/customer, movement or business audit changes. Security telemetry is permitted only if already approved and outside the business transaction. No client fallback, service-role bypass or temporary writer. Tests assert disabled/no-write, not inferred policy.

## 2. Definitions and error contract

- **Authenticated actor:** server-derived trusted auth subject; never caller-supplied UUID.
- **Submission confirmation:** acknowledgement of submitting immutable request; not approval or authentication.
- **Approval authorization:** server permission check at approval transaction’s linearization point.
- **Terminal actor:** user for cancel/reject, system for expiry; never fabricate user ID.
- **Terminal event:** immutable event for cancel/reject/expiry.
- **Audit event:** immutable action evidence; not interchangeable with lifecycle event.
- **Legacy candidate:** unverified import hint, not source FK/provenance.

Stable domain outcomes to freeze in implementation:
DT_FEATURE_DISABLED; DT_AUTH_REQUIRED; DT_FORBIDDEN; DT_SELF_APPROVAL; DT_IDEMPOTENCY_CONFLICT; DT_INVALID_STATE; DT_REFERENCE_CONFLICT; DT_PROVENANCE_INVALID; DT_RECIPROCAL_LINK_INVALID; DT_IDENTITY_CONFLICT; DT_STALE_VERSION; DT_RETRYABLE_LOCK.

Raw PostgreSQL SQLSTATE evidence:
42501 permission; 23514 CHECK; 23503 FK; 23505 unique; 55P03 lock timeout; 40P01 deadlock; 40001 serialization failure if produced. RPC mappings must retain raw SQLSTATE. Do not claim a particular SQLSTATE for application policy rejection unless implementation is pinned.

## 3. F25-01 — Total operation lifecycle field matrix

### 3.1 Logical fields

Identity: operation_id, shop_id, operation_type, customer_id.  
Immutable request: creator_user_id, canonical_payload, payload_sha256, canonicalization_version, hash_algorithm, amount, reason_code, reason_text, submitted_at, expires_at.  
Submission confirmation: submission_confirmed, submission_confirmation_method, submission_confirmed_at, submission_confirmation_actor_user_id.  
Approval: approver_user_id, approved_at, approval_authorization_event_id.  
Terminal: terminal_actor_kind, terminal_actor_user_id, terminal_reason_code, terminal_reason_text, terminal_at, terminal_event_id.  
Posting: ledger_entry_id, posting_event_id.  
Audit: request_event_id, audit_event_id, status.

Submission confirmation actor is the trusted authenticated submitter. It is not an approval actor and cannot prove authorization.

### 3.2 Exact state matrix

NN = NOT NULL; NULL = must be NULL; IMM = immutable; ENUM = approved finite enum.

| Field | pending | posted | cancelled | expired | rejected |
|---|---|---|---|---|---|
| operation_id | NN IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| shop_id | NN IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| operation_type | NN approved ENUM IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| customer_id | NN IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| creator_user_id | NN trusted subject IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| canonical_payload | NN IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| payload_sha256 | NN server recomputed IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| canonicalization_version | NN pinned IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| hash_algorithm | NN SHA256 ENUM IMM | same | same | same | same |
| amount | NN positive exact decimal IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| reason_code | NN request reason ENUM IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| reason_text | NULL (no free text in current contract) | NULL | NULL | NULL | NULL |
| submitted_at | NN server timestamp IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| expires_at | NN server timestamp + approved TTL IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| submission_confirmed | NN=true IMM | NN=true IMM | NN=true IMM | NN=true IMM | NN=true IMM |
| submission_confirmation_method | NN approved ENUM IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| submission_confirmed_at | NN server timestamp IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| submission_confirmation_actor_user_id | NN=creator trusted subject IMM | NN IMM | NN IMM | NN IMM | NN IMM |
| approver_user_id | NULL | NN trusted actor IMM | NULL | NULL | NULL |
| approved_at | NULL | NN server timestamp IMM | NULL | NULL | NULL |
| approval_authorization_event_id | NULL | NN unique event IMM | NULL | NULL | NULL |
| terminal_actor_kind | NULL | NULL | NN USER ENUM | NN SYSTEM ENUM | NN USER ENUM |
| terminal_actor_user_id | NULL | NULL | NN trusted actor | NULL | NN trusted actor |
| terminal_reason_code | NULL | NULL | NN cancel ENUM | NN expiry ENUM | NN reject ENUM |
| terminal_reason_text | NULL | NULL | NULL | NULL | NULL |
| terminal_at | NULL | NULL | NN server timestamp | NN server timestamp | NN server timestamp |
| terminal_event_id | NULL | NULL | NN unique event | NN unique event | NN unique event |
| ledger_entry_id | NULL | NN canonical ledger ID | NULL | NULL | NULL |
| posting_event_id | NULL | NN unique posting event | NULL | NULL | NULL |
| request_event_id | NN unique submission event | same ID | same ID | same ID | same ID |
| audit_event_id | NN submission audit | NN posting audit | NN terminal audit | NN terminal audit | NN terminal audit |
| status | pending ENUM | posted ENUM | cancelled ENUM | expired ENUM | rejected ENUM |

**PO fail-closed:** authority, expiry TTL, allowed cancel/reject actors and confirmation ENUM are PO-01/02/08/09 dependencies. Until decisions, approval/cancel/reject/expiry writers are disabled. This matrix is structural and does not allow alternative NULL layouts. Add approved enum values/TTL to a versioned decision artifact before implementation.

### 3.3 Transitions

| Transition | actor | state/ledger/events | outcome |
|---|---|---|---|
| absent→pending | authenticated creator | initialize pending fields; zero ledger; request + submission audit | submit only if workflow approved; otherwise disabled/no-write |
| pending→posted | authenticated approver, auth rechecked in same transaction | approval fields; exactly one ledger; approval/post/audit events | atomic transaction |
| pending→cancelled | authenticated authorized user | terminal USER fields; zero ledger; terminal + audit events | disabled until policy approved |
| pending→expired | system expiry actor | terminal SYSTEM; terminal user ID NULL; zero ledger; terminal + audit | server clock only; disabled until PO decision |
| pending→rejected | authenticated authorized reviewer | terminal USER; approval fields NULL; zero ledger | disabled until policy approved |
| posted→any | none | immutable | DT_INVALID_STATE |
| terminal→any | none | immutable | DT_INVALID_STATE |

Each lifecycle event has its own ID. Audit event references the action but is not the terminal/posting event. No actor is copied into another role field. All writes in a transition share one transaction.

## 4. F25-02 — Total typed ledger provenance matrix

### 4.1 Fields covered

ledger_id, shop_id, customer_id, direction/type, origin, amount, created_by_user_id, source_memo_id, reference_raw, reference_normalized, reference_kind, reference_exception, exception_reason_code/text, independent_confirmation/at, approval_operation_id/type/hash/canonicalization_version, approved_by_user_id/at/method, legacy_import_batch_id, legacy_snapshot_digest.

All new rows have ledger/shop/customer/type/origin/amount/creator NN; amount is positive exact numeric; direction determines due/paid. Non-memo source_memo_id NULL. New non-legacy writes have legacy batch/digest NULL.

### 4.2 Total matrix (every column represented)

| branch | type/origin | creator | source memo | raw/normalized/kind | exception/reason code/text | independent confirmation/at | approval operation ID/type/hash/version | approver/at/method | legacy batch/digest |
|---|---|---|---|---|---|---|---|---|---|
| memo due | due/MEMO | NN trusted actor | NN exact same-shop/customer memo FK | NULL/NULL/NULL | false/NULL/NULL | NULL/NULL (N/A) | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NULL/NULL |
| memo paid | PROHIBITED | — | — | — | — | — | — | — | — |
| referenced manual due | due/MANUAL_REFERENCE | NN trusted actor | NULL | NN raw/NN normalized/NN approved ref ENUM | false/NULL/NULL | true/NN server time | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NULL/NULL |
| manual no-ref due pending | due/MANUAL_APPROVAL | NN trusted creator | NULL | NULL/NULL/NULL | false/NULL/NULL | true/NN server time | NN op ID/type/hash/version | NULL/NULL/NULL | NULL/NULL |
| manual no-ref due posted | due/MANUAL_APPROVAL | NN trusted creator | NULL | NULL/NULL/NULL | false/NULL/NULL | true/NN server time | exact linked op ID/type/hash/version | NN trusted approver/NN/NN approved ENUM | NULL/NULL |
| manual payment | paid/MANUAL_PAYMENT | NN trusted actor | NULL | NULL/NULL/NULL | false/NULL/NULL | true/NN server time (payer confirmation) | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NULL/NULL |
| legacy due verified | due/LEGACY_IMPORT | source actor if verified; else NULL in legacy-only nullable field | NULL unless approved positive reclassification | NULL/NULL/NULL | false/NULL/NULL | NULL/NULL | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NN batch/NN SHA256 snapshot digest |
| legacy paid verified | paid/LEGACY_IMPORT | same typed actor rule | NULL unless approved positive reclassification | NULL/NULL/NULL | false/NULL/NULL | NULL/NULL | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NN batch/NN digest |
| unknown/ambiguous import | source direction preserved/LEGACY_UNCLASSIFIED | NULL with legacy_actor_provenance=UNKNOWN | NULL | NULL/NULL/NULL | false/NULL/NULL | NULL/NULL | NULL/NULL/NULL/NULL | NULL/NULL/NULL | NN batch/NN digest |

Legacy unknown actor uses nullable legacy actor + NOT NULL discriminator ENUM KNOWN/UNKNOWN; UNKNOWN requires actor NULL. It is never an auth principal. If schema cannot represent this, import is blocked; no sentinel UUID.

For every imported row, batch ID identifies an immutable batch and digest is SHA-256 over canonical pre-import source snapshot, including source ID and raw provenance. If snapshot cannot be reproduced/hashed, do not import into financial ledger; quarantine/archive under separate approved read-only workflow. No historical approval metadata is populated in current ledger. Historical approval requires separate approved typed archive/reclassification event.

Legacy source memo candidate goes only into non-authoritative candidate metadata. source_memo_id remains NULL absent positive proof and separately approved reclassification. Candidate cannot be used as FK or balance source.

### 4.3 Fail-closed branch rules

- Unknown origin/type: DT_PROVENANCE_INVALID, no insert.
- Missing batch/digest for legacy import: disabled/no-write.
- Schema cannot represent unknown actor: migration blocker; no fake actor.
- Memo source not proven: source_memo_id NULL.
- Memo paid: prohibited.
- Required confirmation/policy field unresolved: writer disabled/no-write.
- No HIST, false-or-NULL alternatives, unspecified sentinel, or unspecified legacy representation.

## 5. F25-03 — One normative reciprocal operation-ledger mechanism

### 5.1 Selected mechanism

**Only accepted design:** reciprocal DEFERRABLE composite FKs plus DEFERRABLE INITIALLY DEFERRED constraint triggers on both operation and ledger tables. No alternative trigger-only/RPC-only mechanism. If physical schema cannot support this, raise DBA/CH-1/CH-4 blocker; do not switch silently.

Key K=(shop_id, operation_type, operation_id).

1. Operation PK operation_id; UNIQUE(shop_id, operation_type, operation_id).
2. Ledger PK ledger_id.
3. Ledger approval tuple (approval_shop_id, approval_operation_type, approval_operation_id): all NULL for non-approval rows or all NN for approval-linked rows. Partial NULL tuple prohibited by CHECK.
4. UNIQUE on complete approval tuple; ordinary PostgreSQL multiple-NULL behavior is allowed only because tuple CHECK is all-or-none.
5. Ledger→operation composite FK references operation (shop_id, operation_type, operation_id), MATCH SIMPLE, DEFERRABLE INITIALLY DEFERRED, ON UPDATE RESTRICT, ON DELETE RESTRICT.
6. Operation ledger_entry_id NULL for pending/cancelled/expired/rejected; NN for posted; unique when non-NULL.
7. Operation→ledger FK references ledger_id, DEFERRABLE INITIALLY DEFERRED, ON UPDATE RESTRICT, ON DELETE RESTRICT.
8. Deferred validation checks exact reciprocal ID/key, including ledger ID; DBA must map one canonical physical linkage without duplicate competing fields.
9. No CASCADE. Delete/relink is not recovery.
10. Posted iff exactly one ledger row and reciprocal IDs match. Non-posted iff zero ledger and ledger_entry_id NULL.

### 5.2 Trigger contract

One reviewed trigger function; DEFERRABLE INITIALLY DEFERRED constraint trigger AFTER INSERT OR UPDATE OR DELETE on both operation and ledger tables.

- INSERT derives NEW key; DELETE derives OLD key; UPDATE validates OLD and NEW keys independently, deduplicating only identical keys.
- At commit, lock/re-read operation row FOR UPDATE; if absent, linked ledger is invalid. Operation unique-key arbitration is the absent-key serialization primitive.
- Re-read operation and linked ledger rows; validate state/cardinality and exact shop/type/id/customer/amount/creator/approver/hash/version/ledger ID binding.
- Posted: exactly one ledger, reciprocal ledger_entry_id and linked key match, bound fields match.
- pending/cancelled/expired/rejected: zero ledger, operation ledger_entry_id NULL.
- absent operation with ledger, count>1, key/ID mismatch, invalid status/link or bound-field mismatch aborts with DT_RECIPROCAL_LINK_INVALID / FK violation.
- ledger UPDATE changing old key validates both OLD and NEW keys. operation UPDATE changing shop/type/id/ledger_entry_id/status validates both keys.
- DELETE posted operation or ledger fails FK/trigger. Relink fails. Status-only transition to posted without ledger fails. Ledger insertion against pending operation fails. Posted→pending/terminal fails.
- duplicate ledger fails unique constraint. Trigger on only one table is invalid.

### 5.3 Concurrency and bypass control

- Posting RPC locks operation FOR UPDATE; validates trusted auth/authority; then customer FOR UPDATE; then writes ledger, posting/audit event and operation posted/link in one transaction.
- Every operation/ledger linkage transaction must lock operation before linkage changes.
- Deferred trigger re-locks/rechecks canonical operation at commit; unique/FK arbitration and row lock serialize competing pairs.
- Only approved posting RPC owner may write these tables. Auth/anon/client/service/import/ordinary function owner direct INSERT/UPDATE/DELETE denied.
- RPC owner is NOLOGIN, least privilege, not table owner/DBA/superuser; no migration-role SET/INHERIT/ADMIN path. SECDEF search_path pinned and objects schema-qualified. No caller GUC/JWT/argument bypass.
- Inventory every overload, view, trigger function, alternate RPC, service-role route, default ACL and nested SECDEF. Unknown path => writers disabled.
- Table owner/DBA/superuser is privileged residual; external ticket + dual approval + SQL digest + independent review. No trigger-proof claim.
- If physical schema/ownership cannot support this exact design: **NO IMPLEMENTATION** until CH-1/CH-4 re-review.

### 5.4 Mutation contract

| mutation | deterministic result |
|---|---|
| pending→posted with one linked ledger in same transaction | commit if authorized |
| posted status without ledger | deferred trigger abort |
| ledger without operation | FK/trigger abort |
| ledger linked to pending | trigger abort |
| duplicate ledger key | 23505; no second row |
| ledger relink K1→K2 | OLD and NEW key validation rejects |
| operation shop/type/customer/amount reassignment | immutable-field/DT_INVALID_STATE reject |
| posted ledger_entry_id change | reject |
| posted→pending/terminal | reject |
| posted ledger UPDATE/DELETE | reject |
| operation DELETE or ledger DELETE for posted pair | RESTRICT/trigger reject |
| non-posted terminal transition | only terminal RPC; zero ledger, terminal/audit events |
| rollback after intermediate writes | all transaction writes rollback |
| same ID/same payload retry | canonical result; no new event/balance |
| same ID/changed payload | DT_IDEMPOTENCY_CONFLICT; original unchanged |

## 6. F25-04 — Lock schedules and implicit-lock inventory

### 6.1 Harness

Two independent sessions, isolated fixture, fixed barrier control:
- lock_timeout=2s
- statement_timeout=10s
- deadlock_timeout=200ms
- idle_in_transaction_session_timeout=15s
Positive barriers hold at most 5s. Capture pg_locks, pg_stat_activity, wait_event, session ID and SQLSTATE. Timeout victim rolls back full transaction. For deadlock, exactly one victim gets 40P01; record victim. Retry only with same operation ID.

Canonical order inherited: operation/request → shop → membership → customer(s) sorted UUID → catalog/stock identities sorted UUID → ledger/movement/audit/result. Customer FOR UPDATE is balance mutex; shop KEY SHARE is not.

### 6.2 Numbered scripts

**LOCK-01 due then payment:** Seed C_A1 balance 0. A BEGIN, claim OP_L01A, lock customer FOR UPDATE, barrier; B BEGIN, claim OP_L01B, attempt same customer lock, capture wait; A posts due 100 and COMMIT; B resumes, reads balance 100, pays 70, COMMIT. Expected both commit, balance 30, exact two ledger/op/audit IDs.

**LOCK-02 payment then due:** Seed balance 100. A locks customer, pays 60, commits. B waits, reads 40, posts due 30. Expected final balance 70 and serial rows.

**LOCK-03 competing payments:** PO-04 pre-approval: both writers DT_FEATURE_DISABLED/no-write. Post-approval fixture balance=100, reject-overpay v1: A/B each request 70; A locks and commits; B resumes, reads 30, returns DT_OVERPAY and rolls back. One paid row=70; final balance=30.

**LOCK-04 distinct customers:** A/B hold shop KEY SHARE and customer locks for C_A1/C_A2 simultaneously; both pay 10 and commit. Expected balances 90 each; no shop-wide balance serialization.

**LOCK-05 memo due+stock vs payment:** A locks customer then stock, posts due 20/stock decrement 1, commits. B waits customer, then pays 10. Expected due20, paid10, balance10, stock4.

**LOCK-06 approval vs cancel:** A locks pending operation, posts+commits one ledger/events. B waits, resumes, sees posted, returns DT_INVALID_STATE; no terminal event.

**LOCK-07 approval vs membership revoke:** both use shop→membership lock. If approval acquires membership first, it commits before revocation; if revoke first, approval waits and returns DT_FORBIDDEN. Test fixes winner by lock order. Never post after revocation linearization.

**LOCK-08 restock:** stock=10. A locks stock, adds 5, commits; B waits, reads 15, adds 3. Expected 18, two distinct movement IDs.

**LOCK-09 catalog unique identity:** pre-PO both disabled. Post-PO fixed SKU fixture: A inserts/commits; B waits then DT_IDENTITY_CONFLICT. One catalog row/audit.

**LOCK-10 overlapping customers:** both lock customer UUIDs ascending. A commits then B resumes/commits. Repeat reversed input order; internal ordering remains ascending; no deadlock.

### 6.3 Negative schedules

**LOCK-N01 customer/shop inversion:** A locks customer then shop FOR UPDATE; B locks shop then customer. Barrier after first lock. Expected one victim 40P01 or 55P03 (record actual), victim rollback; rollback survivor after capture; final DB snapshot unchanged.

**LOCK-N02 membership/shop inversion:** A locks membership→shop; B shop→membership. Same settings/barrier; one 40P01/55P03 victim, both test tx rolled back; membership unchanged.

**LOCK-N03 stock/customer inversion:** A stock→customer; B customer→stock. One 40P01/55P03 victim; both rolled back after evidence; stock, ledger, operation, audit unchanged.

**LOCK-N04 duplicate operation claim:** A claims K and holds lock; B same K blocks at unique arbitration and must not lock customer. A commits. B re-reads canonical operation and returns replay/conflict. Exactly one operation/ledger/event/balance effect.

**LOCK-N05 terminal then delayed financial write:** A cancels/expires and commits. B tries later ledger/customer write under same operation key. Expected DT_INVALID_STATE/FK/trigger reject, zero ledger/balance effect.

### 6.4 Mandatory DBA implicit lock inventory

| object | DML/event | lock target/mode | explicit/implicit | wait/conflict pair | cascade/trigger/function path | definition/body hash | owner/ACL | reviewer/date |
|---|---|---|---|---|---|---|---|---|
| every FK | insert/update/delete | parent/child lock | implicit | sessions/SQLSTATE | cascade path | constraint definition | owner/grants | DBA |
| every PK/unique | insert/update/delete | index arbitration | implicit | duplicate contenders | trigger/RPC | index definition | owner/grants | DBA |
| every trigger | event | row/table locks | explicit/implicit | wait graph | called function chain | function hash | owner/SECDEF | DBA |
| every cascade/restrict | parent/child DML | lock target | implicit | blocking pair | recursive cascade | FK definition | ACL | DBA |
| every RPC/SECDEF | call/SQL | lock sequence | explicit/implicit | all waits | nested call chain | signature/body hash | owner/search_path | DBA |
| auth/membership | authorize/revoke/post | lock mode | explicit/implicit | race outcome | auth functions | function/policy hash | owner/ACL | DBA |

Unknown inventory entry blocks activation.

## 7. F25-05 — Deterministic T01–T63

### 7.1 Execution contract

Retain R2.5 synthetic IDs and canonical payload v1. Each test has fresh operation IDs; retry uses same ID. Version fixture manifest M0-01-fixture-v1.

- **Pre-PO:** gated write returns DT_FEATURE_DISABLED and Δ=0 for operation, ledger, audit business event, stock, catalog/customer, movement, balance.
- **Post-PO:** only after signed decision, pinned policy fixture, schema/ACL mapping and CH-1/CH-4 review.
- Payment post-approval fixture PO-04-fixture-reject-overpay-v1 rejects overpayment; this is test fixture, not policy approval.
- Reference fixture PO-03-fixture-customer-reference-v1; catalog fixture PO-06/10-fixture-shop-sku-variant-v1; customer fixture PO-07-fixture-shop-normalized-phone-name-v1 only after respective approval.
- Every test snapshots operation, ledger, audit IDs/count/digest, stock movement IDs, catalog/customer IDs/version, aggregate due/paid/balance and stock quantity.

### 7.2 T01–T63 one-result matrix

| ID | deterministic result | exact B0→B1 assertion |
|---|---|---|
| T01 | memo/stock gated; PRE disabled; POST approved memo due=100, qty decrement=1 | one memo/due/movement/audit per action; balance +100; stock 5→4; stable IDs |
| T02 | same payload replay | same IDs; row/event counts, balance, stock unchanged |
| T03 | same ID altered payload | DT_IDEMPOTENCY_CONFLICT; all original state unchanged |
| T04 | duplicate memo due | DT_REFERENCE_CONFLICT/23505; no second due; balance unchanged |
| T05 | referenced due PRE disabled; POST fixture accepted | PRE Δ=0; POST one due, source memo NULL, reference exact, balance +80, one posting event |
| T06 | duplicate reference | DT_REFERENCE_CONFLICT; no second ledger/audit |
| T07 | short UUID alias | never inferred as memo source; source_memo_id NULL |
| T08 | two concurrent payments 70 vs balance100 | PRE both disabled; POST one payment70, other overpay rejection; one paid row, balance30 |
| T09 | same operation simultaneous replay | one canonical ledger/event/balance effect; same result ID |
| T10 | same operation changed amount | DT_IDEMPOTENCY_CONFLICT; original unchanged |
| T11 | unknown legacy provenance as writer source | DT_PROVENANCE_INVALID; legacy unchanged; no new operation/ledger |
| T12 | cross-shop access | DT_FORBIDDEN; both tenants unchanged |
| T13 | direct ledger INSERT by app role | 42501; no ledger/balance |
| T14 | anonymous protected read | deny/zero rows per approved ACL; no protected data |
| T15 | fault after ledger insert before transaction completion | rollback; O/L/A/S/result Δ=0; balance/stock unchanged |
| T16 | opening movement committed, response lost | recovery same operation/movement; one movement, quantity once |
| T17 | precommit failure then same-ID retry | first attempt all writes absent; retry one operation/movement/event |
| T18 | catalog-only create | PRE disabled; POST one catalog/op/audit; stock/movement zero |
| T19 | ambiguous legacy hint | source_memo_id NULL; exact candidate string; amount/type/shop/customer unchanged |
| T20 | migration preflight | read-only schema/role/data inventory; no DB mutation |
| T21 | fresh DB migration rehearsal | blocked unless separate approval; disposable DB only; schema hash recorded |
| T22 | migration interruption | writers OFF; durable phase reconciled; no blind rerun; counts/digests captured |
| T23 | memo/ledger shop-customer mismatch | FK/RPC reject; memo/due/stock Δ=0 |
| T24 | customerless memo due>0 | DT_INVALID_STATE; memo/ledger/stock Δ=0 |
| T25 | concurrent stock writes | serialized stock FOR UPDATE; exact movement deltas; negative stock rejected |
| T26 | edit/cancel posted financial record | DT_INVALID_STATE/42501; original digest/balance unchanged; correction append only |
| T27 | due100-paid30+due20 aggregate | read returns 90; ledger count=3; no write |
| T28 | no-ref submission/approval | PRE disabled; POST split: pending O=1/L=0; approval O=posted/L=1/balance+50; exact events |
| T29 | self/unauthorized approval | DT_SELF_APPROVAL/DT_FORBIDDEN; pending, L=0, no post event |
| T30 | customerless memo due>0 | DT_INVALID_STATE; memo/ledger/stock Δ=0 |
| T31 | customerless memo due=0 | PRE disabled; POST only under pinned baseline permission; memo=1, ledger=0, stock exact |
| T32 | source/shop/customer mismatch | 23503/23514 or fixed domain reject; no invalid row |
| T33 | payments 60+50 against 100 | PRE disabled; POST one 60, second overpay reject, balance40 |
| T34 | due40 races payment120 on balance100 | PRE payment disabled. POST two fixed schedules: due-first => balance140 then pay120 accepted→20; payment-first => pay rejected then due→140 |
| T35 | reload recovery | canonical server status/IDs/hash; no new writes |
| T36 | opening response loss | same movement ID; one movement; replay no quantity delta |
| T37 | proven rollback retry | before retry all new transaction writes absent; after retry exactly one canonical result |
| T38 | catalog-only create/update | PRE disabled; POST catalog/op/audit only; stock/movement zero |
| T39 | legacy Baki display | unclassified label; source_memo_id NULL; no association/write |
| T40 | creator=approver | DT_SELF_APPROVAL; pending unchanged, approver NULL, L=0 |
| T41 | forged approver UUID | reject/ignore; stored approver only trusted subject on authorized post |
| T42 | unauthorized approver | DT_FORBIDDEN; pending, L=0, balance unchanged |
| T43 | payload/hash/version tamper | DT_IDEMPOTENCY_CONFLICT/DT_PROVENANCE_INVALID; no ledger |
| T44 | app/service/SECDEF migration bypass | 42501; no legacy mutation; writers OFF |
| T45 | all provenance field mutations | invalid branch rejects per PNV map; valid branch exact NULL/NN; no CHECK NULL pass |
| T46 | memo due/payment same customer | lock serialization; final balance = committed due-paid; memo/stock atomic |
| T47 | referenced due/payment | PRE disabled; POST customer lock serializes; reference uniqueness preserved |
| T48 | inventory all balance writers | unknown writer blocks; inventory artifact lists every writer; no activation |
| T49 | catalog reload | same catalog ID/version; one catalog/op/audit |
| T50 | stock commit response loss | one movement/quantity delta; canonical movement ID |
| T51 | new ID repeats opening | DT_IDENTITY_CONFLICT; opening movement count=1; quantity unchanged |
| T52 | duplicate stock/catalog identity | PRE disabled; POST fixture one canonical identity or DT_IDENTITY_CONFLICT |
| T53 | audit update/delete | 42501; old digest unchanged; correction append only if approved |
| T54 | customer creation response loss | PRE disabled; POST same ID returns canonical customer; one customer/op/event |
| T55 | expiry | PRE expiry writer disabled; POST server clock terminal expired; ledger=0, terminal+audit once |
| T56 | revoked migration role SET ROLE/write | 42501; role closure evidence; legacy unchanged |
| T57 | audit mutation through ordinary SECDEF | 42501; count/digest unchanged |
| T58 | overload/owner/ACL inventory | unknown path blocks; full signatures/owners/ACL/search_path evidence |
| T59 | failure at every write boundary | rollback; O/L/A/S/result/balance/stock equals B0 |
| T60 | local operation storage wiped | recovery lists all server unresolved IDs/status/digests; no new ID |
| T61 | catalog audit completeness | PRE disabled; POST direct DML denied, RPC atomic; no unaudited catalog row |
| T62 | customer identity collision | PRE disabled; POST PO-07 fixture DT_IDENTITY_CONFLICT; no merge |
| T63 | role/SECDEF boundary | ordinary roles denied; RPC owner scoped; owner/DBA/superuser privileged residual only |

### 7.3 Response-loss/rollback assertions

T15/T17/T37/T59 snapshot: operation ID/status/hash/link/event IDs; ledger ID/key/amount/provenance digest; audit IDs/count/digest; movement ID/action/delta; catalog/customer IDs/version; due total, paid total, net balance; stock quantity.

- Rollback: every transaction-owned business row absent (or prior canonical rows unchanged); no partial event/quantity/balance.
- Response lost after commit: one complete committed result; same-ID recovery returns exact IDs; no row/event/quantity/balance increment.
- Unknown timeout outcome: query/retry same operation ID; never generate replacement ID.

## 8. F25-06 — Supplemental test suites

All proposed/unexecuted. Record actor/session, exact command, SQLSTATE/domain result, B0/B1 and evidence query.

### PNV-01–35
- PNV-01 creator NULL: 23502/DT_PROVENANCE_INVALID; no ledger/balance.
- PNV-02 forged creator: reject/ignore; stored creator trusted auth subject.
- PNV-03–07 referenced due with each approval field populated: 23514; no ledger.
- PNV-08–12 approved posted branch each required approval field NULL: reject; pending/no ledger.
- PNV-13 creator=approver: DT_SELF_APPROVAL.
- PNV-14 operation-ledger shop/type/customer/amount mismatch: deferred DT_RECIPROCAL_LINK_INVALID; transaction rollback.
- PNV-15 hash mismatch: DT_PROVENANCE_INVALID; no post.
- PNV-16 non-memo source_memo_id set: 23503/23514; no ledger.
- PNV-17–18 memo source missing/wrong shop/customer: reject; memo/due/stock rollback.
- PNV-19 memo-origin paid: 23514; no ledger.
- PNV-20–22 referenced due raw/normalized/kind missing: reject.
- PNV-23 referenced due exception=true: reject.
- PNV-24 no-ref due reference fields populated: reject.
- PNV-25 required reason omitted: reject.
- PNV-26 required confirmation false/NULL/timestamp NULL: reject.
- PNV-27 manual payment due-reference/approval fields populated: reject.
- PNV-28 fabricated legacy approval: reject; legacy immutable.
- PNV-29 ordinary actor fills missing legacy creator: 42501.
- PNV-30–31 posted provenance/type/amount/customer/shop mutation: 42501/DT_INVALID_STATE.
- PNV-32 invalid enums: 23514.
- PNV-33 NULL truth-table sweep: only exact matrix-permitted NULL accepted.
- PNV-34 auth/service/import/ordinary SECDEF direct writes: 42501.
- PNV-35 submitted hash/link mutation: 42501/DT_INVALID_STATE.

### MIG-01–10
- MIG-01/02 auth/service SET ROLE migration: 42501; role unchanged.
- MIG-03 SECDEF has migration role path: preflight BLOCKED, writers OFF.
- MIG-04 app ADMIN OPTION grant: 42501; role graph unchanged.
- MIG-05 nested SECDEF migration helper: deny unless separately controlled runner identity verified; app/function owner never runner.
- MIG-06 function owner legacy mutation: 42501; legacy unchanged.
- MIG-07 GUC/JWT/argument spoof: 42501/DT_FORBIDDEN.
- MIG-08 post-revoke legacy write: 42501.
- MIG-09 table owner/superuser: governance-only; dual control, external ticket, SQL digest, independent review.
- MIG-10 DBA role/grant/default ACL/SECDEF inventory; unknown path blocks.

### ADV-01–15
- ADV-01 approval/revoke: shop→membership lock; revoke-first => DT_FORBIDDEN; approval-first commits before revoke.
- ADV-02 approval/cancel: operation lock; one transition; posted iff one ledger.
- ADV-03 approval/expiry: operation lock/server time; no dual transition.
- ADV-04 due/payment: customer lock; serialize under approved fixture.
- ADV-05 memo due/approval: pre-PO disabled; post-PO fixed fixture serializes; exact ledger/memo/stock snapshot.
- ADV-06 inverted lock: LOCK-N03; 40P01/55P03 victim, rollback.
- ADV-07 migration escalation: 42501; role graph unchanged.
- ADV-08 audit mutation: 42501; digest unchanged.
- ADV-09 provenance mutation: PNV rejection.
- ADV-10 stock identity duplicate: pre-PO disabled; post-PO one canonical/conflict.
- ADV-11 variant identity: pre-PO disabled; post-PO approved fixture.
- ADV-12 response loss/new-ID duplicate opening: same-ID replay; new ID DT_IDENTITY_CONFLICT; one movement.
- ADV-13 identity update with pending stock: DT_INVALID_STATE; version unchanged.
- ADV-14 customer collision: pre-PO disabled; post-PO DT_IDENTITY_CONFLICT; no merge.
- ADV-15 fault after ledger/audit/result/movement: full rollback.

### LEG-01–08
- LEG-01/02 auth source_memo_id insert/update: 42501; unchanged.
- LEG-03 service/SECDEF source update: 42501.
- LEG-04 migration hint: source_memo_id NULL; candidate retained unverified; balance unchanged.
- LEG-05 wrong-shop/nonexistent memo candidate: inert text only; no FK.
- LEG-06 auth candidate edit: 42501.
- LEG-07 correction: append candidate version; prior immutable.
- LEG-08 candidate verified without approved reclassification: DT_INVALID_STATE; no source FK/origin change.

### CAT-01–10
CAT-01 same ID/payload returns canonical catalog ID, one catalog/op/audit. CAT-02 changed payload DT_IDEMPOTENCY_CONFLICT. CAT-03 identity duplicate pre-PO disabled, post-PO unique arbitration/DT_IDENTITY_CONFLICT. CAT-04 opening response loss returns same movement ID, one movement. CAT-05 new ID duplicate opening DT_IDENTITY_CONFLICT. CAT-06 restock distinct movement/type and delta. CAT-07 restock replay same movement/no delta. CAT-08 identity update with pending stock DT_INVALID_STATE/version unchanged. CAT-09 stale expected version DT_STALE_VERSION/no write. CAT-10 lost local storage returns unresolved IDs/movement IDs; no auto-ID.

### CUST-01–05
CUST-01 same ID/payload canonical customer, one row/event. CUST-02 changed payload conflict. CUST-03 distinct ID collision pre-PO disabled, post-PO DT_IDENTITY_CONFLICT/no merge. CUST-04 cross-shop separate customer IDs. CUST-05 local loss canonical ID/status returned, no duplicate.

### AUD-01–05
AUD-01 auth/service audit UPDATE/DELETE 42501/digest unchanged. AUD-02 ordinary SECDEF 42501; privileged owner residual separate. AUD-03 approved correction appends event referencing old/actor/reason; old digest unchanged. AUD-04 direct catalog DML when audit completeness asserted 42501. AUD-05 DBA/superuser break-glass governance-only with dual approval/ticket/digest/review.

## 9. F25-07 — Mandatory DBA schema mapping

Before implementation, DBA creates versioned, signed mapping for every logical field in §§3–5:

**logical field → physical table.column → data type → nullability → index/FK → owner → ACL → trigger**

Required columns: logical field/branch; schema/table/column; PostgreSQL type/domain/enum/version; nullable/default; PK/unique/index definition/predicate/validity; FK columns/referenced columns/MATCH/actions/deferrability; table/sequence/function owner; grants/default ACL/role membership/SET/INHERIT/ADMIN paths; trigger name/event/timing/constraint/deferrability/function; function owner/SECDEF/search_path/body hash; RLS policies/bypass; migration version/schema hash; DBA/CH-1/CH-4 reviewers/date.

Coverage must include all operation and ledger fields; legacy UNKNOWN discriminator; reciprocal FK and deferred trigger; unique keys; every RPC/overload/SECDEF; direct DML ACL; catalog/customer/stock writers; implicit lock inventory.

Physical schema choice and DBA signoff remain dependencies. If circular FKs, tuple nullability, triggers, owner/ACL closure cannot support this exact design, record blocker and return to CH-1/CH-4. Do not claim implementation-ready and do not silently choose another design.

## 10. F25-08 — Governance and dependencies

PO-01–PO-10 remain **PENDING**. Every decision requires named owner, selected option, scope, rationale, effective date, evidence and CH-1 review. No CH-3 recommendation is approval.

Retain R2.5 migration handoff state machine and fail-closed controls:
- writers disabled through migration/role closure/independent verification;
- audit ordinary-role immutability; append-only corrections;
- owner/table-owner/DBA/superuser privileged residual externally governed;
- independent verifier must not hold migration credential or be migration runner;
- runtime tests not executed; test design is not evidence;
- CH-1/CH-4 review required.

## 11. Change log F25-01–F25-08

| Finding | R2.6 change | Sections | status |
|---|---|---|---|
| F25-01 | exact actor/confirmation/terminal/audit field-state matrix | §3 | CLOSED as documentation ambiguity; policy values gated |
| F25-02 | removed HIST/false-or-NULL alternatives; typed unknown legacy actor; exact batch/digest; source memo NULL absent reclassification | §4 | CLOSED as documentation ambiguity; DBA schema dependency |
| F25-03 | one reciprocal deferred FK + deferred trigger mechanism; OLD/NEW checks, concurrency, referential actions, ACL | §5 | CLOSED as design choice; physical/runtime pending |
| F25-04 | numbered lock scripts, barriers, timeout/victim/SQLSTATE/evidence and DBA inventory | §6 | CLOSED as test-spec ambiguity; not executed |
| F25-05 | T01–T63 one expected outcome, pre/post PO split, response-loss state assertions | §7 | CLOSED as test-spec ambiguity; not executed |
| F25-06 | supplemental commands/results/evidence | §8 | CLOSED as test-spec ambiguity; not executed |
| F25-07 | mandatory logical-to-physical mapping and signoff | §9 | PENDING DBA/CH-1/CH-4 |
| F25-08 | PO, migration, audit, privileged owner and verifier gates preserved | §10 | PENDING approvals/dependencies |

## 12. Self-review checklist

| Finding | disposition | evidence | remaining limitation |
|---|---|---|---|
| F25-01 | **CLOSED** | §3 total state matrix; confirmation/approval/terminal/audit distinct | approved enums/TTL/authority pending; no implementation approval |
| F25-02 | **CLOSED** | §4 total branches; typed legacy unknown; batch/digest exact; memo source null unless approved | physical legacy columns DBA dependency; unknown import disabled if unrepresentable |
| F25-03 | **CLOSED** | §5 one normative mechanism, trigger events/OLD-NEW/locking/ACL | physical schema/runtime proof pending; incompatibility blocks implementation |
| F25-04 | **CLOSED** | §6 numbered scripts, barriers, lock timeout, victim and final snapshots | not executed; DBA lock inventory unfilled |
| F25-05 | **CLOSED** | §7 T01–T63 deterministic outcomes and before/after assertions | all tests PROPOSED/NOT EXECUTED |
| F25-06 | **CLOSED** | §8 supplemental exact result/evidence contract | all tests PROPOSED/NOT EXECUTED |
| F25-07 | **PENDING DEPENDENCY** | §9 mapping template and required coverage | DBA/CH-1/CH-4 must map actual schema |
| F25-08 | **PENDING DEPENDENCY** | §10 all POs pending; governance gates retained | PO/DBA/security/verifier approvals absent |

**Self-review conclusion:** F25-01–F25-06 closed at documentation/test-specification level only. F25-07/F25-08 remain dependencies. This is not CH-4 acceptance, design closure, implementation readiness or pilot authorization.

## 13. Non-claims and stop condition

- Documentation only; no code, SQL migration, database, staging or production change.
- No runtime/database tests; no PASS claims.
- No schema/ACL/trigger/lock behavior verified.
- PO-01–PO-10 PENDING.
- Design closure NOT GRANTED; implementation approval NOT GRANTED; financial pilot NO-GO.
- No merge, deployment or main modification.
- Preserve PR #2–#11 histories.
- **Stop after R2.6 draft PR submission.**
