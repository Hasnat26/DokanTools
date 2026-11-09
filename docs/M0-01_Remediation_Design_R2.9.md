# DokanTools — M0-01 Remediation Design R2.9

**Revision:** R2.9 — DT-002 targeted remediation following CH-1 review of R2.8
**Exact R2.8 base:** `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb`
**CH-1 review:** PR #15 comment https://github.com/Hasnat26/DokanTools/pull/15#issuecomment-6735618776
**R2.8 source:** `docs/M0-01_Remediation_Design_R2.8.md`
**CH-1 review:** PR #14 comment https://github.com/Hasnat26/DokanTools/pull/14#issuecomment-6735432188
**R2.7 source:** `docs/M0-01_Remediation_Design_R2.7.md`
**Implementation approval:** NOT GRANTED | **Financial pilot:** NO-GO | **Runtime/DB verification:** NOT EXECUTED

> R2.9 is a new documentation version based on the exact R2.8 candidate. R2.8 and all earlier revisions remain unchanged. This document is a logical design proposal, not SQL or implementation authority. The selected RPC-gated execution contract below is NOT yet DBA-validated or authorized for implementation. No code, SQL, database, environment, build, test, QA, deployment, merge or pilot action is performed or authorized.

## 1. Authority, precedence and change scope

1. R2.9 is based on exact R2.8 commit `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb`; R2.8 is preserved unchanged.
2. R2.9 supersedes only the affected logical design clauses in R2.8 §§4–6, 9, 11 and 12, and adds the CH1-28 change log. All non-conflicting provisions remain inherited.
3. The core model remains durable approval operation, authenticated application identity, immutable events/ledger, reciprocal operation↔ledger references, customer-row balance mutex and fail-closed PO gating.
4. F25-05/F25-06 remain PARTIALLY ADDRESSED. F25-07/F25-08 remain PENDING.
5. R2.9 is submitted for CH-1 review only. CH-4 is deferred until CH-1 disposition of this exact candidate.
6. This document does not authorize implementation, direct DML, SQL, DB changes or runtime execution.

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
| F25-04 | LOGICAL SCHEDULE SPECIFICATION REVISED; IMPLEMENTATION/PHYSICAL FEASIBILITY AND EXECUTION PENDING | §§5, 13, 15, 17 specify lock-key derivation and proposed RPC-gated order/schedules | DBA physical mapping, function/grant/trigger validation, vectors, lock-resource proof; runtime execution separately authorized |
| F25-05 | PARTIALLY ADDRESSED | §6 timeout profiles/survivor rollback/LOCK-N03T; §7 T34B/T48/SQLSTATE qualification | Full T01–T63 manifest; runtime unauthorized |
| F25-06 | PARTIALLY ADDRESSED | §8 explicit enumeration of 28 LEG/CAT/CUST/AUD blocked cases and missing query IDs | Complete query/fixture/action manifest; PO and DBA dependencies |
| F25-07 | PENDING | Actual-schema acceptance criteria inherited in R2.7 §9 | Signed DBA physical mapping and CH-1/CH-4 review |
| F25-08 | PENDING | PO governance boundary inherited in R2.7 §10 | Explicit signed PO-01–PO-10 decisions |

## 10. CH1-27 inherited change log (R2.8; retained for traceability)

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

1. Actual DBA schema mapping remains unavailable. R2.9's composite unique/FK model, CHECKs, selected RPC-gated transaction contract, application-role grants and trigger roles remain logical proposals, not verified physical schema facts.
2. Advisory-lock hash vectors have intentionally not been fabricated. DBA must calculate/independently verify test vectors against the actual shared lock helper and approve PostgreSQL function/API mapping before implementation authorization.
3. Multi-key sorted acquisition is assigned to the controlled RPC before protected DML; row triggers are guard-only, statement triggers reconcile actual affected rows, and deferred triggers validate final state only. DBA must prove the required function/trigger/grant architecture is supported for every protected table/event. If not, multi-key writes remain BLOCKED; no row-trigger-order fallback is accepted.
4. T34B post-PO rejection-record persistence model depends on whether PO approves durable pre-evaluation request creation. Until then current T34B is DT_FEATURE_DISABLED/Δ=0 with no rejection event/audit.
5. SQLSTATE 23502/23503 and all other proposed outcomes require DBA confirmation against exact physical constraints and RPC exception mapping. No runtime result is claimed.
6. LEG/CAT/CUST/AUD: 28/28 cases enumerated, 28 BLOCKED, zero query IDs actually assigned, zero closed/PASS. Placeholder IDs are not executable queries.
7. T01–T63 remaining unexpanded rows still require a complete versioned manifest. F25-05 remains PARTIALLY ADDRESSED.
8. PO-01–PO-10 remain PENDING. F25-08 remains PENDING.
9. No runtime/database verification, build, tests, QA or deployment was performed.

## 12. Final status and authorization

- R2.9 is a documentation candidate for CH-1 review only, based on exact R2.8 commit `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb`.
- CH-1 review of R2.8: NEEDS REVISION; R2.9 responds to CH1-28-01 through CH1-28-05.
- CH-4 review: NOT REQUESTED; defer until CH-1 has reviewed the exact R2.9 candidate.
- F25-01–F25-03: logical documentation clauses inherited/revised; physical DBA verification pending.
- F25-04: LOGICAL SCHEDULE SPECIFICATION REVISED; IMPLEMENTATION/PHYSICAL FEASIBILITY AND EXECUTION PENDING.
- F25-05/F25-06: PARTIALLY ADDRESSED.
- F25-07/F25-08: PENDING.
- Design closure NOT GRANTED; M0-01 implementation NOT AUTHORIZED; financial pilot NO-GO.
- Runtime/database verification NOT EXECUTED; no PASS is claimed.
- No code, SQL, database, environment, build, tests, deployment or merge.
- Preserve R2.8 unchanged; CH-1 to review exact R2.9 commit before any CH-4 review.
## 13. CH1-28-01 — Selected PostgreSQL execution contract (design proposal; DBA validation required)

### 13.1 Selection and scope boundary

**Selected logical architecture:** a single controlled, SECURITY DEFINER write-RPC boundary per supported mutation class, backed by a shared internal key-lock helper and database-enforced denial of direct application-role DML on protected operation, ledger and event tables. The request payload is validated as data-only input first; the complete affected-key set is derived from persisted OLD rows plus the proposed NEW rows before any protected-row DML. The RPC sorts and locks that set before issuing business DML.

This is a concrete architecture selection for the logical contract; it is **not a claim that the repository schema, current RPCs, grants, or trigger definitions already implement it**. DBA must map the design to the actual PostgreSQL version, current relation names, partitions, triggers, roles and function ownership before feasibility can be accepted.

**Mutation boundary:** supported writes MUST enter through the approved RPC. Application roles receive no direct INSERT/UPDATE/DELETE/TRUNCATE privilege on protected tables and no ability to call unapproved mutation functions. A future new write path is blocked until it implements the same transaction-level lock contract and appears in the writer inventory. If grants cannot enforce this boundary, all protected multi-key mutation is BLOCKED; do not rely on application convention.

**Multi-key policy:** only RPC calls that can determine the complete affected set before DML may perform multi-key mutations. If any OLD or NEW key cannot be determined before locks, the RPC rejects before DML with a fail-closed domain error and Δ=0. No row-trigger-order fallback is permitted.

### 13.2 Key-set collection, statement/row/deferred responsibilities

For each approved RPC invocation, inside one database transaction:

1. **Request/authorization phase (no protected business DML):** authenticate the caller using server-side auth context; validate request shape and PO feature gate; derive actor and immutable request ID. Determine the complete OLD key set by selecting affected existing rows using a stable predicate and locking the relevant parent/identity rows as required by the operation contract. Determine every proposed NEW key from validated RPC inputs. For UPDATE include OLD and NEW; INSERT includes NEW; DELETE includes OLD. Deduplicate by full K, not hash.
2. **Completeness check:** establish that the RPC has enumerated all target rows for its predicate. If it cannot prove a complete target set (for example, a predicate depends on a mutable value not protected by an appropriate parent lock), abort before business DML. The RPC must not broaden the set after locks have begun.
3. **Canonical ordering:** canonicalize each full K using the R2.8 DTK1 byte encoding; sort by the full canonical K byte sequence using unsigned bytewise lexicographic order; deduplicate identical full K. Hash only after ordering to derive the advisory pair. Hash equality is never treated as K equality.
4. **Acquire locks:** sequentially acquire transaction-level advisory locks for every K in sorted order, using the R2.8 namespace and signed digest key. Locks remain held through COMMIT/ROLLBACK. No additional K may be acquired out of order; discovery of a missing/lower K causes abort and a new transaction with the complete set.
5. **Re-read and validate:** after all advisory locks are held, re-read each operation and its linked ledger rows by full K; lock existing operation rows FOR UPDATE in the same K order; re-read again after row locks; validate expected state, version, cardinality, exact linkage and customer balance mutex requirements. No business validation based on pre-lock snapshots is authoritative.
6. **Business DML:** perform the operation/ledger/event writes only after the full advisory lock set and required row locks are held. The RPC must write the operation, ledger, event and audit rows in the same transaction as required by inherited atomicity rules.
7. **Commit boundary:** deferred constraints validate reciprocal references and final-state invariants at transaction end. If any deferred validation fails, PostgreSQL aborts the transaction; no partial business rows commit. The RPC returns success only after COMMIT succeeds.

**Statement responsibility:** a statement within the controlled RPC is not a free-standing write API. The RPC must supply the complete key set before executing any protected DML statement. Set-based UPDATE/DELETE is permitted only when all affected OLD/NEW keys were pre-enumerated and locked in order. A trigger transition relation may be used by DBA as a defence-in-depth completeness check after statement execution, but is not the primary pre-lock collector and MUST NOT be described as acquiring locks before the statement's row processing.

**Row-trigger responsibility:** immediate BEFORE ROW triggers on protected operation/ledger tables are guard-only. They verify that the transaction is executing through an approved mutation context, that the row's OLD/NEW key is in the transaction's predeclared locked-key set, and that no protected DML bypassed the RPC. They reject missing context/key membership before allowing the row change. They do not discover or acquire extra keys, do not determine global ordering, and do not serve as a collector.

**Statement-trigger responsibility:** AFTER STATEMENT triggers, where supported and selected by DBA, may inspect transition relations to compare the actually affected OLD/NEW key set with the predeclared transaction key set and fail the statement if a key is missing or an unexpected key changed. Their role is verification only. Trigger availability/transition-table restrictions for each target table and event must be checked by DBA; where unavailable, the RPC's locked target set plus guard triggers and explicit row-count/key reconciliation are mandatory. No unsupported transition-table capability is assumed.

**Deferred-trigger responsibility:** DEFERRABLE constraint triggers run at transaction end to validate final reciprocal operation↔ledger cardinality, exact IDs, all-null/all-NN link rules and final-state invariants. They may re-read affected full K values and verify that each is already in the transaction lock set; they MUST NOT be the first mechanism to collect the whole statement's affected set or acquire a late unsorted lock. If a deferred trigger discovers an unlocked key, it raises an exception and aborts the transaction; it does not acquire the missing lock.

### 13.3 Transaction context and fail-closed contract

The lock-set context is transaction-local and must not be trusted from caller-supplied text or arbitrary session settings. DBA must select a safe mechanism, such as a transaction-scoped internal context table keyed by backend/transaction identity with strict function-only privileges, or an equivalently verified protected mechanism. Plain user-settable custom GUC values are not authoritative authorization evidence.

The controlled RPC performs lock-set registration only after locks are actually acquired and binds it to the current transaction. Triggers verify the registered full K set and lock-acquisition state. Context rows are transactionally rolled back with business DML. Any context mismatch, missing lock, unknown key, trigger mismatch, unapproved function identity, missing privilege boundary, serialization/deadlock/timeout error, or deferred-invariant failure causes full transaction rollback. No retry occurs inside a transaction after partial lock acquisition; caller may retry only in a fresh transaction using the full key-set discovery sequence and idempotency key.

**Hard fail-closed outcomes:** direct table DML; incomplete OLD/NEW discovery; key-set expansion after first lock; arbitrary row-trigger lock acquisition; unapproved writer function; unknown trigger behavior; unsupported transition-table assumptions; and a deferred trigger attempting first-time lock acquisition are all BLOCKED. Such a call must produce no committed operation, event, audit, ledger or balance effect (Δ=0), subject only to separately approved security telemetry outside the business lifecycle.

### 13.4 DBA acceptance evidence before feasibility status changes

DBA must supply: (a) exact PostgreSQL major/minor version; (b) complete table/partition and trigger inventory; (c) actual RPC function and ownership/SECURITY DEFINER/search_path/EXECUTE grants; (d) application-role table and sequence grants proving direct DML denial; (e) proof of complete target-key enumeration for each mutation class; (f) trigger matrix documenting supported BEFORE ROW, AFTER STATEMENT transition relations and deferred constraint triggers for each event/table; (g) lock helper source and verified DTK1 vectors; (h) two-session concurrency traces proving sorted acquisition; (i) negative bypass tests proving fail-closed behavior. Until reviewed and accepted, this selected logical architecture remains **PROPOSED / PHYSICAL FEASIBILITY UNVERIFIED**. This evidence does not itself authorize runtime testing; separate approval is required.

## 14. CH1-28-02 — Canonical reciprocal constraint matrix

The following is the canonical logical matrix. Column names are logical contract names; actual physical names, types, partitioning and PostgreSQL FK eligibility remain DBA-pending.

| ID | Child table / exact child columns | Parent table / exact parent columns | Null rule / enforcement | Independent purpose |
|---|---|---|---|---|
| U-O-K | operation: (shop_id, operation_type, operation_id) | operation same tuple | UNIQUE, all columns NOT NULL | Canonical operation K uniqueness |
| U-O-LID | operation: (ledger_entry_id) | operation same column | UNIQUE; NULL allowed for non-posted rows | Prevent one ledger row being pointed to by multiple operations |
| U-O-K-LID | operation: (shop_id, operation_type, operation_id, ledger_entry_id) | operation same tuple | Exact four-column UNIQUE FK target; first three columns NN; ledger_entry_id NULL only for non-posted | Supplies exact referenced tuple for FK-L-O-L |
| FK-O-L | operation: (ledger_entry_id) | ledger: (ledger_id) | operation ledger_entry_id NULL for non-posted, NN for posted; corresponding state CHECK | Ensures operation pointer references an existing ledger row |
| FK-L-O | ledger: (approval_shop_id, approval_operation_type, approval_operation_id) | operation: (shop_id, operation_type, operation_id) | Link tuple all NULL or all NN via CHECK; partial NULL rejected | Independently proves the named approval operation K exists; logically redundant for existence if FK-L-O-L is present and valid, but retained as a separately readable key-level integrity rule only if DBA confirms no harmful duplication |
| FK-L-O-L | ledger: (approval_shop_id, approval_operation_type, approval_operation_id, approval_ledger_id) | operation: (shop_id, operation_type, operation_id, ledger_entry_id) | All four ledger child columns all NULL or all NN via CHECK; partial NULL rejected; approval_ledger_id CHECK equals ledger.ledger_id | Proves both operation K existence and that the exact ledger row's ID equals the operation's ledger_entry_id |
| CK-O-STATE-LINK | operation: (state, ledger_entry_id) | operation row | CHECK: POSTED iff ledger_entry_id NN; non-POSTED iff NULL, subject to inherited terminal semantics | Aligns operation terminal/post state with link presence |
| CK-L-APPROVAL-TUPLE | ledger: (approval_shop_id, approval_operation_type, approval_operation_id, approval_ledger_id) | ledger row | CHECK: tuple all NULL or all NN; partial NULL prohibited | Prevents MATCH SIMPLE from silently bypassing FK checks on partial NULL tuple |
| CK-L-APPROVAL-ID | ledger: (ledger_id, approval_ledger_id) | ledger row | CHECK: if approval tuple NN then approval_ledger_id = ledger_id | Binds child tuple's ledger identifier to the current ledger row |

**FK-L-O disposition:** the three-column FK is logically redundant for the narrow proposition “the operation K exists” when FK-L-O-L is valid, because FK-L-O-L already references the same first three columns plus ledger_entry_id. It is not required for the exact reciprocal identity invariant. R2.9 therefore marks FK-L-O as **OPTIONAL / DBA JUSTIFICATION REQUIRED**, not mandatory. The minimum logical integrity set is FK-O-L + FK-L-O-L, together with U-O-K, U-O-LID, U-O-K-LID and the stated CHECKs. If retained for diagnostic clarity, DBA must document the independent operational reason and confirm its duplicate enforcement/cost is acceptable. No claim of physical feasibility is made.

All reciprocal FKs remain DEFERRABLE INITIALLY DEFERRED, ON UPDATE RESTRICT, ON DELETE RESTRICT, with no CASCADE, unless DBA's exact PostgreSQL mapping shows a restriction that requires a reviewed revision. The logical all-null/all-NN checks are mandatory regardless of FK MATCH behavior.

## 15. CH1-28-03 — Individual lock schedules and evidence contracts

All schedules below are proposed test specifications, NOT EXECUTED. Session labels A/B are independent PostgreSQL backends. Each test starts from a committed fixture and takes immutable B0 snapshots (operation count by full K, event count by operation, ledger count/IDs/amount aggregates, relevant customer balance). Each error is captured before cleanup. Every transaction is explicitly rolled back unless the schedule specifically calls for a successful commit. B1 is taken only after all sessions are idle and after any required fresh-read transaction is completed. B0 and B1 query IDs are not assigned in this design document.

### 15.1 Deadlock schedules (LOCK-N01D/N02D/N03D)

| Case | Resource and fixture | Session A sequence | Session B sequence | Expected SQL / outcome | Rollback and evidence | B0/B1 invariant |
|---|---|---|---|---|---|---|
| LOCK-N01D | Two distinct row mutexes R1/R2 in controlled test fixture; intentionally opposite acquisition | BEGIN; lock R1; signal A1; wait B1; request R2 | BEGIN; lock R2; signal B1; wait A1; request R1 | One participant only receives 40P01; other is survivor; no business DML is authorized in either session | Capture both PIDs, txids, SQL, pg_locks/pg_stat_activity graph and timestamps; explicitly ROLLBACK victim then survivor; never commit survivor | B0=B1 for all operation/event/ledger/balance values |
| LOCK-N02D | Operation-key advisory lock vs operation row FOR UPDATE, same K; two-session inversion in isolated harness | BEGIN; acquire row lock then request K advisory lock only if the exact tested path under review permits it | BEGIN; acquire K advisory lock then request same row lock | Intended inversion produces exactly one 40P01; if the approved RPC contract prevents this order, case is redesign evidence and must not be forced in production path | Capture exact lock IDs, key pair, PIDs, waits/graph before cleanup; explicitly ROLLBACK both sessions, victim then survivor; no commit | B0=B1; no operation/event/ledger/balance delta |
| LOCK-N03D | Actual mapped operation/ledger trigger resources and key/row lock order | NOT STARTED; no speculative physical table/trigger locks | NOT STARTED; no speculative physical table/trigger locks | **BLOCKED until signed DBA physical schema/trigger/function/lock map exists and CH-1 accepts mapped resource list**. No executable SQL schedule can be specified without inventing objects | Evidence required before unblocking: DBA map, exact relation/index/trigger/function/resource IDs, reviewed lock-order graph, safe isolated fixture, approved runtime authorization | No execution; no B1 test result. If later authorized, require B0=B1 after both rollback |

### 15.2 Timeout schedules (LOCK-N01T/N02T/N03T)

| Case | Resource and fixture | Session A sequence | Session B sequence | Expected SQL / outcome | Rollback and evidence | B0/B1 invariant |
|---|---|---|---|---|---|---|
| LOCK-N01T | One known row mutex R1; no cycle | BEGIN; acquire R1; retain lock; signal A_LOCKED | BEGIN; request R1; wait | After LOCK-TIMEOUT profile, B receives 55P03; A has no dependency on B and no deadlock cycle | Capture PIDs, txids, lock resource, wait graph, SQLSTATE/time; explicitly ROLLBACK B, then A per fixture teardown | B0=B1; no business delta |
| LOCK-N02T | DTK1 transaction advisory lock for one full K; no cycle | BEGIN; acquire exact advisory pair for K; retain | BEGIN; request same pair; wait | B receives 55P03; no 40P01 | Capture canonical K, UTF-8 input, digest vector ID, namespace/pair, pg_locks, PIDs and timestamps before rollback; ROLLBACK B then A | B0=B1; no business delta |
| LOCK-N03T | Unique-index arbitration on same absent K; exact physical unique index mapping is DBA-pending | A BEGIN; INSERT pending operation K; hold uncommitted | B BEGIN; attempt same INSERT K; wait on unique conflict | B receives 55P03 under LOCK-TIMEOUT; B explicitly rolls back; A commits; B starts fresh transaction and SELECTs full K (never retries INSERT) | Capture index/constraint identity, SQLSTATE, wait graph and IDs before cleanup; after A commit record canonical IDs; B fresh read; explicit rollback of read transaction | B0 had K absent; B1 exactly one operation and canonical submission event set, no duplicate ledger; fresh read IDs equal A's |

**N03D block rule:** LOCK-N03D is intentionally non-executable before actual DBA mapping, regardless of any abstract row/advisory inversion described for N01D/N02D. A schedule label is not evidence that a physical lock resource exists. If DBA mapping shows no possible inversion in the approved RPC path, record NOT APPLICABLE with evidence rather than manufacturing one.

**Harness rules inherited from R2.8:** D profiles use lock_timeout=0, statement_timeout=30s, deadlock_timeout=200ms. T profiles use lock_timeout=2s, statement_timeout=10s, deadlock_timeout=200ms. Positive barrier watchdog remains 5s and is not SQL lock_timeout. Deadlock victim gets 40P01; survivor is explicitly rolled back; timeout waiter gets 55P03; blocker outcome is stated per row above. Evidence is captured before cleanup. All B0/B1 checks are structural specifications until actual query IDs are assigned and execution separately authorized.

## 16. CH1-28-04 — Manifest boundary, counts and owners

| Manifest scope | Total | Fully specified | Partially specified | Enumerated | Blocked | Actual query IDs assigned | Closed/PASS |
|---|---:|---:|---:|---:|---:|---:|---:|
| T01–T63 | 63 | 0 confirmed complete by R2.9 evidence | 63 remain at least partially/incompletely specified or blocked; split not independently established | inherited test IDs exist | 63 NOT CLOSED; exact fully/partially/blocked partition NOT YET AUDITED | 0 confirmed | 0 |
| LEG/CAT/CUST/AUD | 28 | 0 with full fixture/action/B0/B1/evidence contract | 28 require manifest completion | 28 | 28 | 0 | 0 |

**T01–T63 boundary:** R2.9 does not have the complete authoritative row-by-row manifest needed to defensibly split the 63 into mutually exclusive fully specified, partially specified and blocked counts. It therefore reports “0 confirmed fully specified,” “63 not closed,” and “partition not independently established”; it does not manufacture precise partially-versus-blocked subcounts. A later audited manifest must classify each individual T01…T63 exactly once, with the mutually exclusive counts summing to 63.

**LEG/CAT/CUST/AUD boundary:** 28 total, 28 individually enumerated, 28 blocked, 0 actual query IDs. Proposed placeholders such as LEG.Q01 are not actual query IDs. Enumeration is registration only, not test-manifest completion or closure.

**F25-05 closure criteria and owner:** Owner = CH-3 (manifest author) with CH-1 acceptance and DBA inputs where schema-dependent. Closure requires (a) audited T01–T63 row register with mutually exclusive fully specified/partially specified/blocked states; (b) every row has fixed fixture, actor/role, precondition, exact action, one expected result, B0/B1 actual query IDs, evidence artifact and cleanup; (c) blocked reasons and dependencies named; (d) cross-reference integrity and count reconciliation; (e) CH-1 review acceptance. Runtime PASS is separate and requires explicit execution authorization plus evidence review.

**F25-06 closure criteria and owner:** Owner = CH-3 (family manifest author), with DBA supplying physical query/schema facts and PO supplying governance decisions; CH-1 accepts the completed register. Closure requires each of the 28 cases to have a complete immutable manifest row: fixture, shop/actor/session/role, exact action, expected state/error/SQLSTATE (DBA confirmed), B0 and B1 actual query IDs, artifact schema/hash, cleanup, prerequisites and owner; actual query definitions exist and execute read-only as intended; all PO/DBA blockers explicitly resolved; CH-1 acceptance. Merely listing 28 IDs or placeholder query labels is insufficient. No case becomes PASS absent separately authorized execution.

## 17. CH1-28-05 — F25-04 status wording

F25-04 disposition is **LOGICAL SCHEDULE SPECIFICATION REVISED; IMPLEMENTATION/PHYSICAL FEASIBILITY AND EXECUTION PENDING**. R2.9 specifies candidate RPC-gated lock ordering and individual D/T schedules at the logical level. It does not establish that the actual PostgreSQL schema, functions, triggers, roles, unique indexes or lock resources support the design. LOCK-N03D remains blocked pending signed DBA mapping. No lock test has executed; no runtime result or PASS is claimed. The phrase “addressed” in relation to F25-04 must not be interpreted as physical feasibility, implementation readiness or test closure.

## 18. CH1-28 change log

| CH-1 finding | R2.9 correction | Exact section(s) |
|---|---|---|
| CH1-28-01 | Select RPC-gated transaction architecture; pre-enumerate full OLD/NEW keys, sort/acquire transaction advisory locks before DML; separate RPC, row guard, statement reconciliation and deferred invariant roles; deny direct app DML; fail closed on incomplete key set or unsupported trigger behavior | §13 |
| CH1-28-02 | Canonical child/parent column matrix; all-null/all-NN rules; distinguish FK-O-L and FK-L-O-L; classify FK-L-O as logically redundant/optional pending DBA justification | §14 |
| CH1-28-03 | Individual A/B schedules, resources, SQL action order, SQLSTATE, rollback, evidence and B0/B1 for N01D/N02D/N03D/N01T/N02T/N03T; N03D explicitly blocked pending DBA map | §15 |
| CH1-28-04 | Manifest boundary table for T01–T63 and 28 family cases; no fabricated T01–T63 partition; closure criteria and owners for F25-05/F25-06 | §16 |
| CH1-28-05 | F25-04 reworded as logical schedule specification revised; physical feasibility and execution pending | §17 |