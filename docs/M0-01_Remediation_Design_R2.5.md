# DokanTools — M0-01 Remediation Design R2.5
**Revision:** R2.5 — Final design closure candidate (documentation only)  
**Authoring role:** CH-3 Backend & Security Engineer  
**Reviewed base:** R2.4 exact head `f3772c95ce40b9d5a7526ae6764f8f0896b69b05`  
**Repository:** Hasnat26/DokanTools  
**Status:** CH-1 / CH-4 review required  
**Implementation approval:** NOT GRANTED  
**Financial pilot:** NO-GO  
**Runtime/database verification:** NOT EXECUTED

> R2.5 supersedes conflicting R2.4 design statements for the subjects explicitly covered here. This is a design specification only. It contains no implementation SQL. No application code, migration, database, staging or production system was accessed or mutated. All test plans are proposed and unexecuted.

## 1. Scope, precedence, and gates

R2.5 responds to CH-4 PR #9 (review of R2.4), based on PR #5 (R2.2 QA) and PR #7 (R2.3 QA). R2.4 remains preserved in PR #8. PRs #2–#9 and their histories are not modified.

Precedence:
1. R2.5 sections 3–9 supersede contradictory R2.4 §3, §30–§33, §38–§40 for traceability, field matrices, cardinality, lock ordering, and test definition requirements.
2. Existing R2.4 provisions not contradicted remain inherited as context, not as evidence of implementation.
3. PO-01–PO-10 remain PENDING. CH-3 recommendations are not approvals.
4. No schema/index/RPC implementation may proceed while the applicable PO, DBA/security, CH-1, or CH-4 gate remains open.

## 2. QA disposition and non-claims

**CH-4 PR #9:** NEEDS REVISION — HIGH.  
**Implementation approval:** NOT GRANTED.  
**Financial pilot:** NO-GO.  
**Runtime/database verification:** NOT EXECUTED.

This revision is a design closure candidate only. A design assertion is not proof of database enforcement. No PostgreSQL CHECK, FK, trigger, ACL, SECURITY DEFINER, role membership, RLS, lock, transaction, or recovery behavior is runtime-verified.

## 3. Correct F22-01–F22-11 traceability

The mapping below follows the actual CH-4 PR #5 report, as corrected by PR #7 and confirmed by PR #9. It does not use R2.4's inaccurate assignments.

| Finding | Original PR #5 finding title / meaning | Original severity | R2.4 disposition | R2.5 resolution | Exact R2.5 sections / tests | Remaining dependency | Status |
|---|---|---:|---|---|---|---|---|
| F22-01 | CHECK constraint does not define complete approval-field matrix | HIGH | Partially addressed; §30 field matrix still not total | Separate operation lifecycle matrix from ledger provenance; every branch/field gets explicit NULL/NN/ENUM/conditional rule; CHECK NULL behavior called out | §§4–5; PNV-01–35; T28–T29,T45 | DBA schema mapping, CHECK/FK runtime tests | PARTIALLY ADDRESSED design; runtime UNVERIFIED |
| F22-02 | Two-step approval needs authoritative trusted DB identity/authorization contract | HIGH | Substantially addressed | Preserve actor derivation from trusted auth context; authorization must be rechecked inside posting transaction; inequality is not auth | §§4,7; ADV-01–07; T40–T43,T55 | PO-01/08, DBA auth context, membership model | PARTIALLY ADDRESSED; runtime UNVERIFIED |
| F22-03 | Migration-only legacy guard: current_user alone insufficient without role/owner closure | HIGH | State machine added, runtime closure absent | Specify durable handoff, role graph closure, owner restrictions, independent verification and fail-closed recovery | §8; MIG-01–10; T44,T56,T58,T63 | DBA/security role catalog review and runtime proof | PARTIALLY ADDRESSED |
| F22-04 | Composite FK model is sound in principle; CHECK/nullability matrix incomplete | HIGH | Partially addressed | Explicit origin/direction branches; no unverified legacy memo FK; every field cell defined | §§5–6; PNV-16–19, PNV-33–34; T01,T04,T23,T24,T32,T45 | DBA actual schema/FK validation | PARTIALLY ADDRESSED |
| F22-05 | Global lock order coherent but operation workflow/lock mode needs precision | HIGH | Customer mutex specified but lock descriptions conflict | One canonical lock graph; customer FOR UPDATE is balance mutex; shop KEY SHARE not mutex; operation/request first; sorted multiple locks; detailed schedule tests | §7; LOCK-01–10, LOCK-N01–05; T08,T09,T25,T33,T34,T46–47 | DBA implicit FK/trigger lock inventory; runtime concurrency | PARTIALLY ADDRESSED |
| F22-06 | Atomic financial idempotency vs durable pending workflows; clarify state/recovery | HIGH | Addressed at design level | Separate idempotency request rows from durable approval/catalog/stock workflow state; explicit state transitions and replay outcomes | §§4,6,9; T02–03,T15,T28–29,T35–37,T59–60 | RPC implementation/runtime | ADDRESSED AT DESIGN LEVEL; runtime UNVERIFIED |
| F22-07 | Durable catalog/stock recovery; initial stock identity must prevent duplicate actions | HIGH | Partially addressed | Stable server opening action, unique business action, separate restock movement, same-ID recovery and new-ID prevention; PO keys stay pending | §9; ADV-10–13; CAT-01–10; T16–18,T35–38,T49–52,T60 | PO-06/10, DBA unique-key design | PARTIALLY ADDRESSED |
| F22-08 | Catalog audit claim requires disabling direct write paths | HIGH | Addressed only conditionally | Audit completeness claim only under RPC-controlled writes; direct catalog writes denied and grant/overload inventory required | §§8–9; T18,T38,T58,T61; AUD-04 | DBA grants and runtime ACL verification | ADDRESSED AT DESIGN LEVEL; runtime UNVERIFIED |
| F22-09 | Customer create-or-get recovery and duplicate identity policy | HIGH | Fail-closed design; identity PO pending | Same-ID canonical recovery; changed payload rejects; different-ID collision is conflict/review; no merge | §9; ADV-14; CUST-01–05; T54,T62 | PO-07 | ADDRESSED AS FAIL-CLOSED DESIGN |
| F22-10 | Audit immutability, privileged owner boundary, append-only correction | HIGH | Addressed at design level | Ordinary-role denial, append-only correction, separate DBA break-glass evidence, no false owner-proof claim | §8; ADV-08; AUD-01–05; T53,T57,T63 | DBA owner/ACL/trigger verification | ADDRESSED AT DESIGN LEVEL; runtime UNVERIFIED |
| F22-11 | PO decisions and fail-closed implementation dependencies | HIGH | Governance design; all PO pending | PO-01–10 each lists options, recommendation, impacted workflow/module, exact evidence; recommendations do not approve | §10 | Product Owner written approval | ADDRESSED AS GOVERNANCE DESIGN; PO items PENDING |

**Traceability rule:** a related section is not sufficient to mark a finding fully resolved. Any row with an outstanding DBA, PO, or runtime dependency remains partial/unverified as indicated.

## 4. Approval-operation lifecycle matrix (operation-only)

### 4.1 Operation schema vocabulary

This matrix is normative for the *approval-operation record*, not the ledger. The eventual schema must map each logical field to an exact column and type before implementation.

Fields:
- `operation_id`: stable UUID supplied/generated once by client for request identity.
- `shop_id`, `operation_type`, `customer_id`.
- `creator_user_id`: trusted auth subject captured by server.
- `approver_user_id`: trusted auth subject at approve time; never caller-selected.
- `canonical_payload`: immutable server-normalized request.
- `payload_sha256`: server SHA-256 digest of canonical payload.
- `canonicalization_version`, `hash_algorithm`.
- `amount`, `reason_code`, `reason_text`.
- `submitted_at`, `approved_at`, `expires_at`, `terminal_at`.
- `confirmation_method`, `confirmed_at`, `confirmation_actor` (only where policy requires and where actor is trusted).
- `ledger_entry_id`: canonical posted ledger row, NULL until posting succeeds.
- `request_event_id`, `approval_event_id`, `terminal_event_id`, `audit_event_id`.
- `status`: pending, posted, cancelled, expired, rejected.

### 4.2 NULL / NOT NULL / immutable / conditional rules by state

Legend: **NN** = NOT NULL; **NULL** = must be NULL; **IMM** = immutable after initial insert; **COND** = state-dependent exact rule; **ENUM** = value from approved enum.

| Field | pending | posted | cancelled | expired | rejected |
|---|---|---|---|---|---|
| operation_id | NN, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| shop_id | NN, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| operation_type | NN, approved ENUM, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| customer_id | NN, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| creator_user_id | NN trusted auth subject, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| approver_user_id | NULL | NN trusted actor, IMM | NULL unless rejection/cancel policy explicitly records actor separately | NULL | NN only if rejection policy records actor; otherwise NULL |
| canonical_payload | NN, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| payload_sha256 | NN server recompute, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| canonicalization_version | NN approved version, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| hash_algorithm | ENUM=sha256, IMM | same | same | same | same |
| amount | NN positive finite decimal, IMM | NN, IMM | NN, IMM | NN, IMM | NN, IMM |
| reason_code/text | NN according to approved reason policy, IMM | IMM | IMM | IMM | IMM |
| submitted_at | NN server timestamp, IMM | IMM | IMM | IMM | IMM |
| approved_at | NULL | NN server timestamp | NULL | NULL | NULL |
| expires_at | NN server timestamp/deadline, IMM | IMM | IMM | IMM | IMM |
| terminal_at | NULL | NN server timestamp | NN server timestamp | NN server timestamp | NN server timestamp |
| confirmation_method | NN approved ENUM for no-reference confirmation, IMM | IMM | IMM | IMM | IMM |
| confirmed_at | NN server timestamp, IMM | IMM | IMM | IMM | IMM |
| confirmation_actor | NN trusted submitter or approved independent actor; exact policy PO-pending | IMM | IMM | IMM | IMM |
| ledger_entry_id | NULL | NN canonical ledger ID | NULL | NULL | NULL |
| request_event_id | NN, IMM | IMM | IMM | IMM | IMM |
| approval_event_id | NULL | NN unique event ID | NULL | NULL | NULL |
| terminal_event_id | NULL | NULL | NN unique event ID | NN unique event ID | NN unique event ID |
| audit_event_id | NN submission event | NN post event | NN terminal event | NN terminal event | NN terminal event |
| status | ENUM pending | ENUM posted | ENUM cancelled | ENUM expired | ENUM rejected |

Rules:
1. The initial row is pending only. A pending operation has zero ledger rows and zero balance effect.
2. Posted operation is terminal and has exactly one canonical ledger row (see §6).
3. Cancelled/expired/rejected operation has zero ledger rows.
4. `approved_at`, `approver_user_id`, `approval_event_id`, and `ledger_entry_id` are NULL for non-posted terminal states, except rejection actor is recorded in a separately defined terminal actor field/event—not approval fields.
5. Operation identity, shop/type/customer, creator, canonical payload/hash/version, amount/reason, submission and expiry are immutable after creation.
6. Status changes only through approved RPC transaction; no direct client table update.
7. Confirmation metadata proves a workflow assertion only; it is not identity authentication.
8. Historical missing provenance is not synthesized into operation records.

### 4.3 State transition table

| From | To | Allowed actor/path | Transactional effects | Forbidden |
|---|---|---|---|---|
| absent | pending | authenticated submit RPC | operation + request/audit event; no ledger | client direct INSERT |
| pending | posted | authorized approval RPC | exactly one ledger row, approval/post audit, operation linkage, result | client direct UPDATE; posting without ledger |
| pending | cancelled | creator or authorized actor per PO | terminal event; no ledger | cancellation after posted |
| pending | expired | trusted server expiry worker or approve-time expiry check | terminal event; no ledger | client-supplied clock |
| pending | rejected | authorized approver/reviewer per PO | terminal event/reason; no ledger | use approval fields as rejection fields |
| posted | any | none | immutable | cancel/delete/repost |
| cancelled/expired/rejected | any | none | immutable | revive or repost |

The exact role set and expiry policy remain PO-01/02/08 pending.

## 5. Posted ledger provenance matrix (ledger-only)

### 5.1 Ledger fields

Ledger logical fields: `ledger_id`, `shop_id`, `customer_id`, `direction/type`, `origin`, `amount`, `created_by_user_id`, `source_memo_id`, `reference_raw`, `reference_normalized`, `reference_kind`, `reference_exception`, `exception_reason_code`, `exception_reason_text`, `independent_confirmation`, `independent_confirmation_at`, `approval_operation_id`, `approval_operation_type`, `approval_payload_hash`, `canonicalization_version`, `approved_by_user_id`, `approved_at`, `approval_method`, `legacy_import_batch_id`, `legacy_snapshot_digest`.

Operation-only fields (canonical operation payload, submitted_at, expires_at, operation state, request/approval/terminal event IDs) are **not** copied into ledger unless an exact FK/event reference is named. Ledger row has only posting provenance.

### 5.2 Total valid branch matrix

Values: NN=NOT NULL; NULL=must be NULL; ENUM=approved enum; HIST=preserve only actual historical value, else nullable/explicit unknown storage defined by DBA; FK=valid same-shop/same-customer reference; N/A=field not represented in ledger.

| Ledger branch | creator | approver/approved_at/method | operation ID/type/hash/version | reference fields | exception/reason | confirmation | source_memo_id | legacy batch/digest |
|---|---|---|---|---|---|---|---|---|
| memo-origin due | NN for new writes | NULL/NULL/NULL | NULL/NULL/NULL/NULL | NULL/NULL/NULL | false; reason NULL | N/A/NULL | NN exact composite memo FK | NULL |
| memo-origin paid | PROHIBITED | — | — | — | — | — | — | — |
| referenced manual due | NN | NULL/NULL/NULL | NULL/NULL/NULL/NULL | raw NN; normalized NN; kind NN ENUM | false; reason code/text NULL | false or approved exact N/A value; timestamp NULL | NULL | NULL |
| approved no-reference manual due | NN | NN/NN/NN ENUM | NN/NN/NN/NN | raw=NULL; normalized=NULL; kind=approved no-reference ENUM | true; reason code/text NN | true; timestamp NN | NULL | NULL |
| manual payment | NN | NULL/NULL/NULL | NULL/NULL/NULL/NULL | all NULL | false; reason NULL | false or NULL per exact schema branch; timestamp NULL | NULL | NULL |
| historical legacy due | HIST | NULL unless verified historic approval exists and separately classified; never invent | NULL unless real linkage exists and classification approved | NULL in enforced reference fields unless actual authoritative value is proven | explicit approved legacy representation; do not fabricate exception approval | NULL unless source evidence exists | NULL unless memo source positively proven and approved reclassification; candidate hint separated | NN only if migration provenance generated and retained; digest exact |
| historical legacy paid | HIST | same no fabrication rule | same | same | same | same | same | same |

**Closed-world rule:** any origin/type/state combination not listed is prohibited. Any field omitted from a branch is NULL—not “unknown representation”—unless the branch explicitly says HIST and the DBA-approved legacy schema defines how unknown is represented.

### 5.3 Legacy unknown provenance

- Never invent a UUID for creator/approver, timestamp, approval method, hash, operation ID or memo FK.
- Existing source creator is retained only if source record proves it; otherwise preserve NULL/unknown in a legacy-only representation.
- If existing NOT NULL constraints cannot represent true historical unknowns, implementation is blocked pending explicit DBA/PO choice: (a) nullable legacy provenance, (b) separate legacy ledger/archive table with exact linkage, or (c) a typed unknown sentinel that cannot be mistaken for a real actor and is not a valid approval principal. CH-3 does not choose silently.
- A legacy source memo hint goes to non-authoritative candidate metadata, not enforced `source_memo_id`. The latter is NULL unless positively proven and formally reclassified.
- Legacy records remain frozen after migration; correction is a separate append-only event.

### 5.4 PostgreSQL CHECK three-valued logic

PostgreSQL CHECK accepts TRUE or NULL. Therefore:
- All discriminator columns (`origin`, `type`, exception flag and required state fields) must be NOT NULL where schema supports it.
- Every CHECK branch must use explicit `IS NULL`, `IS NOT NULL`, boolean equality, and enum checks for nullable fields. Do not rely on `=`, `<>`, or a nullable conjunction to fail closed.
- Branch predicates must be mutually exclusive and collectively exhaustive for allowed rows. Invalid rows must evaluate FALSE, not NULL.
- CHECK cannot prove auth subject, membership, expiry at transaction time, recomputed hash, event existence, row-count cardinality or operation/ledger bidirectionality. Those require RPC/transaction, FK/unique, deferred trigger/constraint trigger, ACL or independent runtime assertion.
- `approver_user_id IS DISTINCT FROM creator_user_id` proves only structural inequality. It does not authenticate the approver or authorize the operation.

## 6. Approval-operation ↔ ledger bidirectional cardinality

### 6.1 Required invariant

For each approval operation key (K=(shop_id, operation_type, operation_id)):

- status=posted ⇒ exactly one canonical ledger row for K;
- status in pending/cancelled/expired/rejected ⇒ zero ledger rows for K;
- no ledger row references an absent or non-posted operation;
- no operation can link to two ledger rows;
- no posted operation can exist without its ledger row;
- no ledger row can be inserted/updated/deleted outside the authorized posting boundary;
- replay returns the original ledger ID and causes no second row, event or balance effect.

### 6.2 Constraint design (logical contract; no SQL migration authored)

**Keys**
- Approval operation has PK `operation_id` and UNIQUE `(shop_id, operation_type, operation_id)`.
- Ledger row stores `approval_shop_id`, `approval_operation_type`, `approval_operation_id` (or exact equivalent tuple).
- Ledger has UNIQUE `(approval_shop_id, approval_operation_type, approval_operation_id)` for non-NULL approval linkage, with NULL semantics deliberately documented. PostgreSQL ordinary UNIQUE allows multiple NULLs; this is acceptable for non-approval ledger rows, while approval rows require all key components NN via branch CHECK.
- Composite FK ledger→operation on `(approval_shop_id, approval_operation_type, approval_operation_id)` references operation unique tuple. This guarantees referenced operation exists, but **does not** guarantee operation is posted or ledger row exists for every posted operation.
- Operation stores `ledger_entry_id`; unique constraint on non-NULL ledger_entry_id prevents two operations pointing to one ledger row. FK operation→ledger is deferrable initially deferred if schema permits; ledger ID may be NULL for non-posted state.
- Ledger→operation FK and operation→ledger FK must be checked as one reciprocal canonical pair. Exact columns must avoid FK cycles that cannot be inserted in a transaction.

**Deferrability and timing**
- Immediate constraints: type/nullability/unique identity where possible; FK existence checks unless the circular link requires deferred.
- Deferred end-of-transaction constraint trigger (or equivalent DBA-approved constraint mechanism) verifies for affected operation key:
  - posted: exactly one ledger row, operation.ledger_entry_id equals ledger.ledger_id, all bound fields equal;
  - non-posted: zero ledger rows and operation.ledger_entry_id NULL.
- Constraint trigger must be DEFERRABLE INITIALLY DEFERRED where needed and must run on both operation and ledger INSERT/UPDATE/DELETE. A trigger on only one side is insufficient.
- Validation occurs at transaction commit; any mismatch aborts the transaction. A deferred trigger is not a substitute for direct-write denial or row locks.
- FK alone is not sufficient: it enforces referential existence, not state-dependent “posted iff exactly one.”
- UNIQUE alone is not sufficient: it enforces at most one, not at least one.
- CHECK cannot count other table rows.
- A transaction procedure alone is not sufficient if direct table writes remain available.

**Atomic posting**
1. Acquire operation row lock `FOR UPDATE`.
2. Authenticate actor from trusted context; verify shop/membership/authority/expiry and creator≠approver policy.
3. Recompute payload hash from stored immutable payload and pinned version.
4. Acquire customer `FOR UPDATE` mutex.
5. Verify no ledger row already exists except canonical replay case.
6. Insert exactly one ledger row with full binding fields.
7. Insert immutable posting/audit event.
8. Update operation to posted, set approved_at/approver/ledger_entry_id/event IDs.
9. Commit. Deferred reciprocal constraint validates exactly-one and binding.
10. Any error rolls back ledger, operation transition, audit and balance effect together.

**ACL/ownership boundary**
- Ordinary auth, anon, client service paths, and application roles cannot INSERT/UPDATE/DELETE approval operation or linked ledger tables directly.
- Only the approved RPC owner can perform transition writes; RPC owner has minimum privilege and cannot SET/inherit migration role.
- Trigger/constraint owner, table owner, DBA and superuser are privileged boundaries. Break-glass is external audit + dual approval, not an assertion that triggers prevent superuser action.
- No direct “status=posted” update is accepted. Operation state and ledger linkage are immutable except the single authorized pending→posted transaction.

**Rollback and replay**
- Insert ledger then fail audit/operation update ⇒ entire transaction rollback; zero committed ledger and operation remains pending.
- Update operation then fail ledger insert ⇒ rollback; operation remains pending.
- Same operation ID, same canonical payload/version: pending returns pending canonical ID; posted returns original ledger ID; cancelled/expired/rejected returns terminal state; no new event/balance effect.
- Same ID with changed type/shop/customer/amount/reason/payload/version/hash ⇒ stable domain conflict; original row untouched.
- No new operation ID may be generated automatically to recover a timeout.

### 6.3 Binding matrix

| Bound field | operation | canonical ledger | validation |
|---|---|---|---|
| shop | shop_id | shop_id/approval_shop_id | exact equality + tenant FK |
| operation key | type/id | type/id | exact equality + unique |
| customer | customer_id | customer_id | exact equality + composite shop/customer FK |
| amount | amount | amount | exact numeric equality; no float conversion |
| direction | operation_type=manual_due | ledger type=due | fixed enum mapping |
| origin | operation_type implies manual | origin=manual | fixed mapping |
| creator | creator_user_id | created_by_user_id | exact equality |
| approver | trusted actor at post | approved_by_user_id | exact equality + trusted auth/membership |
| payload | canonical_payload | only needed immutable provenance hash | server recompute |
| hash/version | sha256/version | approval hash/version | exact equality |
| canonical ledger ID | ledger_entry_id | ledger_id | reciprocal FK + deferred trigger |
| event linkage | approval_event_id | audit/post event ref | unique event ID and immutable event |

## 7. Canonical lock graph and deterministic schedules

### 7.1 One canonical order

`Operation/request → Shop (where required) → Membership (where required) → Customer(s) → Catalog/stock identities → Business rows/ledger/movement/audit/result`

No inherited alternative order is valid. The R2.4 endpoint table is superseded if it contradicts this order.

**Lock semantics**
- Operation/request unique-key claim is the idempotency/workflow mutex, not a customer balance mutex.
- Shop `FOR KEY SHARE` protects tenant row identity/existence where required. It does **not** serialize balance writers.
- Shop `FOR UPDATE` only for a true shop-wide invariant (membership/owner transfer/administration), not for all financial transactions.
- Membership `FOR UPDATE` is acquired when authorization/revocation must serialize with approval/posting.
- Customer `FOR UPDATE` is mandatory for every due/paid writer before aggregate balance read and ledger write. It is the same-customer balance serialization primitive.
- Catalog/stock row locks follow customer locks if both are needed. Multiple customers and stock rows are locked ascending stable UUID order.
- Business rows/ledger/movement/audit/result are last. Do not use ledger aggregate scan as mutex.
- FK checks, unique-index conflicts, triggers, and implicit row/index locks may introduce waits. DBA must inventory them and concurrency tests must capture lock waits/deadlocks.
- Unknown balance writers must be disabled before financial acceptance.

### 7.2 Endpoint lock application

| Workflow | required order and details |
|---|---|
| Payment | operation claim → shop KEY SHARE → membership if revocation must serialize → customer FOR UPDATE → aggregate balance read → approved overpayment policy check → paid ledger + audit + result |
| Referenced manual due | operation claim → shop KEY SHARE → authorization/membership → customer FOR UPDATE → reference uniqueness arbitration → due ledger + audit + result |
| Approved no-reference due | operation row FOR UPDATE → shop KEY SHARE → membership FOR UPDATE → customer FOR UPDATE → ledger + audit + posted operation/result |
| Memo due | memo/request operation claim → shop KEY SHARE → customer FOR UPDATE if due exists → stock/catalog locks ascending → memo/due/movement/audit/result |
| Customer create/get | request claim → shop KEY SHARE → approved identity unique arbitration; no balance mutex unless separate ledger write |
| Approval cancellation/expiry/rejection | operation FOR UPDATE → authorization; terminal transition only, no customer lock if no financial write |
| Membership revocation | shop FOR UPDATE → membership FOR UPDATE → revoke + audit; no customer locks |
| Catalog create/update | request claim → shop KEY SHARE → catalog identity unique arbitration/version row; never update identity while stock op unresolved |
| Stock opening | stock operation claim → shop KEY SHARE → catalog lock → stock identity lock → server opening action unique → opening movement + audit |
| Restock | restock request claim → shop KEY SHARE → stock row FOR UPDATE → restock movement + audit |
| Other balance writer | must first be identified, then use operation → shop → membership if needed → customer FOR UPDATE → aggregate read/write; otherwise disabled |

### 7.3 Unique conflicts / implicit lock rules
- For an absent operation row, unique-key INSERT conflict arbitration is the initial operation claim. On conflict, re-read canonical row after waiting; do not continue with caller payload.
- Do not lock customer before resolving/re-reading the canonical operation if the conflict path could acquire operation lock later.
- Membership and FK lock behavior is database-version/schema-specific; treat as DBA inventory and runtime test dependency, not assumed.
- Deadlock victim must return retryable outcome and no partial commit. Client retries with the same operation ID only.
- Lock timeout/deadlock must not create an alternate operation ID or partial audit/movement.

### 7.4 Deterministic two-session schedules

| ID | Session A | Session B | Barrier / expected order | Expected result/evidence |
|---|---|---|---|---|
| LOCK-01 | create due for C_A | payment for C_A | A acquires customer lock, B waits, A commits, B resumes | B aggregate includes due; committed rows/events exact; final balance per PO-04 |
| LOCK-02 | payment for C_A | create due for C_A | A holds customer lock until payment commit, B waits | B posts after A; no stale aggregate decision |
| LOCK-03 | pay 70 against balance 100 | pay 70 against balance 100 | both request separate IDs; first customer-lock winner commits | one payment accepted, other rejected under PO-04; balance=30 |
| LOCK-04 | financial write C_A | financial write C_B same shop | different customer rows | no shop-wide balance serialization; both may commit independently |
| LOCK-05 | memo due + stock action C_A | payment C_A | memo locks customer before stock; B waits | no customer/stock inversion; balance reflects both serial commits |
| LOCK-06 | approve pending operation | cancel/expire same operation | operation FOR UPDATE first | exactly one terminal winner; posted=>1 ledger; other terminal=>0 |
| LOCK-07 | approve no-ref due | revoke approver membership | shop→membership order | approval linearizes before revocation or rejects after; no unauthorized post |
| LOCK-08 | restock same stock | adjustment same stock | stock FOR UPDATE | movement sequence serial, quantity equals signed deltas |
| LOCK-09 | two catalog operations same identity | both attempt unique key | unique conflict arbitration | one canonical catalog identity; second conflict/recovery per PO |
| LOCK-10 | two multi-customer operations | overlapping customer sets | sorted UUID acquisition | no cyclic lock order; both commit or one retry with no partial write |

Negative schedules:
- LOCK-N01: deliberately invert customer→shop in isolated disposable harness; detect deadlock/timeout, rollback all writes. Never deploy inversion.
- LOCK-N02: deliberately invert membership→shop vs revocation; detect deadlock/timeout and no partial status/role update.
- LOCK-N03: deliberately stock→customer vs memo customer→stock; detect deadlock and rollback.
- LOCK-N04: test operation unique conflict where losing session attempts lower lock before canonical reread; implementation must prevent this sequence.
- LOCK-N05: attempt cancel/expire then continuation acquiring customer after terminal commit; reject architecture—terminal workflow cannot split into later financial phase.

Each test uses two independent DB sessions, fixed IDs, explicit begin/lock/barrier/commit order, captured SQLSTATE and `pg_locks`/wait evidence, and exact final row/balance/movement/audit assertions. All unexecuted.

## 8. Migration handoff, privileged boundaries, and audit

### 8.1 State machine

`WRITERS_DISABLED → MIGRATION_AUTHORITY_ACTIVE → BACKFILL_COMPLETE → PERMANENT_GUARD_ACTIVE → MIGRATION_AUTHORITY_REVOKED → INDEPENDENTLY_VERIFIED → WRITERS_REENABLED`

Durable phase must be recorded outside ephemeral client memory and reconciled with DB catalog evidence.

| Phase transition | Authorized actor | Preconditions / action | Evidence | Failure/recovery | Writer state |
|---|---|---|---|---|---|
| writers disabled | CH-1/DBA approved operator | revoke/disable financial writes, drain in-flight transactions, inspect active sessions | grants/feature flag/session snapshot | uncertainty→disable and drain again | OFF |
| migration authority active | controlled migration runner | ephemeral role/credential, no app/SECDEF owner membership | role graph, ticket, runner identity | role path unclear→revoke, stay disabled | OFF |
| backfill complete | runner | deterministic classification; preserve snapshots; candidate hints separated | before/after IDs/counts/digests/balance report | mismatch→rollback if possible, else reviewed restore/repair | OFF |
| permanent guard active | DBA runner | permanent trigger/ACL guard enabled, legacy rows frozen | trigger/function hash, enabled status, ACL/owner snapshot | guard uncertain→do not proceed | OFF |
| migration authority revoked | DBA/security | revoke membership/credential, NOLOGIN, remove SET/INHERIT/ADMIN paths | role catalog diff, credential closure | uncertainty→stay off and repeat closure | OFF |
| independently verified | reviewer not holding migration credential | inspect catalog, roles, grants, legacy rows, balances, negative test evidence | signed evidence bundle | any mismatch→WRITERS_DISABLED | OFF |
| writers reenabled | CH-1 + DBA/security | only approved writer paths enabled | grant diff, acceptance signoff | any partial/unknown enable→disable all | ON only after gate |

No GUC, session variable, JWT claim, client argument or caller-provided flag can activate migration exception. Migration authority must be a reviewed DB role/credential boundary. Migration role cannot own SECURITY DEFINER functions and must not be reachable by application/service/function-owner roles via SET ROLE, INHERIT or ADMIN OPTION. Table owner/superuser can disable triggers: this is an acknowledged privileged boundary, monitored through external dual approval/audit.

Connection loss: read durable DB phase + external audit and catalog; do not infer success from runner timeout. Backfill already committed with mismatch: do not blindly rerun/rollback; preserve evidence and use reviewed forward repair/restore. Writers remain disabled after any uncertain transition.

### 8.2 Audit
- Ordinary auth/anon/service roles cannot update/delete audit, ledger or posted provenance.
- Corrections are new append-only events referencing prior record, reason, actor, timestamp and approval ticket.
- Catalog audit completeness is claimed only if all direct catalog write paths are revoked and RPC writes operation+catalog+audit atomically.
- Function owner/table owner/DBA/superuser remains privileged residual. Use external break-glass record with approver, ticket, SQL/script digest, target, start/end, outcome, and independent review.
- Do not claim a trigger makes owner/superuser mutation impossible.

## 9. Catalog, stock, customer identity and recovery (PO-gated)

### 9.1 Catalog/stock contract
- PO-06 and PO-10 remain pending; do not choose final identity unique keys or catalog↔stock cardinality.
- Generic enforcement: catalog operation ID stable; stock operation ID stable; same ID+same canonical payload returns original entity/result; same ID+changed payload rejects.
- Opening action ID is generated once by server and persisted on durable stock operation; client cannot provide, reset or regenerate it.
- Exactly one opening movement per canonical opening action. Unique enforcement is required at the business-action identity—not merely request ID.
- Restock is a separate movement type and movement ID; it cannot reuse opening action or silently create a second opening.
- Same-ID response-loss recovery returns original movement ID/stock result. A new ID attempting duplicate opening is rejected by approved identity/business-action constraint.
- If local operation storage is lost, server lists all unresolved operations with operation ID, status, catalog/stock IDs, canonical payload digest, opening movement ID, and last transition. No automatic new opening ID.
- Catalog identity update uses expected version and is blocked while stock/opening operation unresolved. No automatic product merge.
- Every dependent write/index remains disabled until PO-06/10 approval and DBA schema review.

### 9.2 Catalog tests CAT-01–10
CAT-01 same catalog operation ID/payload: return original catalog ID, one catalog row, one audit event.  
CAT-02 same catalog ID with changed payload/version: conflict, original row/version/hash unchanged.  
CAT-03 two IDs same eventual PO identity concurrently: unique conflict/review, no duplicate catalog identity.  
CAT-04 opening commit response lost: same stock operation returns original movement ID, one movement, quantity unchanged on replay.  
CAT-05 new operation ID repeats opening action for same approved stock identity: reject; no second opening movement.  
CAT-06 restock uses separate movement ID/type: quantity changes by restock delta, opening count remains one.  
CAT-07 same restock ID replay: same movement ID, no second quantity delta.  
CAT-08 identity update during unresolved opening/restock: reject/defer; catalog version unchanged.  
CAT-09 stale expected_version: conflict; no catalog/audit write.  
CAT-10 local storage lost: recovery query returns each unresolved operation and stable IDs; no automatic create/opening.

### 9.3 Customer create-or-get
- PO-07 identity key pending. Do not assume phone-only, phone+name, or other unique identity.
- Stable shop-scoped operation ID + canonical payload/hash/version; same ID same payload returns canonical customer; changed payload rejects.
- Distinct IDs colliding under future PO identity produce conflict/review; no auto merge.
- Cross-shop customers remain separate.
- Customer creation and later memo/Baki posting are distinct durable outcomes; UI cannot imply atomicity across separate RPCs.
- Recovery after local storage loss lists operation ID/status/customer ID.

CUST-01 same ID/same payload: one customer and one creation event, replay same ID.  
CUST-02 same ID/changed payload: conflict, original customer unchanged.  
CUST-03 distinct IDs under same approved identity key: conflict/review, no merge.  
CUST-04 same identity-like data in different shops: separate customers.  
CUST-05 local storage loss: server recovery returns canonical customer ID/status.

## 10. PO-01–PO-10 decision register

All **PENDING**. The recommendations below are CH-3 proposals only, not approvals.

| PO | Decision/options | CH-3 recommendation (not approval) | Affected schema/workflow | Blocked module/index | Required approval evidence |
|---|---|---|---|---|---|
| PO-01 approval authority | shop owner only / manager / delegated roles | owner-only until role model proven | approval actor and membership check | no-reference approval RPC | named PO, chosen role, rationale, date, signed decision |
| PO-02 expiry | fixed TTL / configurable / no expiry | server-controlled fixed TTL pending product review | expires_at/expiry worker | expiry and revival rules | exact duration/timezone/clock policy approval |
| PO-03 reference uniqueness | customer scoped / shop scoped / cross-kind | customer-scoped with explicit reference kinds | reference indexes and UX | reference uniqueness index | collision examples and chosen policy |
| PO-04 payment | aggregate balance / allocation / allow overpay | aggregate balance, reject overpayment pending accounting | payment validation | payment writer and UX | signed accounting policy and examples |
| PO-05 legacy balance | include / exclude / separate unknown | label unclassified; accounting policy decides display | aggregate/dashboard | legacy balance inclusion | signed treatment for due/paid legacy cases |
| PO-06 catalog identity | SKU/barcode/name+variant/other | explicit shop-scoped identity with variant fields | catalog uniqueness | catalog identity index/RPC | sample duplicate/variant cases and decision |
| PO-07 customer identity | phone / phone+name / other / no dedupe | explicit shop-scoped key; avoid auto-merge | customer create/get | customer unique index | chosen normalization/collision policy |
| PO-08 second approver | owner / delegated manager / member | owner-only until delegation approved | membership/approval | role authorization | role matrix, revocation policy, audit approval |
| PO-09 exception controls | reason only / amount cap / daily cap / reason list | mandatory reason; cap remains unresolved | no-reference approval | risk limit rules | limits, reason taxonomy, exception escalation |
| PO-10 catalog/stock relation | one stock row/catalog / variants / separate | keep identity separate until variant policy approved | catalog-stock FK/cardinality | stock/catalog constraints | physical inventory model and variant examples |

No implementation may infer approval from a CH-3 recommendation, chat shorthand, or undocumented verbal decision. PO approval evidence must be attached/linked in a future reviewed decision record.

## 11. Consolidated T01–T63 test specification

**Important execution status:** T01–T63 are **PROPOSED / NOT EXECUTED**. No test below is a PASS. The specs are deterministic design contracts. Exact RPC names/SQLSTATE domain codes must be frozen against approved implementation before test execution; until then, expected errors are categorized as SQLSTATE or named domain conflict and are not runtime claims.

### 11.1 Global test fixture and evidence contract

Synthetic fixture, isolated disposable database only:
- Tenant/shop: `S_A=10000000-0000-4000-8000-000000000001`, `S_B=10000000-0000-4000-8000-000000000002`.
- Users: `U_OWNER_A=20000000-0000-4000-8000-000000000001`, `U_CREATOR_A=...0002`, `U_APPROVER_A=...0003`, `U_MEMBER_REVOKED=...0004`, `U_OWNER_B=...0005`.
- Customers: `C_A1=30000000-0000-4000-8000-000000000001`, `C_A2=...0002`, `C_B1=...0003`.
- Memo: `M_A1=40000000-0000-4000-8000-000000000001`, shop S_A/customer C_A1.
- Catalog/stock: `P_A1=50000000-0000-4000-8000-000000000001`, `ST_A1=60000000-0000-4000-8000-000000000001`.
- Each test seeds fresh operation/request IDs (prefix `OP_Txx`); retries reuse same ID. UUID values must be generated once and recorded in evidence. Never reuse cross-test IDs.
- DB roles: authenticated app role; service role; approved RPC/function owner; table owner; migration role; DBA/superuser break-glass. Use only isolated test DB for privileged tests.
- Canonical request payload v1 uses exact decimal amount string, UUID canonical lowercase, stable ordered keys, explicit null/absent distinction, normalized approved text, UTC RFC3339 timestamps. Hash=SHA-256 over UTF-8 canonical bytes. Never use JS float.
- Every test records DB version/migration SHA, schema/ACL snapshot, actor auth subject (not token), session_user/current_user/function owner, operation/request ID, canonical payload/hash/version, exact RPC/SQL/action, timestamps/barriers, SQLSTATE/domain result, before/after row IDs/counts, aggregate balance, stock quantity/movement IDs, operation status/canonical IDs, audit event IDs/count/digest, and rollback/absence-of-partial-write evidence.
- Expected row counts are scoped to the test’s fresh IDs. No unmentioned rows may appear. Each write transaction is all-or-nothing. Concurrency tests require two independent sessions, explicit barriers and logged ordering.
- Balance convention is due minus paid for a customer; test expected balance is computed from committed ledger only. Payment overpayment behavior is PO-04 gated; where policy is pending, the test expects the writer to remain disabled rather than assume behavior.
- A result is not accepted if only RPC text is captured; committed database state and evidence query must be captured.

### 11.2 Test definitions

| ID | Objective / preconditions and exact seed | Actor/session; operation; payload/action | Expected result/error | Exact committed-state/evidence assertion |
|---|---|---|---|---|
| T01 | S_A/C_A1/M_A1; memo due=100; item P_A1 stock=5; all zero before | U_OWNER_A/auth; OP_T01; memo create with due 100 and stock decrement 1 | success, one canonical memo result | memo + due ledger + stock movement each 1; due=100, stock=4; audit event IDs exactly defined by RPC contract; no orphan |
| T02 | T01 canonical request already committed | same actor/session OP_T01 exact payload | idempotent replay | same memo/ledger/movement IDs; row counts unchanged; no new financial audit/post event |
| T03 | OP_T01 exists; alter due 100→101 or item qty | same operation ID, changed payload | payload conflict | original rows/hash/balance/stock unchanged; no new audit/movement |
| T04 | S_A/C_A1/M_A1 memo due source absent in ledger | auth memo RPC | duplicate memo-origin due insertion attempt | second row rejected by unique/FK/RPC; memo due row count remains 1; balance unchanged |
| T05 | S_A/C_A1; ref `INV-A-001` unused | U_OWNER_A auth; OP_T05 manual referenced due amount 80; normalized ref=INV-A-001 | success if PO-03 policy enabled | one manual due row; source_memo_id NULL; approval fields NULL; reference fields exact; balance +80; audit 1 posting |
| T06 | T05 reference exists in selected scope | U_OWNER_A; OP_T06 different ID same ref/amount | reference conflict | no new ledger row; balance unchanged; evidence shows unique key conflict |
| T07 | memo note contains shortened UUID alias, no authoritative memo source | auth manual due request | alias must not be classified as memo source | manual origin/reference behavior only; source_memo_id NULL; no guessed FK |
| T08 | C_A1 due balance=100; payment request amount=70 | Session A OP_T08A payment; Session B OP_T08B payment; barrier customer lock | one succeeds, second follows PO-04 and fresh balance | customer lock serializes; accepted paid rows=1 or policy-approved count; final due-paid=30 if reject overpay; second result exact policy error; no partial writes |
| T09 | T08 same exact operation OP_T09 | two sessions same actor/operation/payload | one canonical operation result | one payment ledger row/event; both return same result ID; balance effect once |
| T10 | OP_T09 posted amount 70; retry amount 71 | auth same op ID altered payload | conflict | original row/hash unchanged; no additional paid row/event |
| T11 | legacy row with unknown provenance fixture, balance unchanged | auth/service attempts financial writer using NULL required source/provenance | fail closed | no new ledger/operation; legacy row unchanged; exact SQLSTATE/domain error captured |
| T12 | S_B/C_B1 data and S_A actor | U_OWNER_A requests S_B customer/memo operation | tenant authorization/FK rejection | zero S_B/S_A rows altered; no ledger/audit except permitted security telemetry |
| T13 | baseline direct table INSERT path | authenticated client role direct insert into ledger | permission denied (42501) | no ledger row; no balance effect; ACL evidence |
| T14 | anonymous role attempts customer/ledger protected read | anon session | denied or only explicitly public policy fields | no sensitive rows returned; RLS/ACL query evidence |
| T15 | financial RPC inject failure after ledger insert before result/audit | auth OP_T15 disposable fault hook | transaction error | zero committed ledger/operation/result/audit writes; balance unchanged |
| T16 | stock operation commits opening movement but client response dropped | auth OP_T16 stock open qty=10 | simulated timeout | DB has one stock operation and one opening movement; client recovery required |
| T17 | stock operation fails before commit, confirmed rollback | auth OP_T17 qty=4 | error | no stock operation/movement committed; same ID retry succeeds once |
| T18 | catalog-only create, no stock opening | auth OP_T18 | success if catalog module PO-approved; else disabled | catalog row/op/audit exactly one; no stock row/movement; audit completeness depends direct-write ACL |
| T19 | ambiguous legacy row: source hint/short UUID only | migration fixture | classify legacy_unclassified | amount/type/shop/customer unchanged; source_memo_id NULL; candidate metadata exact raw hint; balance unchanged |
| T20 | existing schema baseline snapshot | DBA migration rehearsal | migration preflight | schema inventory and migration plan evidence; no runtime PASS; no mutation to prod |
| T21 | empty disposable DB | DBA fresh install rehearsal | approved migration sequence only | expected schema/roles/constraints snapshot; no data; runtime execution separately approved |
| T22 | migration interruption injected at each phase | migration role/runner | fail/connection loss | phase persisted; writers OFF; no blind rerun; catalog/audit evidence and recovery path |
| T23 | memo shop S_A/customer C_A2, ledger customer C_A1 | direct/RPC attempt memo source mismatch | composite FK/RPC reject | no due row; memo/stock transaction rolled back |
| T24 | customerless memo, due>0 | auth memo RPC | reject | memo/due/stock writes all zero for request; no balance change |
| T25 | stock qty=10; two sessions sell/adjust overlapping item | OP_T25A/B, stock FOR UPDATE barrier | serial movements; reject invalid negative quantity | movement IDs distinct; final quantity equals initial+committed deltas; no lost update |
| T26 | posted memo/ledger existing | auth attempt edit/cancel posted financial record | denied; correction workflow only | original ledger digest/balance unchanged; no delete/update; correction event only if approved |
| T27 | C_A1 ledger has due 100, paid 30, due 20 | read aggregate | balance=90 | query returns 90; ledger count=3; no memo-level allocation inferred |
| T28 | pending no-ref approval OP_T28 amount=50; creator U_CREATOR_A, approver U_APPROVER_A | submit then approve in separate auth sessions | submit pending; approval succeeds if role policy approved | pending stage: op=1, ledger=0, balance unchanged; posted: op=1 posted, ledger=1, approved fields NN, balance +50, audit submit/post each exactly once |
| T29 | pending OP_T29 creator U_CREATOR_A | same creator attempts approve; then unauthorized actor | self/unauthorized rejected | operation remains pending; ledger=0; no approval event; audit/security evidence only |
| T30 | customerless memo with receivable due>0 | auth memo create | reject | memo/due/stock writes all 0; balance unchanged |
| T31 | customerless memo with due=0 | auth memo create | success only if baseline product allows | memo=1; ledger=0; no customer FK fabrication; stock effect exactly requested |
| T32 | ledger source/customer/shop mismatch combinations | auth/direct | composite FK/CHECK reject | no invalid ledger row; each violation SQLSTATE 23503/23514 or frozen RPC code |
| T33 | C_A1 due balance 100; two payment requests 60 and 50 | two sessions, customer mutex barrier | second rechecks after first commit; PO-04 governs | if overpay rejected, one paid row=60, one rejection, balance=40; no partial second payment |
| T34 | C_A1 due=100; due +40 races with payment 120 | two sessions | both lock same customer; fresh aggregate order | final balance and payment result follow serial order and approved PO-04; no stale-read overpay |
| T35 | stock/catalog operation persisted; app reloads | same operation ID recovery RPC | return server canonical status/entity | IDs and payload digest match original; no new catalog/stock/movement |
| T36 | stock opening response lost after commit | OP_T36 same ID recovery | canonical recovery | same movement ID, one opening movement, quantity unchanged on read/replay |
| T37 | OP_T37 failure conclusively rolled back | same ID/same payload retry | success | one operation and one movement after retry; no prior partial event |
| T38 | catalog-only create/update without stock | auth OP_T38 | catalog-only state | catalog operation/audit one; stock/movement count=0; direct write denied if audit guarantee |
| T39 | legacy Baki UI displays unclassified source | read/auth | no inferred memo linkage | source label says unclassified/unknown; source_memo_id NULL; no memo association |
| T40 | pending no-ref OP_T40; creator and approver IDs equal | creator tries approval | reject self-approval | pending unchanged; ledger=0; approver field NULL; no approval event |
| T41 | client submits forged approver UUID | auth submit/approve payload | server ignores/rejects forged actor; trusted auth subject used | no forged approver persisted; operation state unchanged |
| T42 | non-authorized user attempts approve | authenticated wrong membership/role | authorization denied | operation pending; ledger=0; balance unchanged; role/membership evidence |
| T43 | operation payload/hash/version tampered or replay changed | approval session | mismatch conflict | no ledger; original canonical payload/hash/version unchanged |
| T44 | migration guard bypass attempt via app/service/SECDEF role | separate roles | deny; only controlled migration principal can backfill | no legacy origin/source mutation; role graph/session evidence; writers remain OFF |
| T45 | exhaustive provenance field-by-field matrix | synthetic fixtures for each valid branch; mutate each field individually incl NULL | invalid row denied by CHECK/FK/RPC; valid row allowed | exact expected NULL/NN branch values; no accidental CHECK NULL pass; evidence includes every column |
| T46 | memo due and payment same C_A1 | two sessions | customer lock serializes | due and paid rows committed in serial order; aggregate correct; no stale validation |
| T47 | referenced manual due and payment same C_A1 | two sessions | same customer lock protocol | final aggregate equals committed due-paid; reference uniqueness preserved |
| T48 | catalog search all known balance writer paths | DBA catalog inventory | unknown/direct writer found | writer disabled; no financial acceptance until inventory evidence proves only approved paths |
| T49 | catalog creation saved and client reload | same OP_T49 recovery | return canonical catalog ID/version | one catalog row/op/audit; no duplicate create |
| T50 | stock movement commit and response loss | OP_T50 | same ID recovery | one movement and one quantity delta; returned canonical IDs |
| T51 | opening stock succeeded but client creates new operation ID | same stock identity/new ID | duplicate opening denied | opening movement count remains 1; quantity unchanged; rejection evidence |
| T52 | concurrent two stock identities with same approved catalog/variant key | two sessions | unique index arbitration (PO-06/10 only after approval) | one canonical identity or deterministic conflict; no duplicates |
| T53 | audit event exists | auth/service attempt update/delete; then approved correction | original mutation denied; correction append | original event digest same; new correction event has actor/reason/reference |
| T54 | customer create commit response lost | OP_T54 same operation recovery | return canonical customer ID | one customer/operation/event; no duplicate |
| T55 | pending OP_T55 expiry time passed | approve RPC and expiry worker | server clock marks expired; approval denied | status expired; ledger=0; expiry event exactly one; no balance effect |
| T56 | migration complete and migration role revoked | app/service/function-owner SET ROLE or legacy write | denied | role membership/ACL snapshot shows closure; legacy rows unchanged |
| T57 | audit row UPDATE/DELETE via direct/SECDEF | auth/service/SECDEF | permission/trigger denial | audit count and original digest unchanged; privileged owner case separately documented |
| T58 | full function overload, owner, ACL, search_path, trigger and role inventory | DBA read-only catalog queries | inventory matches approved allowlist | evidence contains signatures, owner, ACL, security definer flag, search_path, role edges; any unknown path blocks |
| T59 | inject failure after each write boundary in financial and stock transactions | test RPC/harness | transaction abort | no partial rows across ledger/operation/audit/movement/result; balances/qty unchanged |
| T60 | wipe local app operation storage with unresolved requests | authenticated recovery endpoint | server lists unresolved operations | all server operations returned with stable IDs/status/digests; client does not create new operation/opening IDs |
| T61 | catalog audit completeness | attempt direct catalog DML plus approved RPC | direct DML denied; RPC writes row+audit atomically | no unaudited catalog mutation; operation/catalog/audit counts exactly match |
| T62 | customer identity collision using two operation IDs | PO-07-approved identity fixture | conflict/review; no automatic merge | two customer rows not silently merged; no unauthorized duplicate if unique policy chosen; audit/conflict evidence |
| T63 | role/overload/SECURITY DEFINER boundary | authenticated, service, function owner, table owner, import, migration, DBA/superuser test sessions | ordinary roles denied; approved RPC owner allowed only scoped; privileged break-glass explicitly classified | catalog snapshots, SQLSTATE, row counts; no claim owner/superuser protection |

**T01–T63 completeness:** all 63 IDs are individually defined above with objective, fixture/preconditions, actor/session, operation/action, expected result, committed-state/evidence assertions. Some exact production RPC names, approved domain error codes, PO-dependent behavior, and DB role names remain implementation/PO/DBA dependencies; no test has been executed. This is a test specification, not acceptance evidence.

## 12. Supplemental test family consolidation

All supplemental tests are PROPOSED / NOT EXECUTED. Each must use the global evidence contract in §11.1. Actor/session, action, result/error, committed-state and evidence are specified below.

### PNV-01–35 — provenance negative matrix
Fixture: S_A/C_A1/M_A1, creator U_CREATOR_A, approver U_APPROVER_A; each test fresh row/operation. Run auth RPC/direct auth, service, alternate SECURITY DEFINER where permitted; privileged owner tests in isolated DB only.

| ID | actor/action | expected result | committed state/evidence |
|---|---|---|---|
| PNV-01 | auth/direct insert new ledger creator=NULL | reject NN | ledger=0, balance unchanged |
| PNV-02 | U_CREATOR_A supplies creator=U_APPROVER_A | reject/ignore caller actor | stored actor absent because no row; auth subject recorded |
| PNV-03 | referenced due with approver non-NULL | reject CHECK/RPC | ledger=0 |
| PNV-04 | nonexception due approved_at non-NULL | reject | ledger=0 |
| PNV-05 | nonexception due approval_method non-NULL | reject | ledger=0 |
| PNV-06 | nonexception due approval operation ID non-NULL | reject | ledger=0 |
| PNV-07 | nonexception due hash/version non-NULL | reject | ledger=0 |
| PNV-08 | no-ref posted row approver NULL | reject | operation pending; ledger=0 |
| PNV-09 | no-ref posted approved_at NULL | reject | ledger=0 |
| PNV-10 | no-ref posted approval method NULL | reject | ledger=0 |
| PNV-11 | no-ref posted operation ID NULL | reject | ledger=0 |
| PNV-12 | no-ref posted hash/version NULL | reject | ledger=0 |
| PNV-13 | creator=approver | RPC auth rejects self; CHECK inequality only shape | pending; ledger=0 |
| PNV-14 | operation tuple/customer/amount differs from ledger | deferred binding rejects commit | transaction rollback; original op unchanged |
| PNV-15 | payload hash differs from server recompute | reject hash mismatch | no post/ledger |
| PNV-16 | manual due/payment source_memo_id non-NULL | FK/CHECK reject | no ledger |
| PNV-17 | memo due source_memo_id NULL | memo RPC reject | memo/stock/due transaction rollback |
| PNV-18a | source memo wrong shop | composite FK/RPC reject | no ledger |
| PNV-18b | source memo same shop wrong customer | composite FK/RPC reject | no ledger |
| PNV-19 | memo origin + paid direction | reject prohibited branch | no ledger |
| PNV-20 | referenced due raw reference NULL | reject | no ledger |
| PNV-21 | referenced due normalized reference NULL | reject | no ledger |
| PNV-22 | referenced due kind NULL | reject | no ledger |
| PNV-23 | referenced due exception=true | reject | no ledger |
| PNV-24 | no-ref due raw/normalized reference non-NULL | reject per approved no-reference branch | no ledger |
| PNV-25 | no-ref reason code/text NULL | reject | pending or no op; no ledger |
| PNV-26 | confirmation false/NULL/timestamp NULL | reject | no post |
| PNV-27 | payment includes due-reference/exception/approval fields | reject each independent mutation | no paid row |
| PNV-28 | legacy row fabricated approver/time/method/hash | migration fixture denied unless source evidence/approved legacy branch | row unchanged |
| PNV-29 | ordinary app attempts missing historical creator update | deny | legacy row unchanged |
| PNV-30 | mutate each posted provenance field individually | auth/service/SECDEF deny | digest/count unchanged |
| PNV-31 | mutate origin/type/amount/customer/shop/source | deny | ledger/balance unchanged |
| PNV-32 | invalid reason/method/ref-kind/confirmation enum | reject | no invalid row |
| PNV-33 | NULL every nullable CHECK operand branch-by-branch | reject where required; permit only matrix-defined NULL | total truth-table evidence |
| PNV-34 | direct write auth/service/function owner/table owner/import/nested SECDEF | ordinary roles denied; owners/superuser privileged boundary | role/ACL evidence; no ordinary mutation |
| PNV-35 | mutate operation/hash/linkage fields after submission | deny | payload/hash/linkage unchanged |

### MIG-01–10 — migration authority and guard
Use controlled runner + app/service/function-owner/table-owner sessions in disposable DB. Include external audit record.

| ID | actor/action | expected result | committed state/evidence |
|---|---|---|---|
| MIG-01 | auth SET ROLE migration principal | denied | no role activation; role graph snapshot |
| MIG-02 | service SET ROLE migration principal | denied | no activation |
| MIG-03 | SECDEF owner has SET/INHERIT migration path | preflight fails closed | writers remain OFF |
| MIG-04 | grant ADMIN OPTION migration role to app role | denied/review | no membership change |
| MIG-05 | nested SECDEF invokes migration helper | denied unless exact controlled runner context | no legacy write |
| MIG-06 | function owner inserts/updates legacy source/origin | denied by permanent guard/ACL | legacy rows unchanged |
| MIG-07 | caller GUC/JWT/arg spoofing migration mode | denied | no write |
| MIG-08 | after credential revoke, legacy write | denied | row unchanged; role closure evidence |
| MIG-09 | table owner/superuser break-glass | classified privileged residual; requires external dual approval and alert | external ticket + SQL digest; no normal-pass claim |
| MIG-10 | DBA catalogs roles/owners/grants/default ACLs/SECDEF | any unknown path blocks | signed inventory, writers OFF |

### ADV-01–15 — adversarial and concurrency
Each concurrency case: independent sessions, exact operation IDs, barrier event, commit order, SQLSTATE, final balance/stock/audit.

| ID | action | expected | evidence |
|---|---|---|---|
| ADV-01 | revoke membership races approval | membership lock linearizes | posted only if approval before revoke; otherwise deny |
| ADV-02 | approval races cancel | operation lock serializes | exactly one terminal state; ledger 1 iff posted |
| ADV-03 | approval races expiry | server-time/operation lock serializes | expired => ledger 0; posted => ledger 1 |
| ADV-04 | no-ref due approval races payment | customer lock serializes balance | final aggregate consistent |
| ADV-05 | memo due races approval | same customer order | both rows or one policy rejection; no partial transaction |
| ADV-06 | deliberately inverted lock order in harness | deadlock/timeout expected | rollback, no partial writes; never production |
| ADV-07 | migration privilege escalation | app/service/SECDEF cannot assume role | role snapshots and denied SQLSTATE |
| ADV-08 | audit update/delete through ordinary/SECDEF path | denied | original digest unchanged |
| ADV-09 | all provenance branches mutated | reject invalid branches | PNV evidence and zero invalid rows |
| ADV-10 | two stock operations same identity | unique arbitration | one canonical identity or conflict |
| ADV-11 | PO-approved different variants | distinct identities only if PO says | exact catalog/stock rows per approved model |
| ADV-12 | response loss then new-ID duplicate opening | same-ID recovery works; new-ID denied | opening movement count=1 |
| ADV-13 | identity update during pending stock | reject/defer | version unchanged |
| ADV-14 | customer identity collision different IDs | conflict/review; no merge | customer IDs unchanged, conflict evidence |
| ADV-15 | failure at ledger/audit/result/movement write | transaction rollback | all related counts zero or prior canonical state; balance/qty unchanged |

### LOCK-01–10 / LOCK-N01–05
Definitions and deterministic schedules in §7.4 are normative. Each uses two sessions, barrier and expected committed state. LOCK-N01–05 intentionally unsafe inversions only in a disposable harness and must show rollback/no partial writes.

### LEG-01–08 — historical source memo candidate
| ID | actor/action | expected | evidence |
|---|---|---|---|
| LEG-01 | auth INSERT legacy source_memo_id | deny | no ledger/candidate mutation |
| LEG-02 | auth UPDATE legacy source_memo_id | deny | row unchanged |
| LEG-03 | service/alternate SECDEF source update | deny | row unchanged; role evidence |
| LEG-04 | migration moves historical hint | source_memo_id NULL; candidate preserved unverified | counts/digest/balance unchanged |
| LEG-05 | candidate references wrong-shop/nonexistent memo | retain only as non-authoritative candidate | no FK/ledger impact |
| LEG-06 | auth edits candidate/status | deny | candidate digest unchanged |
| LEG-07 | correction candidate | append superseding candidate | old candidate immutable; new event linked |
| LEG-08 | candidate marked verified without reclassification | origin stays legacy | no source FK/balance change |

### CAT-01–10
Normative exact cases in §9.2; run under app/auth and RPC-owner contexts. Assert catalog, stock, operation, movement and audit row counts/IDs; opening quantity once; no direct catalog DML if audit is guaranteed.

### CUST-01–05
Normative exact cases in §9.3. Assert shop-scoped customer ID, operation payload digest, duplicate/merge behavior and event count.

### AUD-01–05
| ID | actor/action | expected | evidence |
|---|---|---|---|
| AUD-01 | auth/service UPDATE/DELETE audit | 42501/trigger deny | row count/digest unchanged |
| AUD-02 | alternate SECDEF mutation | deny unless approved owner boundary | function owner/ACL snapshot |
| AUD-03 | correction RPC appends new event | success if approved | old event unchanged; new event references old with actor/reason |
| AUD-04 | direct catalog DML when audit guarantee asserted | deny | no catalog row; ACL evidence |
| AUD-05 | DBA/superuser break-glass in isolated test | privileged residual, external ticket/dual approval required | external evidence and independent review |

## 13. Migration preflight, rollback, and runtime evidence gates

Before future implementation/runtime:
- Verify exact schema, column types, existing constraints/FKs/indexes/triggers, every function overload/owner/security-definer/search_path, RLS policies, grants/default ACLs, role membership, migration history and app call sites.
- Compare the proposed logical field matrices against actual database columns. Any mismatch requires CH-1/CH-4/DBA review, not silent adaptation.
- Snapshot row IDs, amounts, direction, shop/customer, memo sources, aggregate balances, stock quantities, catalog identities, role/ACL catalog and migration version.
- No `IF NOT EXISTS` used to hide unexpected object definitions. Verify index validity and transactional/nontransactional DDL effects.
- Writers disabled/drained during migration; migration state machine §8 followed exactly.
- Before financial acceptance: execute T01–T63 and all supplemental families in isolated staging, deterministic two-session concurrency, role/ACL negative tests, failure injection, local-storage recovery, and backup/restore rehearsal.
- Record DB version, exact migration commit, role/session identity, test fixtures, result SQLSTATE, row IDs/counts, balances, stock, audit digests, logs and independent reviewer signoff.
- Any unknown writer, privileged path, test gap, schema mismatch, data mismatch, or uncertain migration phase => writers remain disabled.

## 14. Residual risks

- Table owner/DBA/superuser can bypass ordinary database controls; external dual-control evidence is required.
- PO-01/02/03/04/05/06/07/08/09/10 choices affect schema, UX and accounting.
- Legacy historical actor/source provenance may be unknowable; never fabricate.
- Customer mutex may reduce throughput for hot customers; optimize only after correctness and measurement.
- Operation hash/canonicalization upgrades require version-pinned replay.
- Unique/FK/trigger implicit locks and deadlock behavior are PostgreSQL-version/schema-specific and require runtime verification.
- Client timeout means unknown outcome, not failure; stable ID recovery is mandatory.

## 15. Completion report / stop condition

R2.5 is a design closure candidate only. CH-1 and CH-4 must independently review this document. Product Owner approvals, DBA/security review and runtime execution remain outstanding.

- **Implementation approval:** NOT GRANTED.
- **Financial pilot:** NO-GO.
- **No application code or SQL migration:** confirmed by scope.
- **No database/staging/production access or mutation:** confirmed.
- **No runtime tests or PASS claims:** confirmed.
- **No merge/deployment/main change:** confirmed.
- **Stop after R2.5 draft PR submission.**
