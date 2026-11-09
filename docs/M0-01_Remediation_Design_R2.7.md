# DokanTools — M0-01 Remediation Design R2.7

**Revision:** R2.7 — DT-002 targeted documentation remediation
**Exact base:** R2.6 commit `5df078b0246e9f66afb984ab3ec2665bb9f0a4ab`
**R2.6 PR:** https://github.com/Hasnat26/DokanTools/pull/12
**CH-4 review:** https://github.com/Hasnat26/DokanTools/pull/11
**CH-1 traceability:** `docs/reviews/CH1_DT-002_R2.6_F25_TRACEABILITY_2026-11-09.md`
**Implementation approval:** NOT GRANTED | **Pilot:** NO-GO | **Runtime/DB verification:** NOT EXECUTED

> Documentation/design only. R2.6 remains unchanged. R2.7 preserves the R2.5/R2.6 architecture and supersedes only the clauses listed below. No application code, SQL migration, database, environment, build, test, deployment, merge or pilot action is authorized or performed.

## 1. Authority and precedence

1. R2.7 is based on the exact R2.6 commit above; R2.6 remains preserved.
2. Non-conflicting R2.5/R2.6 clauses remain inherited. R2.7 replaces R2.6 §§3–6 and the ambiguous case definitions in §§7–8; it adds physical closure criteria to §9 and retains §10 governance.
3. Architecture retained: durable approval operation, trusted server-derived identity, immutable ledger/audit evidence, reciprocal deferred operation↔ledger references/triggers, customer-row balance mutex and canonical lock order.
4. No alternate mechanism is selected. If the physical schema cannot support the logical design, implementation is blocked and CH-1/CH-4 must re-review any alternative.
5. PO-01–PO-10 remain PENDING. CH-3 makes no product, permission, role, accounting or expiry decision.
6. Design closure, implementation, migration, tests, financial pilot, merge and deployment are NOT AUTHORIZED.

## 2. Normative test vocabulary

- B0: exact pre-action fixture snapshot. B1: final snapshot after all sessions commit or roll back.
- Δ=0: no change in relevant business row IDs/counts, event IDs/counts/digests, balances or stock.
- Trusted application identity is the server-derived authenticated subject. It is never taken from a request-body UUID, legacy source actor, caller GUC/JWT or caller-selected role.
- Source actor is historical source-system provenance only; it is not proof of authentication in DokanTools.
- Payer confirmation is a business assertion, distinct from the authenticated recorder/writer.
- Every test execution must pin one actor/session/role, fixture, action sequence, one expected domain outcome or SQLSTATE, and B0→B1 assertions. No “or”, “reject/ignore”, “if permitted” or “per policy” alternatives.
- Until an applicable PO decision exists, every PO-gated write has one current expected result: `DT_FEATURE_DISABLED`, Δ=0. A later post-decision test must be separately versioned; it is not an alternative result in the pre-approval test.

## 3. F25-01 / CH1-26-01 — Lifecycle event and actor cardinality

### 3.1 Event model

Each immutable lifecycle event logically contains `event_id UUID PRIMARY KEY`, `shop_id`, `operation_id`, `event_type`, `actor_kind`, nullable `actor_user_id` only as listed below, server `occurred_at`, and `payload_digest`. Physical table/column mapping remains a DBA dependency. `event_id` is globally unique. Logical uniqueness per operation is `(shop_id, operation_id, event_type, decision)`; decision is NULL except `APPROVAL_AUTHORIZED`, where it is exactly APPROVE or REJECT. Only one decision is permitted per operation. Events are append-only; corrections are new events referencing the old event.

| Event | Cardinality | Actor / exact rule |
|---|---:|---|
| `REQUEST_SUBMITTED` | exactly 1 per operation | `AUTH_USER`; server-derived creator |
| `SUBMISSION_CONFIRMED` | exactly 1 per operation | `AUTH_USER`; same creator subject |
| `APPROVAL_AUTHORIZED/APPROVE` | exactly 1 if POSTED, otherwise 0 | `AUTH_USER`; server-derived approver |
| `APPROVAL_AUTHORIZED/REJECT` | exactly 1 if REJECTED, otherwise 0 | `AUTH_USER`; server-derived reviewer |
| `POSTED` | exactly 1 if POSTED, otherwise 0 | `SYSTEM_ACTION`; `actor_user_id=NULL`; references APPROVE authorization event |
| `TERMINAL_CANCELLED` | exactly 1 if CANCELLED, otherwise 0 | `AUTH_USER`; authorized cancelling user |
| `TERMINAL_EXPIRED` | exactly 1 if EXPIRED, otherwise 0 | `SYSTEM`; `actor_user_id=NULL` |
| `TERMINAL_REJECTED` | exactly 1 if REJECTED, otherwise 0 | `AUTH_USER`; reviewer |

### 3.2 Transition event set and audit linkage

| Transition | Ledger rows | Lifecycle events | Audit rows | Required linkage |
|---|---:|---|---:|---|
| absent→pending | 0 | 1 REQUEST_SUBMITTED + 1 SUBMISSION_CONFIRMED | exactly 1 AUDIT_ACTION | audit references both event IDs and operation ID |
| pending→posted | exactly 1 | 1 APPROVAL_AUTHORIZED/APPROVE + 1 POSTED | exactly 1 AUDIT_ACTION | audit references both event IDs, ledger ID and operation ID |
| pending→cancelled | 0 | 1 TERMINAL_CANCELLED | exactly 1 AUDIT_ACTION | audit references terminal event ID and operation ID |
| pending→expired | 0 | 1 TERMINAL_EXPIRED | exactly 1 AUDIT_ACTION | audit references terminal event ID and operation ID |
| pending→rejected | 0 | 1 APPROVAL_AUTHORIZED/REJECT + 1 TERMINAL_REJECTED | exactly 1 AUDIT_ACTION | audit references both event IDs and operation ID |
| posted→any | 1 unchanged | 0 | 0 | `DT_INVALID_STATE` |
| terminal→any | 0 unchanged | 0 | 0 | `DT_INVALID_STATE` |

Rejection authorization is a reviewer decision, not approval to post. The separate TERMINAL_REJECTED event is mandatory. For cancel/reject/expiry/approval before the applicable PO decision, return `DT_FEATURE_DISABLED`; create no business lifecycle/audit rows; Δ=0. For all successful transitions, events, audit, operation state and ledger changes commit in one transaction. Any error rolls back all. Retry returns existing canonical IDs, never duplicate events.

## 4. F25-02 / CH1-26-02 — Ledger provenance

### 4.1 Exact identity rules

- New ledger `created_by_user_id` is NOT NULL and equals the server-derived authenticated writer subject.
- Legacy-only fields are `legacy_actor_provenance`, `source_actor_kind`, `source_actor_value`. They preserve source provenance; they never populate `created_by_user_id`.
- `legacy_actor_provenance` is exactly KNOWN or UNKNOWN for imported rows. KNOWN means a source actor value exists and is mapped by a reviewed source-format mapping; it does not prove an app account or authentication. UNKNOWN means absent, blank, invalid or unmappable; `source_actor_kind=UNKNOWN` and `source_actor_value=NULL`. No sentinel UUID.
- If actual schema constraints require a non-null `created_by_user_id` for legacy rows, import is blocked until DBA/PO approves legacy-only storage. Never fabricate an authenticated writer.

| Branch | origin/type | legacy_actor_provenance | source_actor_kind/value | created_by_user_id | Authenticated app identity |
|---|---|---|---|---|---|
| legacy due, actor mapped | LEGACY_IMPORT/DUE | KNOWN | exact mapped discriminator / exact raw source value | NULL in legacy-only storage | NOT REPRESENTED |
| legacy paid, actor mapped | LEGACY_IMPORT/PAID | KNOWN | exact mapped discriminator / exact raw source value | NULL in legacy-only storage | NOT REPRESENTED |
| legacy due, actor absent/invalid | LEGACY_UNCLASSIFIED/DUE | UNKNOWN | UNKNOWN / NULL | NULL | NOT REPRESENTED |
| legacy paid, actor absent/invalid | LEGACY_UNCLASSIFIED/PAID | UNKNOWN | UNKNOWN / NULL | NULL | NOT REPRESENTED |
| new memo due | MEMO/DUE | NULL | NULL / NULL | NN trusted subject | server-derived writer |
| new referenced manual due | MANUAL_REFERENCE/DUE | NULL | NULL / NULL | NN trusted subject | server-derived writer |
| new no-reference approval due | MANUAL_APPROVAL/DUE | NULL | NULL / NULL | NN trusted subject | server-derived writer |
| new manual payment | MANUAL_PAYMENT/PAID | NULL | NULL / NULL | NN trusted subject | server-derived writer |

Unmapped legacy actor values are quarantined unless preserved in an approved immutable source snapshot. They are never guessed into a known actor.

### 4.2 Manual payment confirmation

Three independent facts must be persisted:
1. Authenticated recorder/writer: `created_by_user_id` is the server-derived subject authenticated when the app write occurs.
2. Payer/receipt confirmer: logical fields `confirmation_actor_kind`, nullable `confirmation_actor_user_id`, and `confirmation_actor_label`. For an app-user confirmer, the ID is derived from that confirmation request's trusted auth context; caller-supplied UUID is prohibited. For a non-account external payer, kind=EXTERNAL_PARTY, user ID=NULL and bounded label is required.
3. Confirmation evidence: `confirmation_method` is a closed PO-approved enum; `confirmation_reference` is a non-secret stable reference or NULL only where the approved method requires none; `confirmed_at` is a server timestamp. An immutable confirmation-evidence record links ledger ID and audit event and stores confirmer identity/class, label if external, method, timestamp and evidence reference. No OTP, card/bank credential or secret is stored.

`independent_confirmation=true` plus timestamp alone is insufficient. The evidence record is mandatory. Until PO approves methods and confirmer classes, manual-payment write returns `DT_FEATURE_DISABLED`, Δ=0.

### 4.3 New versus legacy branch

- All new branches: `created_by_user_id` NN trusted subject; legacy actor fields NULL.
- Memo due: source memo FK NN and same-shop/customer; confirmation/approval fields NULL.
- Referenced manual due: source memo NULL; raw/normalized/reference-kind NN; confirmation/approval fields NULL.
- No-reference due: source memo/reference fields NULL; pending operation has zero ledger; posted ledger links exactly one approved operation/approver.
- Manual payment: memo/reference/approval-operation fields NULL; exactly one confirmation evidence record when enabled.
- Legacy rows: no current authenticated app actor is inferred; historic approval/confirmation identity remains NULL absent source evidence and separately approved archive design.

## 5. F25-03 / CH1-26-03 — Reciprocal operation/ledger invariant

### 5.1 Canonical key and columns

Canonical key: `K=(shop_id, operation_type, operation_id)`. Operation has `operation_id UUID PRIMARY KEY NOT NULL`, `shop_id NOT NULL`, `operation_type NOT NULL`, `customer_id NOT NULL`, `status NOT NULL`, and `ledger_entry_id` NULL for pending/cancelled/expired/rejected and NN for posted. It has UNIQUE `(shop_id, operation_type, operation_id)` and UNIQUE non-null `ledger_entry_id`.

Ledger has `ledger_id UUID PRIMARY KEY NOT NULL` and approval linkage fields `approval_shop_id`, `approval_operation_type`, `approval_operation_id`, `approval_ledger_id`. These four columns are all NULL for non-approval ledger rows or all NN for approval-linked rows; partial NULL is prohibited by CHECK. Unique constraints cover `(approval_shop_id, approval_operation_type, approval_operation_id)` and `approval_ledger_id`. `approval_ledger_id` must equal both operation `ledger_entry_id` and ledger `ledger_id`.

### 5.2 Reciprocal references / referential actions

1. Operation key `(shop_id, operation_type, operation_id)` is unique.
2. Ledger→operation composite FK references the three-column operation key, MATCH SIMPLE, DEFERRABLE INITIALLY DEFERRED, ON UPDATE RESTRICT, ON DELETE RESTRICT.
3. Operation→ledger FK references `ledger_entry_id → ledger_id`, DEFERRABLE INITIALLY DEFERRED, ON UPDATE/DELETE RESTRICT.
4. Ledger→specific operation/ledger FK references `(approval_shop_id, approval_operation_type, approval_operation_id, approval_ledger_id)` → `(shop_id, operation_type, operation_id, ledger_entry_id)` backed by a matching operation unique constraint, DEFERRABLE INITIALLY DEFERRED, RESTRICT on update/delete.
5. Posted iff exactly one ledger row matches K and reciprocal ledger IDs; non-posted iff zero linked rows and `ledger_entry_id=NULL`.
6. All four linkage fields are all-NULL or all-NN. Partial NULL is prohibited; MATCH SIMPLE is not relied on to accept a partial key.
7. No CASCADE. Deletion/relink is not recovery.

### 5.3 Absent-key arbitration and conflict/retry protocol

A row lock cannot serialize a key when no operation row exists. `SELECT FOR UPDATE` on a missing row is not arbitration. The unique key `(shop_id, operation_type, operation_id)` is the absent-key arbiter:
1. Competing sessions attempt INSERT for the same K.
2. PostgreSQL unique-index arbitration makes one contender wait on the uncommitted competing tuple.
3. If the first commits, the competing INSERT receives exactly 23505. The losing transaction is rolled back/ended; it then opens a fresh transaction and re-reads K.
4. Same canonicalization version and payload digest: return winner's operation/event IDs with no new event/ledger/audit/balance effect. Different digest/version: `DT_IDEMPOTENCY_CONFLICT`, no mutation.
5. If the first transaction rolls back, waiting INSERT can create the canonical row.
6. Retry always uses same K; never generate a replacement operation ID.

### 5.4 Deferred trigger / lock order

- DEFERRABLE INITIALLY DEFERRED constraint triggers exist on BOTH operation and ledger tables for INSERT, UPDATE and DELETE. UPDATE validates both OLD and NEW K.
- Each affected key is serialized by one transaction-level advisory lock derived from a documented stable 64-bit hash of full K. A collision may over-serialize only; it must not bypass validation.
- Every approved linkage writer obtains the same key lock before linkage mutation. Deferred validation sequence is: key advisory lock → operation row FOR UPDATE if present → ledger rows/key re-read.
- After locking, re-read operation and every ledger row for K. Absent operation requires count=0. Posted requires exactly one exact ledger ID and exact bound fields. Non-posted requires zero and NULL ledger_entry_id.
- Validate shop/type/operation/customer/amount/creator/approver/payload hash/canonicalization version/ledger ID. Duplicate linked row=23505; partial tuple=23514; absent parent=23503; logical state/binding mismatch=`DT_RECIPROCAL_LINK_INVALID`. Separate tests, never alternative outcomes.
- All writers use key lock → operation row → shop → membership → customer → ledger/event/audit/result. Deferred trigger uses the same key lock then operation row. If actual schema cannot support this order, DBA blocks implementation and sends it for CH-1/CH-4 review.
- A failed unique insert is never retried in the aborted transaction: rollback, fresh transaction, re-read K, compare digest/version. Direct write paths outside approved RPC owner are denied; unknown path means writers disabled.

### 5.5 NULL/cardinality truth table

| Operation state | ledger_entry_id | Matching ledger rows | Ledger link tuple | Result |
|---|---|---:|---|---|
| pending | NULL | 0 | none | valid |
| posted | NN exact ID | exactly 1 | all NN/exact | valid |
| cancelled | NULL | 0 | none | valid |
| expired | NULL | 0 | none | valid |
| rejected | NULL | 0 | none | valid |
| any | NULL | 1+ | linked | invalid/rollback |
| posted | NULL | 0 | none | invalid/rollback |
| posted | NN | 0 | none | invalid/rollback |
| non-posted | NN | any | any | invalid/rollback |
| any | any | — | partial NULL | 23514 |
| absent operation | — | 1+ | linked key | FK/deferred validation failure/rollback |

Logical contract only. Actual schema, composite FK feasibility, trigger semantics, advisory-lock derivation and deadlock behavior require DBA review.

## 6. F25-04 / CH1-26-04 — Deterministic lock refinements

### 6.1 Harness

Two independent PostgreSQL sessions in an isolated disposable DB. Before BEGIN set in both: `lock_timeout=2s`, `statement_timeout=10s`, `deadlock_timeout=200ms`, `idle_in_transaction_session_timeout=15s`. Positive barriers release within 5s. Capture backend PID, application_name, exact SQL, transaction start, pg_locks, pg_stat_activity, wait_event, monotonic barrier timestamps, SQLSTATE and commit/rollback confirmation. Every D/T case is separate; no test accepts 40P01 OR 55P03.

### 6.2 LOCK-01 / LOCK-02

**LOCK-01 — due then payment; both commit.** B0: C_LOCK01 due=0, paid=0. A: BEGIN; lock customer FOR UPDATE; signal A_LOCKED; wait B_WAITING; post due 100; COMMIT; signal A_COMMITTED. B: wait A_LOCKED; BEGIN; execute exact SQL `SELECT customer_id FROM customers WHERE shop_id=:shop AND customer_id=:customer FOR UPDATE`; capture B waiting; signal B_WAITING; after A_COMMITTED, lock returns; reread due=100/paid=0; post payment 70; COMMIT. B1: one due=100, one paid=70, net due=30, one operation/ledger/event/audit set per action; both commit.

**LOCK-02 — payment then due; both commit.** B0: C_LOCK02 due=0, paid=100. A locks customer FOR UPDATE, posts payment 60, COMMITs and signals. B executes the same exact customer SELECT FOR UPDATE while A holds it; after A commits, rereads paid=60 and posts due 30; COMMIT. B1: due=30, paid=60, net credit=30; one action/event set per session.

### 6.3 LOCK-N01–N03: separate deadlock and timeout schedules

PostgreSQL does not provide a portable session deadlock-priority control. D cases therefore do not claim a fixed victim; they have one outcome: exactly one 40P01, both transactions ROLLBACK, B1=B0. T cases pin Session B as victim and require exactly 55P03.

**LOCK-N01D — customer/customer deadlock:** B0 C_DA/C_DB due=100, paid=0. A BEGIN, SELECT C_DA FOR UPDATE, barrier A_HAS_DA, wait B_HAS_DB, SELECT C_DB FOR UPDATE. B BEGIN, SELECT C_DB FOR UPDATE, barrier B_HAS_DB, wait A_HAS_DA, SELECT C_DA FOR UPDATE. Expected exactly one 40P01; both rollback; no writes; B1=B0. 55P03 is failure.

**LOCK-N01T — customer timeout, B victim:** A BEGIN, SELECT C_TA FOR UPDATE, signal A_LOCKED and hold without requesting a B-held resource. B BEGIN and executes same SELECT. Expected B receives exactly 55P03 at 2s and rolls back; A commits after capture; fixture has no business writes; B1=B0. 40P01 is failure.

**LOCK-N02D — operation/customer inversion:** B0 OP_N02 pending, customer C_N02 unchanged, no ledger. A locks OP_N02 FOR UPDATE, signals A_HAS_OP, waits B_HAS_C then locks customer. B locks customer, signals B_HAS_C, waits A_HAS_OP then locks OP_N02. Expected exactly one 40P01; both rollback; B1=B0; victim unpinned. 55P03 is failure.

**LOCK-N02T — operation timeout, B victim:** A locks OP_T02 FOR UPDATE and holds without requesting a B-held resource. B executes the same exact SELECT FOR UPDATE. Expected 55P03 for B; B rollback; A commit; B1=B0. 40P01 is failure.

**LOCK-N03D — operation/ledger inverse order:** A takes mapped operation-side lock then requests mapped ledger-side row; B takes ledger-side lock then requests operation-side row. Exact table/column SQL is BLOCKED until DBA mapping exists. Once mapped, expected one 40P01, both rollback, B1=B0; no fixed victim. 55P03 is failure.

**LOCK-N03T — absent-key unique-index timeout, B victim:** B0 K absent. A inserts pending K and holds uncommitted. B attempts same insert and waits on unique-index arbitration. Expected exactly 55P03 for B; B rollback; A commits; fresh B transaction reads A's canonical operation/event IDs. B1 has exactly one operation and no duplicate ledger/event. 40P01 is failure.

For each LOCK-N01–N03 D and T execution, capture exact SQL per session, barrier order, waits/locks, session IDs, exact SQLSTATE, COMMIT/ROLLBACK order, and B0/B1 final snapshots. D and T are never combined into one pass criterion.

## 7. F25-05 / CH1-26-05 — T01–T63 deterministic audit

### 7.1 Audit rules applied to all 63 cases

- Retain inherited T01–T63 intent and IDs except T34 split below.
- Every PO-pending write: `DT_FEATURE_DISABLED`, Δ=0. Post-PO behavior must be separately versioned after signed decision.
- Constraint negatives isolate one violation: CHECK=23514; FK=23503; permission=42501; unique=23505; deadlock=40P01; timeout=55P03.
- Every test must pin actor/session/role, fixture, exact action, one result and B0/B1 query evidence. Remove “or”, “if permitted”, “per policy”, “reject/ignore” and multi-SQLSTATE outcomes.
- An inherited row missing an exact actor/action/query is BLOCKED from execution pending a versioned test manifest; it is not silently treated as deterministic or closed.

### 7.2 Required test replacements

| ID | Fixed actor and fixture | Action | One expected outcome | B0→B1 assertions |
|---|---|---|---|---|
| T31 | AUTH_USER U_T31_CREATOR; S_T31; customerless memo due=0; PO unapproved | Invoke memo-submit RPC | DT_FEATURE_DISABLED | memo/operation/ledger/business audit/movement all 0; balance/stock unchanged |
| T32 | DBA_TEST_SESSION; absent FK parent only; valid CHECK operands | one insert violating only composite FK | 23503 | target row absent; all other rows/aggregates unchanged |
| T34A | two sessions; balance=100; due=40/payment=120; due-first | A commits due 40; B rereads due=140 then posts 120 | both succeed | due=40, paid=120, net due=20; one action/event set each |
| T34B | new IDs, same amounts; payment-first | A attempts payment 120 against 100; B posts due 40 after A rejection commits | A gets DT_OVERPAY; B succeeds | no paid ledger for A; due=40 for B; net due=140; one rejection record |
| T41 | AUTH_USER U_T41_CREATOR; forged approver UUID only in request body; PO unapproved | submit forged approver_user_id | DT_FEATURE_DISABLED | no operation/ledger/approval event/business audit; forged ID not stored |
| T48 | DBA_READONLY; DB identity/schema revision pinned | read-only writer inventory and artifact creation | INVENTORY_CAPTURED (evidence capture, not app PASS) | schema/count/hash assertions; unknown writer count >0 means gate BLOCKED |

T34 as a single case is retired and replaced by T34A/T34B, with distinct fixtures, operation IDs and B0/B1 snapshots.

### 7.3 T48 inventory artifact

Artifact `M0-01-balance-writer-inventory-v1.json`, canonical UTF-8 JSON. Required fields: artifact_schema_version='1.0'; database_identity (host alias, database, PostgreSQL version, UTC capture time); schema_revision (migration version and schema/catalog digest); query_set (ordered query IDs and SHA-256); sorted writers array; inventory_count; unknown_writer_count; artifact_sha256 (canonical JSON digest with its own field omitted).

Each writer object contains writer_id, object_type, schema, object_name, signature, owner, security_definer, search_path, granted_roles, tables_written, write_operations, trigger_chain, caller_paths, definition_sha256, classification and review_status. Assertions: sorted and unique writer_id; all required keys; query/definition hashes 64 lowercase hex; inventory_count equals array length; artifact hash recomputes; unknown_writer_count recomputes. Any unknown writer means BLOCKED. Capture is read-only; it does not authorize privileged tests.

### 7.4 Remaining T01–T63

T01–T30, T33, T35–T40 and T42–T63 retain inherited R2.6 IDs/intent subject to §7.1. PO-dependent writes currently expect DT_FEATURE_DISABLED/Δ=0; response-loss uses same operation ID; direct SQL tests isolate one violation. Each row needs a completed manifest pinning actor/session/role, fixture, exact statement/RPC, query IDs and B0/B1. If not available, BLOCKED pending manifest amendment. R2.7 does not claim these unexpanded rows have been individually rewritten.

## 8. F25-06 / CH1-26-06 — Supplemental tests

All proposed/unexecuted. Synthetic identities are fixtures, not production roles.

### 8.1 Fixed fixtures

| Fixture | Identity/session | Authority |
|---|---|---|
| APP_CREATOR | U_APP_CREATOR_TEST | authenticated creator |
| APP_APPROVER | U_APP_APPROVER_TEST | no approval permission before PO decision |
| APP_UNAUTHORIZED | U_APP_UNAUTHORIZED_TEST | authenticated, unauthorized |
| APP_FORGED | U_APP_FORGED_TEST | request-supplied value only; never auth context |
| APP_SERVICE | app_service_test | no migration privilege/direct ledger DML |
| APP_FUNCTION_OWNER | app_function_owner_test | ordinary SECDEF owner; no migration membership |
| APP_MIGRATION_RUNNER | controlled_migration_runner_test | migration-only disposable test role |
| DBA_READONLY | dba_readonly_test | catalog read-only |
| DBA_TEST_SESSION | dba_test_session | isolated constraint negative only |
| PRIVILEGED_OWNER | privileged_owner_test | governance-only; never normal PASS |

### 8.2 PNV-01–35

Use S_PNV/C_PNV, fresh IDs, APP_CREATOR for authenticated writes, APP_FORGED only as supplied data. One field change per run.

| ID | Exact action | Single expected result | B0→B1 |
|---|---|---|---|
| PNV-01 | DBA_TEST_SESSION inserts ledger creator=NULL only | 23502 | no ledger; balance unchanged |
| PNV-02 | APP_CREATOR attempts direct write of forged created_by_user_id | 42501 | no ledger; trusted RPC writer is server-derived |
| PNV-03 | set approver on referenced due only | 23514 | no ledger |
| PNV-04 | set approved_at only | 23514 | no ledger |
| PNV-05 | set approval_method only | 23514 | no ledger |
| PNV-06 | set approval_operation_id only | 23514 | no ledger |
| PNV-07 | set hash/version only | 23514 | no ledger |
| PNV-08 | posted no-ref row omits approver only | 23514 | pending unchanged; no ledger |
| PNV-09 | omit approved_at only | 23514 | unchanged |
| PNV-10 | omit method only | 23514 | unchanged |
| PNV-11 | omit operation ID only | 23514 | unchanged |
| PNV-12 | omit hash/version only | 23514 | unchanged |
| PNV-13 | APP_CREATOR self-approval | DT_SELF_APPROVAL | pending; ledger=0 |
| PNV-14 | one amount binding mismatch | DT_RECIPROCAL_LINK_INVALID | full transaction rollback |
| PNV-15 | payload digest mismatch | DT_PROVENANCE_INVALID | no post/ledger |
| PNV-16 | non-memo row sets source_memo_id only | 23514 | no ledger |
| PNV-17 | memo due omits source memo | 23502 | no memo/ledger/stock mutation |
| PNV-18A | wrong-shop memo FK only | 23503 | no ledger |
| PNV-18B | wrong-customer memo FK only | 23503 | no ledger |
| PNV-19 | memo-origin paid only | 23514 | no ledger |
| PNV-20 | referenced due raw reference NULL only | 23514 | no ledger |
| PNV-21 | normalized reference NULL only | 23514 | no ledger |
| PNV-22 | reference kind NULL only | 23514 | no ledger |
| PNV-23 | exception=true only | 23514 | no ledger |
| PNV-24 | no-ref due raw reference non-NULL only | 23514 | no ledger |
| PNV-25 | no-ref reason code NULL only | 23514 | no ledger |
| PNV-26 | required confirmation false only | 23514 | no post |
| PNV-27 | manual payment has approval_operation_id only | 23514 | no paid row |
| PNV-28 | APP_MIGRATION_RUNNER fabricates legacy approval metadata | 42501 | legacy digest unchanged |
| PNV-29 | APP_CREATOR updates legacy creator | 42501 | legacy unchanged |
| PNV-30 | APP_SERVICE mutates posted amount | 42501 | ledger/balance unchanged |
| PNV-31 | APP_SERVICE reassigns posted shop | 42501 | ledger/balance unchanged |
| PNV-32 | invalid origin enum only | 23514 | no ledger |
| PNV-33 | one nullable CHECK operand per invocation | 23514 for required-null operand | only exact matrix-permitted NULL fixture accepted |
| PNV-34 | APP_SERVICE direct ledger DML | 42501 | no ledger/balance; owner variants governance-only |
| PNV-35 | APP_SERVICE mutates submitted payload/hash/link | 42501 | original digest/link unchanged |

Each PNV packet records operation, ledger, lifecycle event, audit IDs/counts/digests and aggregate due/paid/net B0/B1. Exact query IDs must be in the versioned test manifest before execution.

### 8.3 MIG-01–10

| ID | Actor and action | Single expected result | B0→B1 |
|---|---|---|---|
| MIG-01 | APP_SERVICE SET ROLE APP_MIGRATION_RUNNER | 42501 | role state unchanged |
| MIG-02 | APP_FUNCTION_OWNER SET ROLE APP_MIGRATION_RUNNER | 42501 | role state unchanged |
| MIG-03 | DBA_READONLY detects nested SECDEF migration reachability | gate BLOCKED, read-only | writers OFF; no DML |
| MIG-04 | APP_SERVICE grants ADMIN OPTION to runner | 42501 | role graph unchanged |
| MIG-05 | APP_FUNCTION_OWNER calls helper attempting legacy write | 42501 | legacy count/digest unchanged |
| MIG-06 | APP_FUNCTION_OWNER updates legacy origin/creator | 42501 | legacy unchanged |
| MIG-07 | APP_SERVICE spoofs migration GUC/JWT/arguments | DT_FORBIDDEN | no legacy write |
| MIG-08 | APP_SERVICE writes after credential revocation | 42501 | legacy unchanged |
| MIG-09 | PRIVILEGED_OWNER break-glass | GOVERNANCE-ONLY; no automated PASS | ticket, dual approval, SQL digest, before/after catalog, independent review |
| MIG-10 | DBA_READONLY inventory finds any unlisted path | gate BLOCKED; read-only | signed inventory; writers OFF if unknown |

MIG-05 uses one fixed function-owner identity, never a conditional runner alternative. That owner has no SET/INHERIT migration path. MIG-09 remains governance-only.

### 8.4 ADV-01–15

| ID | Actor/action | Single expected result | B0→B1 |
|---|---|---|---|
| ADV-01 | approval/revocation attempt before PO decision | DT_FEATURE_DISABLED | no membership/operation/ledger/audit change |
| ADV-02 | approval/cancel before PO decision | DT_FEATURE_DISABLED | no transition; ledger=0 |
| ADV-03 | approval/expiry before PO decision | DT_FEATURE_DISABLED | no state/event/ledger change |
| ADV-04 | due/payment before PO decision | DT_FEATURE_DISABLED | no ledger/balance change |
| ADV-05 | memo due/approval before PO decision | DT_FEATURE_DISABLED | memo/operation/ledger/stock/audit Δ=0 |
| ADV-06 | disposable DB inverse order A customer→operation; B operation→customer; lock_timeout=0; statement_timeout=10s | exactly one 40P01; both rollback; B1=B0 | lock graph; no partial writes |
| ADV-07 | APP_SERVICE migration escalation | 42501 | role graph unchanged |
| ADV-08 | APP_SERVICE audit UPDATE/DELETE | 42501 | audit digest/count unchanged |
| ADV-09 | one provenance field mutation per run | exact matching PNV outcome | no invalid ledger |
| ADV-10 | stock identity write pre-PO | DT_FEATURE_DISABLED | catalog/stock/movement/audit Δ=0 |
| ADV-11 | variant identity write pre-PO | DT_FEATURE_DISABLED | catalog/stock Δ=0 |
| ADV-12 | same-ID recovery read | canonical original ID; no new write | movement/quantity unchanged; new-ID attempt separately DT_FEATURE_DISABLED |
| ADV-13 | pending-stock identity update pre-PO | DT_FEATURE_DISABLED | identity/version unchanged |
| ADV-14 | customer collision write pre-PO | DT_FEATURE_DISABLED | no insert/merge |
| ADV-15 | failure-injection write pre-PO | DT_FEATURE_DISABLED before mutation | B1=B0 |

ADV-06 is deadlock-only; 55P03 is failure. Capture exact SQL per session, lock graph, exactly one 40P01, both explicit rollbacks, and final B0/B1.

### 8.5 LEG/CAT/CUST/AUD

These inherited families retain IDs/objectives. Current deterministic rules: every PO-gated mutation is DT_FEATURE_DISABLED/Δ=0; ordinary direct-write negative is 42501 for its named test role; read-only recovery/inventory requires exact query ID and artifact; legacy source_memo_id remains NULL without approved positive reclassification; privileged owner/table-owner/DBA/superuser is governance-only, never automated PASS. AUD-03 is BLOCKED until PO approves append-only correction policy. Any family case lacking named query IDs is BLOCKED from execution, not granted generic evidence PASS.

## 9. F25-07 / CH1-26-07 — DBA physical mapping remains pending

F25-07 is PENDING; this acceptance checklist is not the mapping artifact. DBA must provide a versioned signed actual-schema map for each logical field/branch: schema/table/column/type/nullability/default; PK/unique/index; FK columns/targets/MATCH/actions/deferrability; trigger event/timing/function; function owner/SECURITY DEFINER/search_path/body hash; role memberships; grants/default ACL; RLS; and implicit lock behavior.

Mapping acceptance must prove: (1) exact reciprocal pair is physically representable without duplicate pointers; (2) required unique keys/deferred FKs coexist and permit atomic transaction; (3) triggers cover both sides and INSERT/UPDATE/DELETE with OLD/NEW keys; (4) writers/triggers use same key-arbitration lock derivation; (5) no unresolved FK/unique/trigger/nested-function lock inversion; (6) actual ACL/owner/role graph denies ordinary direct writes and migration paths; (7) schema revision, migration version and catalog evidence are hashed and independently reviewable. DBA signs/dates; CH-1/CH-4 review exact artifact. Any failure keeps F25-07 OPEN and implementation NO-GO. No template-only closure.

## 10. F25-08 — PO/governance remains pending

F25-08 remains PENDING. PO-01–PO-10 remain pending unless a signed decision records selected option, rationale, owner, scope, effective date and evidence. R2.7 does not decide role/permission matrix, cancel/reject authority, expiry TTL/worker, reference policy, overpayment policy, catalog/stock/customer identity, payer confirmation methods/classes, audit correction policy or privileged-owner controls. Until the relevant decision exists, affected writes are DT_FEATURE_DISABLED/Δ=0. CH-3 fixtures are not PO decisions.

## 11. F25 disposition and change log

| Finding | R2.7 correction | Section | Disposition | Dependency |
|---|---|---|---|---|
| F25-01 / CH1-26-01 | event types, actor classes, uniqueness, exact transition event sets, audit links/cardinality, reviewer rejection event | §3 | ADDRESSED IN DOCUMENT; review pending | DBA event map; PO roles/expiry |
| F25-02 / CH1-26-02 | exact legacy KNOWN/UNKNOWN branches; separate source actor/authenticated writer; manual payer confirmer identity/auth/time/evidence | §4 | ADDRESSED IN DOCUMENT; review pending | DBA storage; PO confirmation policy |
| F25-03 / CH1-26-03 | reciprocal columns/NULL truth table; absent-key unique arbitration; failed-insert rollback/re-read; trigger key-lock order | §5 | ADDRESSED IN DOCUMENT; physical feasibility pending | DBA mapping |
| F25-04 / CH1-26-04 | separate 40P01 deadlock and 55P03 timeout cases; exact sessions/barriers/statements/commit/rollback/final snapshots | §6 | ADDRESSED IN DOCUMENT; unexecuted | DBA/runtime |
| F25-05 / CH1-26-05 | T31/T32/T34A/T34B/T41/T48 pinned; inventory artifact schema/count/hash; unexpanded cases explicitly blocked | §7 | PARTIALLY ADDRESSED; manifest gaps remain | PO/DBA/test manifest |
| F25-06 / CH1-26-06 | fixed supplemental fixtures/outcomes; PNV-02, MIG-05, ADV-06 and generic alternatives resolved; missing queries blocked | §8 | PARTIALLY ADDRESSED; query manifest gaps remain | DBA/query map/PO |
| F25-07 / CH1-26-07 | actual-schema acceptance evidence criteria | §9 | PENDING | DBA + CH-1 + CH-4 |
| F25-08 | PO/governance gates retained; no invented decision | §10 | PENDING | signed PO decisions |

### 11.1 R2.6 supersession map

- R2.6 §3 replaced by R2.7 §3.
- R2.6 §4 replaced by R2.7 §4.
- R2.6 §5 replaced by R2.7 §5.
- R2.6 §6 replaced by R2.7 §6.
- R2.6 §7 inventory inherited; R2.7 §7 supersedes ambiguous outcomes and adds audit/blocking rule.
- R2.6 §8 inventory inherited; R2.7 §8 supersedes ambiguous actors/outcomes and adds fixed current-state contracts.
- R2.6 §9 retained pending; R2.7 §9 adds actual-schema acceptance criteria.
- R2.6 §10 governance retained and reinforced by R2.7 §10.

## 12. Items not resolvable at documentation level

1. F25-07: actual schema/role/ACL/trigger/lock inventory unavailable; physical conformance cannot be asserted.
2. F25-08: PO decisions require authorized Product Owner evidence.
3. Advisory-lock derivation/feasibility and deadlock behavior require DBA review and later authorized runtime verification.
4. SQLSTATE expectations must be confirmed against actual constraints and RPC mapping in authorized environment.
5. Physical event/audit columns and linkage require DBA mapping.
6. T01–T30, T33, T35–T40, T42–T63 and LEG/CAT/CUST/AUD cases lacking exact actor/action/query remain BLOCKED until a versioned test manifest is complete. R2.7 does not claim they have been individually rewritten.
7. Runtime tests remain PROPOSED / NOT EXECUTED. No PASS is claimed.

## 13. Status and authorization

- R2.7 candidate prepared for CH-1 review, then CH-4 independent review.
- F25-01–F25-04: addressed in design text; independent review pending.
- F25-05–F25-06: partially addressed; residual manifest/query gaps explicitly BLOCKED.
- F25-07: PENDING actual DBA mapping and CH-1/CH-4 review.
- F25-08: PENDING explicit PO decisions.
- Design closure: NOT GRANTED; implementation approval: NOT GRANTED; financial pilot: NO-GO.
- Runtime/database verification: NOT EXECUTED. No builds, tests or QA executed.
- No application code, SQL, database, environment or repository runtime changes.
- No merge, deployment or main modification.
- Stop after R2.7 draft PR submission; await CH-1 review, then CH-4 review of exact commit.