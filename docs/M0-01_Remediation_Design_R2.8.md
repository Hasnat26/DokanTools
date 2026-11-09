# DokanTools — M0-01 Remediation Design R2.8

**Revision:** R2.8 — DT-002 targeted corrections following CH-1 review
**Exact R2.7 base:** `e88bfad2472b75f5a7d74116db92af1b64030087`
**CH-1 review:** PR #14 comment https://github.com/Hasnat26/DokanTools/pull/14#issuecomment-6735432188
**R2.7 source:** `docs/M0-01_Remediation_Design_R2.7.md`
**Implementation approval:** NOT GRANTED | **Financial pilot:** NO-GO | **Runtime/DB verification:** NOT EXECUTED

> R2.8 is a new documentation version. R2.7 remains unchanged. The R2.5/R2.6 architecture is retained. This document is not SQL or implementation authority. No code, SQL, database, environment, build, test, deployment, merge or pilot action is performed or authorized.

## 1. Authority, precedence and change scope

1. R2.8 is based on exact R2.7 commit `e88bfad2472b75f5a7d74116db92af1b64030087`.
2. R2.7 remains unchanged and available for traceability.
3. R2.8 replaces R2.7 §§3.1–3.2, 4.1–4.3, 5.1–5.5, 6.1–6.4, 7.2–7.4, 8.2–8.5, 11 and 12 only to the extent specified below. All non-conflicting clauses are inherited.
4. Architecture remains durable approval operation, authenticated application identity, immutable events/ledger, reciprocal deferred operation↔ledger references, customer row balance mutex and fail-closed PO gating.
5. F25-05 and F25-06 remain PARTIALLY ADDRESSED. F25-07 and F25-08 remain PENDING.
6. No CH-4 review request is made. This draft is submitted for CH-1 review only.

## 2. CH1-27-01 — Event cardinality, disabled submissions and PostgreSQL uniqueness

### 2.1 Distinguish an attempted submission from a committed operation

An API request that is rejected by a PO-gated feature before operation creation is an **attempt**, not an operation lifecycle. For such an attempt:
- RPC returns `DT_FEATURE_DISABLED`.
- No operation row is created.
- No REQUEST_SUBMITTED, SUBMISSION_CONFIRMED, approval, terminal, POSTED or business AUDIT_ACTION event is created.
- Ledger, balance, stock and other business state are unchanged: Δ=0.
- Security telemetry, if separately approved, is not part of the operation lifecycle or business audit cardinality.

Only a committed absent→pending transition establishes an operation and starts lifecycle cardinality. For a created operation, exactly one REQUEST_SUBMITTED and exactly one SUBMISSION_CONFIRMED are required. These two records are in the same transaction as the pending operation and exactly one audit action. If transaction aborts, operation and both events and audit row all roll back. If a replay finds an already committed operation, return its canonical operation/event IDs; do not add records.

### 2.2 Event cardinality by persisted operation state

| Persisted state / outcome | Operation row | REQUEST_SUBMITTED | SUBMISSION_CONFIRMED | Transition events | Business AUDIT_ACTION | Ledger rows |
|---|---:|---:|---:|---:|---:|---:|
| feature disabled before insert | 0 | 0 | 0 | 0 | 0 | 0 |
| failed/rolled-back insert | 0 committed | 0 committed | 0 committed | 0 committed | 0 committed | 0 committed |
| pending | 1 | exactly 1 | exactly 1 | 0 terminal/post | exactly 1 submission audit | 0 |
| posted | 1 | exactly 1 | exactly 1 | 1 APPROVAL_AUTHORIZED/APPROVE + 1 POSTED | exactly 1 submission + 1 posting audit | exactly 1 |
| cancelled | 1 | exactly 1 | exactly 1 | 1 TERMINAL_CANCELLED | exactly 1 submission + 1 cancellation audit | 0 |
| expired | 1 | exactly 1 | exactly 1 | 1 TERMINAL_EXPIRED | exactly 1 submission + 1 expiry audit | 0 |
| rejected | 1 | exactly 1 | exactly 1 | 1 APPROVAL_AUTHORIZED/REJECT + 1 TERMINAL_REJECTED | exactly 1 submission + 1 rejection audit | 0 |

Each successful subsequent transition adds exactly one transition audit row; the initial submission audit remains. Thus a terminal/posted operation has two AUDIT_ACTION rows total: one for submission, one for its one terminal/post transition. Failed/disabled transition attempts add none.

### 2.3 Event uniqueness with non-null discriminator

Do not use a nullable `decision` column in a composite UNIQUE key as the logical uniqueness guarantee. PostgreSQL ordinary UNIQUE constraints normally treat NULL values as distinct, allowing multiple rows with NULL in that key position. The event model therefore uses a non-null normalized discriminator:
- `decision_key TEXT NOT NULL` with exact finite values `NONE`, `APPROVE`, `REJECT`.
- For REQUEST_SUBMITTED, SUBMISSION_CONFIRMED, POSTED, TERMINAL_CANCELLED, TERMINAL_EXPIRED and TERMINAL_REJECTED: `decision_key='NONE'`.
- For APPROVAL_AUTHORIZED: `decision_key='APPROVE'` or `decision_key='REJECT'` exactly.
- CHECK enforces that only APPROVAL_AUTHORIZED may have APPROVE/REJECT, and every other event type must have NONE.
- Unique constraint: `(shop_id, operation_id, event_type, decision_key)`; event_id remains global PRIMARY KEY.
- This defines one row for each event type/decision per operation without relying on NULL behavior. Physical constraint and CHECK mapping remain DBA-pending.

## 3. CH1-27-02 — Legacy-only NULL creator and new-row NOT NULL provenance

### 3.1 Two different row classes

The logical invariant is explicitly conditional on row class:
- **NEW row:** `created_by_user_id IS NOT NULL` and equals the server-derived trusted authenticated application subject. No caller-supplied or source-system value can satisfy it.
- **LEGACY_IMPORT row:** `created_by_user_id IS NULL` in the legacy-only representation, while source actor provenance is retained in the separate legacy fields below. This exception is not a general relaxation for new ledger rows.
- If a single physical table cannot represent the legacy-only NULL without weakening the new-row invariant, migration is blocked pending DBA mapping/approved schema separation. R2.8 makes no physical feasibility claim.

### 3.2 Explicit provenance branch matrix

| Branch | origin/type | creator rule | source actor fields | source memo | reference fields | confirmation | approval operation |
|---|---|---|---|---|---|---|---|
| legacy due, actor mapped | LEGACY_IMPORT/DUE | NULL; legacy-only exception | provenance=KNOWN; mapped source discriminator + exact raw value | NULL unless separately proven and approved reclassification | NULL in authoritative fields unless separately proven and approved | NULL unless historical evidence is archived separately | NULL; no synthesized approval |
| legacy paid, actor mapped | LEGACY_IMPORT/PAID | NULL; legacy-only exception | provenance=KNOWN; mapped source discriminator + exact raw value | NULL unless separately proven and approved reclassification | NULL | NULL unless historic confirmation evidence exists and is archived separately | NULL; no synthesized approval |
| legacy due/paid, actor absent or invalid | LEGACY_UNCLASSIFIED / preserved direction | NULL; legacy-only exception | provenance=UNKNOWN; source_actor_kind=UNKNOWN; source_actor_value=NULL | NULL | NULL | NULL | NULL |
| new memo-origin due | MEMO/DUE | NN trusted authenticated writer | all legacy actor fields NULL | NN exact same-shop/customer FK | NULL | NULL | NULL |
| new referenced manual due | MANUAL_REFERENCE/DUE | NN trusted authenticated writer | all legacy actor fields NULL | NULL | raw, normalized and kind all NN; validated under approved reference policy | NULL | NULL |
| new no-reference manual due, pending | MANUAL_APPROVAL/DUE | operation creator NN trusted subject | all legacy actor fields NULL | NULL | all NULL | confirmation metadata per approved submit contract | operation key exists; ledger row count=0 |
| new no-reference manual due, posted | MANUAL_APPROVAL/DUE | ledger creator NN trusted writer; operation creator retained separately | all legacy actor fields NULL | NULL | all NULL | not applicable unless separate PO-defined confirmation requires it | exact single reciprocal posted operation link; approver authenticated and authorized |
| new manual payment | MANUAL_PAYMENT/PAID | NN trusted authenticated recorder | all legacy actor fields NULL | NULL | all NULL | exactly one linked confirmation evidence record when enabled; PO-gated before decision | NULL |

KNOWN means a source actor value is present and mapped using a reviewed source-format mapping; it does not mean authenticated in DokanTools. UNKNOWN means absent/invalid/unmappable and is never represented by a fake UUID. Unmapped raw source must be preserved in the immutable import snapshot or quarantined. Source actor is never used as `created_by_user_id`.

### 3.3 Manual payment actor relationships

Manual payment carries distinct recorder and confirmer facts:
1. `created_by_user_id`: authenticated application writer, server-derived at ledger write.
2. `confirmation_actor_kind`: AUTH_USER or EXTERNAL_PARTY. For AUTH_USER, `confirmation_actor_user_id` is server-derived from the confirmation request's auth context and cannot be supplied by caller. For EXTERNAL_PARTY, user_id is NULL and a bounded confirmer label is required.
3. `confirmed_at`: server timestamp, not client timestamp.
4. `confirmation_method`: closed PO-approved enum; `confirmation_reference`: stable non-secret evidence reference or NULL only if the approved method requires none.
5. A single immutable confirmation evidence record links ledger ID and audit event. It contains actor kind/identity or external label, method, timestamp and reference. It stores no OTP or credentials.

Until PO approval specifies methods and allowed confirmer classes, manual-payment write returns DT_FEATURE_DISABLED, Δ=0. Confirmation evidence is not authentication of the recorder and cannot replace created_by_user_id.

## 4. CH1-27-03 — Composite reciprocal FK target and ledger-ID binding

### 4.1 Exact target candidate and required uniqueness

Operation key remains `K=(shop_id, operation_type, operation_id)`. Operation has:
- PRIMARY KEY `(operation_id)`;
- UNIQUE `(shop_id, operation_type, operation_id)`;
- `ledger_entry_id UUID NULL` for non-posted states and NOT NULL for posted;
- UNIQUE `(ledger_entry_id)` (multiple NULLs for non-posted rows are allowed by ordinary PostgreSQL UNIQUE semantics);
- **additional exact target constraint** UNIQUE `(shop_id, operation_type, operation_id, ledger_entry_id)`.

The four-column target uniqueness is required because the ledger-side four-column FK must reference an exact unique target tuple. The first three columns alone plus a separate UNIQUE on ledger_entry_id are not a substitute for declaring the exact four-column target in the FK definition. Physical validity/creation order remains DBA-pending.

### 4.2 Exact reciprocal references and purpose

| Reference | From | To | Purpose |
|---|---|---|---|
| FK-O-L | operation.ledger_entry_id | ledger.ledger_id | operation names one canonical ledger row |
| FK-L-O | ledger.(approval_shop_id, approval_operation_type, approval_operation_id) | operation.(shop_id, operation_type, operation_id) | ledger row names its approval operation key |
| FK-L-O-L | ledger.(approval_shop_id, approval_operation_type, approval_operation_id, approval_ledger_id) | operation.(shop_id, operation_type, operation_id, ledger_entry_id) | binds the ledger's own ledger_id through approval_ledger_id to that operation's ledger pointer |

For an approval-linked ledger row, `approval_ledger_id` MUST equal that same row's `ledger_id`. FK-L-O-L then proves the operation pointer equals the ledger row ID, not merely that some operation with K exists. FK-L-O establishes operation existence/key relationship; FK-L-O-L binds exact ledger row ID. These are distinct purposes, not competing logical links.

Both ledger references have their four approval linkage columns all NULL for non-approval ledger rows or all NN for approval-linked rows; partial NULL is rejected by an explicit CHECK. `MATCH SIMPLE` alone is not treated as a partial-NULL guard. All FKs are DEFERRABLE INITIALLY DEFERRED, ON UPDATE RESTRICT, ON DELETE RESTRICT; no CASCADE. Operation→ledger is also deferred. Posted iff one ledger row and exact reciprocal IDs; non-posted iff zero and ledger_entry_id NULL.

### 4.3 NULL uniqueness and insertion semantics

Non-posted operations have ledger_entry_id NULL. An ordinary UNIQUE over ledger_entry_id permits multiple NULL entries; this is intended because no ledger row is linked yet. The four-column operation target tuple is still unique because the first three columns are unique; the fourth NULL is not relied on for discrimination. Posted operations have a non-NULL ledger_entry_id and the same key remains unique. Ledger approval link tuple is all-null or all-not-null; only the latter participates in the FKs. These are logical expectations pending confirmation against target PostgreSQL version and physical definitions.

## 5. CH1-27-04 — Normative advisory-lock derivation and trigger consistency

### 5.1 Canonical lock input encoding

Advisory lock is a serialization aid, not a referential constraint. The normative logical input for one operation key is the exact UTF-8 byte sequence:

`DTK1|` + lowercase canonical UUID text for shop_id + `|` + lowercase canonical approved enum token for operation_type + `|` + lowercase canonical UUID text for operation_id.

UUID text is canonical 36-character hyphenated lowercase form. Enum token is the registered ASCII token, lowercased; no locale-sensitive transform. No whitespace, JSON serialization, host/database identifier or client-provided string is included. Encoding version prefix DTK1 prevents silent future changes.

### 5.2 Hash, bigint and lock namespace

- Hash algorithm: SHA-256 over the exact UTF-8 byte sequence above.
- Select the first 8 digest bytes in network/big-endian order as an unsigned 64-bit integer U.
- Map U into signed PostgreSQL bigint without implementation-dependent overflow: if U < 2^63, key2=U; otherwise key2=U−2^64. This yields the two's-complement signed bigint bit pattern.
- Use transaction-level two-int advisory lock `pg_advisory_xact_lock(key1, key2)` where key1 is fixed namespace integer `0x44544B31` interpreted as signed 32-bit (ASCII `DTK1`), key2 is the mapped digest value.
- The exact namespace is reserved to M0-01 operation-key serialization. No unrelated feature may use it. No session-level advisory locks.
- SHA-256 collisions are treated as lock collisions only: they may serialize unrelated keys (false contention) but may never be used to establish key equality or skip the full K equality check. Database constraints remain authoritative.

These rules specify an implementation-independent design target; PostgreSQL function availability, hash conversion correctness and DBA acceptance must be verified before implementation. CH-3 does not claim it is runtime-tested.

### 5.3 Multi-key ordering and trigger behavior

- Every statement/transaction that affects more than one K computes all key pairs before taking any key lock, deduplicates identical full K values, then sorts by the full canonical K byte sequence using unsigned bytewise lexicographic order.
- Acquire advisory locks in that sorted order, sequentially, all transaction-scoped. Never acquire an additional lower-sorted K after a higher-sorted K has been taken. If a later phase discovers a lower K, abort and restart the transaction with the complete sorted set.
- On UPDATE, both OLD and NEW K are included; DELETE uses OLD K; INSERT uses NEW K. A statement-level affected-key collection is required to establish sorted acquisition before row-level validation. If the chosen PostgreSQL trigger architecture cannot collect/sort statement keys before deferred validation, multi-key writes are blocked; do not fall back to arbitrary row-trigger order.
- Deferred constraint validation runs on both operation and ledger changes (INSERT/UPDATE/DELETE). For each affected K, trigger derives the exact DTK1 key, acquires the same namespace/key lock, locks the operation row FOR UPDATE if it exists, then re-reads the operation and all linked ledger rows and checks state/cardinality/exact ID/bound fields.
- All approved writer RPCs use the same shared lock-key specification, namespace and sorting algorithm; trigger and writer implementations must be generated from or independently test-verified against the same normative vectors. A mismatch is a release blocker.

### 5.4 Required lock test vectors (documentation only)

Before implementation, the DBA must produce a reviewed vector artifact with at least: one fixed K; exact UTF-8 hex input; full SHA-256 digest; first-eight-byte hex; unsigned U; signed key2; key1 namespace; final pair. Include UUIDs with leading zeros and digest values on both sides of 2^63. Each writer/trigger routine must reproduce every vector exactly. R2.8 does not fabricate vector outputs or claim hash correctness without the implementation's independent vector calculation.

Absent operation path: advisory key lock is acquired before trying operation-row FOR UPDATE. If no row exists, the lock still serializes same-K trigger/writer participants; then full-key unique-index arbitration remains the canonical insert arbitration. Trigger re-read sees zero/one committed operation/ledger and enforces cardinality. A row lock is never claimed to lock a nonexistent row.

## 6. CH1-27-05 — Lock harness timeout, deadlock survivor and LOCK-N03T sequencing

### 6.1 Per-test timeout profiles

Do not apply one global 2-second lock_timeout to all schedules. Test harness uses named profiles:

| Profile | lock_timeout | statement_timeout | deadlock_timeout | Purpose |
|---|---:|---:|---:|---|
| LOCK-POSITIVE | 0 (disabled) | 30s | 200ms | LOCK-01/02 positive barrier schedules; no lock timeout during intended waits |
| LOCK-DEADLOCK | 0 (disabled) | 30s | 200ms | D schedules; deadlock detector, not timeout, determines 40P01 |
| LOCK-TIMEOUT | 2s | 10s | 200ms | T schedules; controlled blocker, no cycle, expect 55P03 |

All profiles are set explicitly in both sessions before BEGIN. Positive barrier controller has a 5-second barrier watchdog; it is not the SQL lock_timeout. If the watchdog expires, harness aborts both sessions and marks the execution NOT REPRODUCED, not a pass. `lock_timeout=0` means disabled for that test profile only.

### 6.2 Positive schedules and evidence

LOCK-01/LOCK-02 use LOCK-POSITIVE. Each session captures backend PID, application_name, transaction ID, exact lock statement, lock wait start/end, barrier messages with monotonic timestamps, commit timestamp, and SQLSTATE. A barrier wait is not itself a DB lock timeout. Final B1 is captured only after both sessions report COMMIT. If either statement raises any SQLSTATE, both transactions are explicitly rolled back and the case fails; no alternate result.

### 6.3 Deadlock victim and survivor sequence

LOCK-N01D/N02D/N03D and ADV-06 use LOCK-DEADLOCK. The victim receives 40P01 and PostgreSQL aborts that transaction's current transaction block. The survivor is NOT assumed automatically rolled back. Required sequence:
1. Capture first error: session ID, exact failed SQL, SQLSTATE 40P01, pg_locks/pg_stat_activity wait graph and monotonic time before any cleanup.
2. Signal survivor controller that deadlock has been detected. Do not execute new business SQL in survivor.
3. Issue explicit ROLLBACK in victim session (defensive cleanup; record result).
4. Issue explicit ROLLBACK in survivor session. Do not COMMIT survivor and do not allow it to continue application action.
5. Confirm both sessions are idle/no open transaction and capture B1 snapshots, event counts and aggregates.
6. Expected outcome for these graph tests: exactly one 40P01, both explicit rollbacks, B1=B0. Any timeout SQLSTATE, second unexpected error, missing rollback or non-zero business delta is failure/NOT REPRODUCED.

### 6.4 Timeout schedules

LOCK-N01T/N02T/N03T use LOCK-TIMEOUT. Blocker A holds the specific resource and does not request any resource held by B, so no deadlock cycle exists. B receives exactly 55P03 after the 2-second lock timeout and explicitly ROLLBACKs. Capture error/session/SQL/locks/wait graph before rollback, then B rollback, then A's instructed COMMIT or ROLLBACK, and finally B1. No 40P01 alternative.

### 6.5 LOCK-N03T exact sequence

- B0: K absent; capture operation/event/ledger counts and key query result.
- A sets LOCK-TIMEOUT; BEGIN; INSERT pending operation K; retain uncommitted; signal A_INSERTED_UNCOMMITTED.
- B sets LOCK-TIMEOUT; BEGIN; attempt same INSERT K. Wait on unique-index conflict arbitration.
- At 2 seconds B receives 55P03. Capture B's SQLSTATE and wait state before cleanup; B explicitly ROLLBACKs.
- A then COMMITs. Capture successful commit and canonical operation/event IDs.
- B opens a NEW transaction after A's commit and performs SELECT by full K; B does not retry INSERT.
- B1: exactly one operation, exactly the one canonical submission event set, zero duplicate ledger; loser read IDs/digest equal A's. If A does not commit or B re-reads before A commit, execution is invalid/NOT REPRODUCED.

## 7. CH1-27-06 — T34B persistence, T48 evidence semantics and proposed SQLSTATEs

### 7.1 T34B rejection is a persisted domain result, not a failed financial posting

T34B is the payment-first schedule against balance 100 with payment request 120, followed by due 40. A's payment attempt is rejected as `DT_OVERPAY` after customer lock and fresh aggregate read. The payment ledger row, posted operation and POSTED event are not created. The rejection is nevertheless a committed workflow outcome for the identified request:
- The request operation row, if the approved workflow creates one before evaluation, transitions to REJECTED with reason code OVERPAY; otherwise the request remains uncreated under PO-gated current behavior. Which of these models is used requires explicit PO workflow approval; before approval, current T34B is `DT_FEATURE_DISABLED`, Δ=0, and no rejection record.
- For an approved post-decision T34B fixture, exact selected model must be pinned in the manifest. If an operation row exists: one terminal rejection event and one business AUDIT_ACTION persist atomically; ledger rows=0; balance effect=0; the transaction commits the rejection result. There is no rollback of the rejection record.
- Session B posts due 40 in a separate transaction after A's rejection transaction commits. Final financial ledger contains due 40 only; paid ledger=0; net due=140.
- A transaction rollback is reserved for infrastructure/constraint failures before the rejection outcome is committed. It is not the normal DT_OVERPAY behavior.

Current pre-PO test outcome is unambiguously `DT_FEATURE_DISABLED`, Δ=0, no request/rejection/business audit record. The post-PO behavior above is a design proposal pending PO confirmation and is NOT an alternate current test result.

### 7.2 T48 is evidence capture, not a database test PASS

T48 is reclassified as `READ_ONLY_EVIDENCE_CAPTURE`, not an executable application test and not a PASS. Its output is `CAPTURED` only when the inventory artifact is successfully serialized and its structural/hash checks recompute. Gate disposition is separately:
- `BLOCKED` when unknown_writer_count > 0, inventory incomplete, query hashes missing, or actual schema/role catalog evidence unavailable.
- `REVIEW_REQUIRED` when structurally complete with unknown_writer_count=0; DBA/CH-1/CH-4 must review the exact artifact.
- T48 never sets a runtime-test PASS flag and never authorizes writer activation.

Keep the R2.7 artifact schema. `artifact_sha256` is SHA-256 over canonical UTF-8 JSON with `artifact_sha256` omitted. `inventory_count` equals writers array length; all IDs unique/sorted; unknown_writer_count equals count of UNKNOWN classifications; every writer's definition hash and every query hash is 64 lowercase hexadecimal characters.

### 7.3 SQLSTATE expectations remain proposed

R2.8 preserves SQLSTATEs as proposed test expectations only, pending DBA mapping and authorized runtime confirmation. In particular, PNV-17 23502 and PNV-18A/B 23503 are NOT guaranteed by this document: actual constraint presence, validation order and RPC exception mapping determine the observed result. Before the DBA map exists, those cases are `PROPOSED_EXPECTATION`, NOT EXECUTED. After mapping, DBA confirms the single violated constraint and pins the exact SQLSTATE. If the physical schema produces another code, revise the test specification before execution; do not accept a code set or retroactively call it passed.

## 8. CH1-27-07 — Explicit blocked LEG/CAT/CUST/AUD manifest

### 8.1 Manifest status rule

All cases below are inherited proposed cases. Their family-level wording in R2.7 is not sufficient to execute them. Status for each is `BLOCKED_MANIFEST_INCOMPLETE`; none is CLOSED, PASS or executed. Exact query IDs are currently NOT ASSIGNED. Each requires a versioned manifest row with fixed fixture, actor/session/role, exact command/action, one expected outcome, B0 query ID, B1 query ID and evidence artifact definition.

### 8.2 LEG-01–LEG-08

| Case | Inherited action | Current status | Missing query/evidence IDs |
|---|---|---|---|
| LEG-01 | Auth role attempts INSERT of legacy source_memo_id | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q01 before/after ledger/candidate and role ACL query NOT ASSIGNED |
| LEG-02 | Auth role attempts UPDATE source_memo_id | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q02 source linkage/digest query NOT ASSIGNED |
| LEG-03 | Service/SECDEF source-link update attempt | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q03 function owner/SECDEF/ACL and ledger digest query NOT ASSIGNED |
| LEG-04 | Migration preserves historical hint as candidate only | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q04 candidate counts/digest/source_memo_id NULL query NOT ASSIGNED |
| LEG-05 | Wrong-shop/nonexistent memo candidate remains inert | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q05 candidate row and no-FK/balance query NOT ASSIGNED |
| LEG-06 | Auth role attempts candidate edit/status change | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q06 candidate digest/permission query NOT ASSIGNED |
| LEG-07 | Candidate correction appends superseding candidate | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q07 old/new candidate IDs and append-only evidence query NOT ASSIGNED |
| LEG-08 | Candidate verification attempted without approved reclassification | BLOCKED_MANIFEST_INCOMPLETE | LEG.Q08 origin/source_memo_id/balance query NOT ASSIGNED |

### 8.3 CAT-01–CAT-10

| Case | Inherited action | Current status | Missing query/evidence IDs |
|---|---|---|---|
| CAT-01 | Same operation ID/payload catalog create returns canonical ID | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q01 catalog/op/audit ID query NOT ASSIGNED |
| CAT-02 | Same ID with changed payload conflicts | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q02 original digest/state query NOT ASSIGNED |
| CAT-03 | Duplicate catalog identity arbitration | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q03 unique identity/duplicate count query NOT ASSIGNED |
| CAT-04 | Opening stock response-loss recovery | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q04 movement ID/quantity query NOT ASSIGNED |
| CAT-05 | New ID attempts duplicate opening stock | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q05 opening movement count/quantity query NOT ASSIGNED |
| CAT-06 | Restock is distinct movement type/delta | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q06 movement type/delta/quantity query NOT ASSIGNED |
| CAT-07 | Restock same-ID replay has no extra delta | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q07 movement ID/count/quantity query NOT ASSIGNED |
| CAT-08 | Identity update while stock action pending | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q08 catalog version/pending operation query NOT ASSIGNED |
| CAT-09 | Stale expected version is rejected | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q09 version/state/digest query NOT ASSIGNED |
| CAT-10 | Local loss returns unresolved server IDs | BLOCKED_MANIFEST_INCOMPLETE | CAT.Q10 unresolved operation/movement ID query NOT ASSIGNED |

### 8.4 CUST-01–CUST-05

| Case | Inherited action | Current status | Missing query/evidence IDs |
|---|---|---|---|
| CUST-01 | Same ID/payload returns canonical customer | BLOCKED_MANIFEST_INCOMPLETE | CUST.Q01 customer/op/event ID query NOT ASSIGNED |
| CUST-02 | Same ID with changed payload conflicts | BLOCKED_MANIFEST_INCOMPLETE | CUST.Q02 original payload digest/state query NOT ASSIGNED |
| CUST-03 | Different-ID identity collision; no merge | BLOCKED_MANIFEST_INCOMPLETE | CUST.Q03 customer identity/collision query NOT ASSIGNED |
| CUST-04 | Same identity in different shops remains shop-scoped | BLOCKED_MANIFEST_INCOMPLETE | CUST.Q04 customer IDs/shop FK query NOT ASSIGNED |
| CUST-05 | Local loss returns canonical customer identity | BLOCKED_MANIFEST_INCOMPLETE | CUST.Q05 customer/op/event recovery query NOT ASSIGNED |

### 8.5 AUD-01–AUD-05

| Case | Inherited action | Current status | Missing query/evidence IDs |
|---|---|---|---|
| AUD-01 | Auth/service attempts audit UPDATE/DELETE | BLOCKED_MANIFEST_INCOMPLETE | AUD.Q01 audit count/digest/ACL query NOT ASSIGNED |
| AUD-02 | Alternate SECURITY DEFINER audit mutation attempt | BLOCKED_MANIFEST_INCOMPLETE | AUD.Q02 function owner/SECDEF/search_path/ACL query NOT ASSIGNED |
| AUD-03 | Append-only correction references prior event | BLOCKED_PO_AND_MANIFEST | PO correction decision absent; AUD.Q03 old/new event linkage query NOT ASSIGNED |
| AUD-04 | Direct catalog DML denied where audit completeness is claimed | BLOCKED_MANIFEST_INCOMPLETE | AUD.Q04 catalog ACL/row/audit count query NOT ASSIGNED |
| AUD-05 | DBA/superuser break-glass governance evidence | BLOCKED_GOVERNANCE_ONLY | AUD.Q05 external ticket, dual-approval and independent review evidence NOT ASSIGNED |

### 8.6 Manifest totals and closure disposition

| Family | Total inherited cases | Individually enumerated here | Blocked | Query IDs assigned | Closed/PASS |
|---|---:|---:|---:|---:|---:|
| LEG | 8 | 8 | 8 | 0 | 0 |
| CAT | 10 | 10 | 10 | 0 | 0 |
| CUST | 5 | 5 | 5 | 0 | 0 |
| AUD | 5 | 5 | 5 | 0 | 0 |
| TOTAL | 28 | 28 | 28 | 0 | 0 |

Manifest interpretation: every inherited case ID is now enumerated and its missing query/evidence ID identified by a proposed stable placeholder (for example LEG.Q01) whose actual query definition is NOT ASSIGNED. A placeholder is not a query ID assignment. All 28 remain blocked; none is considered closed. Fixture/action/error details must be added in the next versioned test-manifest package before execution. F25-06 therefore remains PARTIALLY ADDRESSED.

## 9. F25 disposition matrix (updated)

| Finding | R2.8 disposition | Evidence in this document | Remaining dependency |
|---|---|---|---|
| F25-01 | ADDRESSED IN DOCUMENT; CH-1 review pending | §2 committed-operation cardinality, disabled attempt behavior, non-null decision_key uniqueness | DBA physical uniqueness/CHECK mapping |
| F25-02 | ADDRESSED IN DOCUMENT; CH-1 review pending | §3 new-vs-legacy identity invariant and exact provenance branches | DBA physical representation; PO confirmation policy |
| F25-03 | ADDRESSED IN DOCUMENT; feasibility pending | §4 exact composite UNIQUE target, distinct reciprocal FK purposes, all-null/all-NN tuple rules | DBA validates actual composite FK definitions and PostgreSQL version |
| F25-04 | ADDRESSED IN DOCUMENT; feasibility pending | §5 normative input/hash/namespace/signed key, sorted multi-key locks, trigger consistency and absent-key behavior | DBA verifies algorithm vectors and implementation compatibility |
| F25-05 | PARTIALLY ADDRESSED | §6 timeout profiles/survivor rollback/LOCK-N03T; §7 T34B/T48/SQLSTATE qualification | Full T01–T63 manifest; runtime unauthorized |
| F25-06 | PARTIALLY ADDRESSED | §8 explicit enumeration of 28 LEG/CAT/CUST/AUD blocked cases and missing query IDs | Complete query/fixture/action manifest; PO and DBA dependencies |
| F25-07 | PENDING | Actual-schema acceptance criteria inherited in R2.7 §9 | Signed DBA physical mapping and CH-1/CH-4 review |
| F25-08 | PENDING | PO governance boundary inherited in R2.7 §10 | Explicit signed PO-01–PO-10 decisions |

## 10. CH1-27 change log

| CH-1 finding | R2.8 change | Exact section(s) |
|---|---|---|
| CH1-27-01 | Event cardinality only begins with committed operation; disabled attempt/rollback create no events; non-null decision_key removes nullable uniqueness ambiguity | §§2.1–2.3 |
| CH1-27-02 | Legacy NULL creator expressly isolated to LEGACY_IMPORT; new-row writer remains NOT NULL; provenance branches rewritten | §§3.1–3.3 |
| CH1-27-03 | Exact four-column operation UNIQUE target, separate FK purposes, ledger ID binding, nullability semantics | §§4.1–4.3 |
| CH1-27-04 | Normative DTK1 canonical byte encoding, SHA-256, signed bigint mapping, namespace, collision semantics, sorted multi-key lock acquisition and trigger parity | §§5.1–5.4 |
| CH1-27-05 | Per-test timeout profiles; explicit deadlock survivor rollback; evidence-before-cleanup; ordered LOCK-N03T commit/re-read | §§6.1–6.5 |
| CH1-27-06 | T34B committed rejection model proposal and current PO-gated no-write outcome; T48 evidence-only status; SQLSTATEs proposed pending DBA | §§7.1–7.3 |
| CH1-27-07 | All LEG/CAT/CUST/AUD IDs listed, status set, query placeholders unassigned, counts and blocked disposition | §§8.1–8.6 |

## 11. Remaining blockers, assumptions and non-claims

1. Actual DBA schema mapping is unavailable. R2.8's composite unique/FK model, event unique rule, CHECKs, trigger support, advisory lock availability and lock order remain logical design assertions, not verified physical schema facts.
2. Advisory-lock hash vectors have intentionally not been fabricated. DBA must calculate/independently verify test vectors against implementation and approve PostgreSQL function/API mapping before build authorization.
3. Multi-key sorted acquisition requires a statement-level affected-key collection or equivalent proven mechanism. If the chosen trigger model cannot collect keys and sort before locking, multi-key mutation is BLOCKED; arbitrary row-trigger order is not accepted.
4. T34B post-PO rejection-record persistence model depends on whether PO approves durable pre-evaluation request creation. Until then current T34B is DT_FEATURE_DISABLED/Δ=0 with no rejection event/audit.
5. SQLSTATE 23502/23503 and all other proposed outcomes require DBA confirmation against exact physical constraints and RPC exception mapping. No runtime result is claimed.
6. LEG/CAT/CUST/AUD: 28/28 cases enumerated, 28 BLOCKED, zero query IDs actually assigned, zero closed/PASS. Placeholder IDs are not executable queries.
7. T01–T63 remaining unexpanded rows still require a complete versioned manifest. F25-05 remains PARTIALLY ADDRESSED.
8. PO-01–PO-10 remain PENDING. F25-08 remains PENDING.
9. No runtime/database verification, build, tests, QA or deployment was performed.

## 12. Final status and authorization

- R2.8 is a documentation candidate for CH-1 review only.
- CH-1 review of R2.7: NEEDS REVISION; this document responds to CH1-27-01 through CH1-27-07.
- CH-4 review: NOT REQUESTED; defer until CH-1 has reviewed the exact R2.8 candidate.
- F25-01–F25-04: addressed at logical documentation level, physical verification pending.
- F25-05/F25-06: PARTIALLY ADDRESSED.
- F25-07/F25-08: PENDING.
- Design closure NOT GRANTED; M0-01 implementation NOT AUTHORIZED; financial pilot NO-GO.
- Runtime/database verification NOT EXECUTED; no PASS is claimed.
- No code, SQL, database, environment, build, tests, deployment or merge.
- Preserve R2.7 unchanged; CH-1 to review exact R2.8 commit before any CH-4 review.