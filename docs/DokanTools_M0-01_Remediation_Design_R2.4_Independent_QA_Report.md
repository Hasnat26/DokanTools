# DokanTools — M0-01 Remediation Design R2.4 Independent QA Report

**Role:** CH-4 Independent QA & Test Engineer  
**Repository:** Hasnat26/DokanTools  
**Reviewed PR:** https://github.com/Hasnat26/DokanTools/pull/8  
**Reviewed document:** `docs/M0-01_Remediation_Design_R2.4.md`  
**Reviewed head:** `f3772c95ce40b9d5a7526ae6764f8f0896b69b05`  
**Document blob SHA:** `7494b82e8592efe8dfdd41101c6d615d58d95b1e`  
**PR #8 base:** `18fbb6aca6919e39bacca9f889b8a02573d9fd97`  
**QA branch:** `qa/ch4-m0-01-r2-4-independent-report`  
**QA branch base:** `efa7d5da139030c092089831f813df697eaed71e`

---

## 1. Executive decision

# NEEDS REVISION

**Overall severity: HIGH**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.4 is a meaningful design improvement. It directly resolves important R2.3 issues: legacy `source_memo_id` is separated from unverified candidate hints; a migration handoff state machine is specified; a customer-row `FOR UPDATE` balance mutex is explicitly distinguished from shop `FOR KEY SHARE`; a provenance matrix and per-field negative test inventory are added; and approval-to-ledger replay/cardinality requirements are made more explicit.

R2.4 is not ready for implementation approval. The most material defects are: (1) the F22 mapping is still incorrect in §3; (2) the provenance matrix is not fully total and mixes operation-only lifecycle states into a ledger matrix; (3) the approval-to-ledger relationship does not fully enforce the stated bidirectional cardinality; (4) lock modes/order remain inconsistent across the inherited and consolidated specifications; and (5) the T01–T63 package is not fully expanded or unambiguously bound to exact inherited document revisions. These are design/specification findings, not runtime findings.

## 2. Review scope and evidence basis

Reviewed directly from GitHub:
- R2.4 at the exact supplied PR #8 head SHA.
- The actual R2.2 QA report in PR #5.
- The actual R2.3 QA report in PR #7.
- R2, R2.1, R2.2 and R2.3 design material at the repository revisions referenced by the prior QA history, to inspect inherited test specifications and continuity.
- PR #8 metadata, base/head, changed-file list, and review/comment state.

PR #8 is open, draft, unmerged, and has one changed file: `docs/M0-01_Remediation_Design_R2.4.md`. Its head matches the supplied SHA. PR #8 was not modified by this review.

Evidence labels:
- **VERIFIED — source review:** directly visible in the specified GitHub document or PR metadata.
- **DESIGN DEFECT:** proposed invariant is incomplete or internally inconsistent.
- **DESIGN AMBIGUITY:** materially different implementations remain possible.
- **PARTIALLY ADDRESSED:** improved in R2.4 but a required acceptance condition remains open.
- **UNVERIFIED — runtime:** requires database or application execution; no such execution was performed.

No SQL migration, application implementation, staging database or production database was accessed or mutated. No runtime test was executed.

## 3. Prior finding traceability — F22-01 through F22-11

**HIGH finding: R2.4 §3 still contains the incorrect F22-06 and F22-08–F22-11 mapping.** The PR #7 QA report explicitly corrected this against the actual PR #5 report. R2.4 §3 repeats the wrong assignments:

| Finding | Actual PR #5 finding | Correct R2.4 disposition target | R2.4 status |
|---|---|---|---|
| F22-01 | CHECK constraint does not define a complete approval-field matrix | §§30–31; PNV-01–35 | PARTIALLY ADDRESSED; total field predicate still incomplete |
| F22-02 | Two-step approval requires explicit trusted database identity contract | §§19, 31; ADV-01/06/07 | SUBSTANTIALLY ADDRESSED; trusted identity and DB/runtime contract still require DBA verification and PO role decision |
| F22-03 | Migration-only guard: `current_user` requires closed role-membership and ownership design | §§20, 32; MIG-01–10 | SUBSTANTIALLY ADDRESSED; lifecycle state machine specified, runtime closure unverified |
| F22-04 | Composite FK model sound in principle; final CHECK/nullability needs completion | §§30, 31; PNV-16–19/33/34 | PARTIALLY ADDRESSED; branch-specific provenance cells and enforcement details remain open |
| F22-05 | Lock order coherent but operation-row workflow needs precise lock graph | §§21, 33; ADV-01–06; LOCK cases | PARTIALLY ADDRESSED; inconsistent lock mode/order and schedule specificity remain |
| F22-06 | Atomic financial idempotency is separated from durable pending workflows | R2.2 §8 retained; R2.4 §§31–32 and related workflow definitions | ADDRESSED AT DESIGN LEVEL; runtime unverified |
| F22-07 | Durable catalog/stock recovery improved but needs final identity constraints | §§34; ADV-10–13; CAT-01–10 | PARTIALLY ADDRESSED; PO-06/PO-10 still block exact unique keys/cardinality |
| F22-08 | Catalog audit claim correctly bounded; direct catalog paths must be disabled | §§9.6, 24, 34, 36; T18/T38/T61; AUD-04 | ADDRESSED AT DESIGN LEVEL; direct write revocation/catalog verification unexecuted |
| F22-09 | Customer create-or-get remains PO-dependent | §§25, 37; ADV-14; CUST-01–05 | ADDRESSED AS FAIL-CLOSED DESIGN; PO-07 remains pending |
| F22-10 | Audit immutability is appropriately qualified | §§11, 24, 36; ADV-08; AUD-01–05 | ADDRESSED AT DESIGN LEVEL; owner/trigger/ACL runtime verification outstanding |
| F22-11 | PO decisions materially affect schema/security and must be resolved before dependent implementation | §§26, 37, 43 | ADDRESSED AS GOVERNANCE DESIGN; all PO decisions remain pending |

R2.4 §3 currently maps F22-06 to audit, F22-08 to customer identity, F22-09 to test detail, F22-10 to PO policy, and F22-11 to scope/verification. Those are not the actual PR #5 finding descriptions. Replace the F22 portion of §3 with the table above. R2.4 must not mark a prior finding fully addressed merely because a related section exists; retain runtime/DB/PO dependencies in the disposition.

### 3.1 Explicit disposition of each prior finding

- **F22-01 — PARTIALLY ADDRESSED.** §30 adds a field vocabulary and branch matrix, but does not close every cell with explicit NULL/NOT NULL/enumerated values (see §4).
- **F22-02 — SUBSTANTIALLY ADDRESSED.** Trusted auth subject is separated from database execution identity, and posting-time authorization recheck remains; effective PostgREST/JWT/SECURITY DEFINER behavior is runtime/DBA-unverified.
- **F22-03 — SUBSTANTIALLY ADDRESSED.** §32 supplies a state machine and failure recovery; role/catalog verification and trigger behavior remain unexecuted.
- **F22-04 — PARTIALLY ADDRESSED.** Composite FK and source constraints are improved; completeness depends on the CHECK and operation-linkage corrections below.
- **F22-05 — PARTIALLY ADDRESSED.** A customer balance mutex is explicitly specified, but inherited lock tables and current lock definitions conflict or leave choices open.
- **F22-06 — ADDRESSED AT DESIGN LEVEL.** Atomic claims versus durable pending workflows remain conceptually separated; runtime idempotency not tested.
- **F22-07 — PARTIALLY ADDRESSED.** Durable opening action and recovery are specified, but PO-dependent uniqueness/cardinality is not final.
- **F22-08 — ADDRESSED AT DESIGN LEVEL.** Audit guarantee is correctly conditional on RPC-only catalog writes; deployed grants and every direct writer path are not verified.
- **F22-09 — ADDRESSED AS FAIL-CLOSED DESIGN.** Customer identity is explicitly PO-07-pending; no unique identity index may be activated before approval.
- **F22-10 — ADDRESSED AT DESIGN LEVEL.** Append-only correction and privileged-owner residual are qualified; actual enforcement is runtime-unverified.
- **F22-11 — ADDRESSED AS GOVERNANCE DESIGN.** PO-01–10 remain pending and their dependent modules/indexes must remain blocked.

## 4. Legacy `source_memo_id` — §§29–30 and LEG tests

**Disposition: SUBSTANTIALLY ADDRESSED — no independent HIGH defect found in the stated target model.**

R2.4 §29 correctly states that enforced `source_memo_id` on a `legacy_unclassified` row must be NULL unless a memo link is positively proven through an approved deterministic process and separately approved reclassification. It moves historical hints to `legacy_ledger_source_candidates`; `candidate_memo_id` intentionally has no memo FK, and candidate verification alone does not alter ledger origin. The migration plan snapshots old values, preserves them as unverified candidates, nulls the enforced FK column, and prohibits changes to financial identity/amount/direction/customer/shop/date/note/origin.

LEG-01–08 cover direct auth insert/update, service/alternate SECURITY DEFINER paths, migration preservation, wrong/nonexistent/cross-tenant candidate hints, candidate mutation, append-only correction, and verification without reclassification. This is directionally coherent and directly resolves the R2.3 contradiction.

Remaining required precision:
1. Define the exact privileged correction path and role/transaction conditions for appending a candidate supersession; it must not become an indirect update or FK promotion path.
2. Define whether a verified candidate can ever be displayed to a shop user and require unmistakable “candidate/unverified relationship” presentation until separately approved reclassification. No normal memo label/link may be generated from it.
3. Specify table-level ownership, RLS/ACL, trigger and SECURITY DEFINER rules for `legacy_ledger_source_candidates`; ordinary auth/service roles must not write or set verification status.
4. Include before/after candidate-row counts, digest, FK-null count and no-reclassification assertion in migration evidence.
5. Ensure migration and test fixtures explicitly distinguish (a) an old source ID that is merely a hint, (b) a positively proven relationship, and (c) a separately approved reclassification. The present M0-01 path should perform only (a).

## 5. Total CHECK/provenance matrix — §§30–31 and PNV-01–35

**Disposition: NEEDS REVISION — HIGH.**

Strengths: §30.2 separates pending approval operations from posted ledger rows; §30.3 covers memo/due, manual/referenced due, manual/no-reference due, manual/paid and historical legacy due/paid; §30.4 correctly recognizes PostgreSQL CHECK accepts TRUE or NULL and explicitly states that CHECK cannot authenticate `auth.uid()`, membership, expiry, payload hash or cross-table business conditions. PNV-01–35 gives a useful per-field negative-test inventory.

Confirmed gaps:

1. **Not every provenance field has a total branch rule.** The referenced manual due row says confirmation is NN but timestamp is “per approved schema”. That is not a defined NULL/NOT NULL rule. Raw/normalized reference normalization version is not in the matrix. Exception reason, confirmation timestamp, raw reference retention and canonicalization/version fields need complete branch-specific rules.
2. **Operation states are mixed into the ledger matrix.** “manual/due/no-ref pending” and “cancelled/expired/rejected” are explicitly operation-only, not ledger rows. They should be in a separate complete operation-state matrix. The ledger matrix should contain only posted ledger combinations, plus explicit prohibited combinations.
3. **Legacy fields are underspecified.** HIST and “false/approved unknown representation” are not executable values. Identify exact legacy values or permitted NULL state per field; preserve untrusted historical confirmation/reference hints only in non-authoritative metadata. Do not fabricate actors, approval times, hashes or memo source IDs.
4. **No-reference posting branch needs exact confirmation semantics.** Distinguish original confirmation at pending submission from any confirmation at approval; specify actor, source, timestamp and immutable relationship. It must not be implied that a CHECK verifies the actor.
5. **Server-side invariant coverage is declarative, not fully bound to specific tests.** Hash recomputation, pending status/expiry, amount/customer/shop binding and event cardinality need exact operation/transaction assertions and error outcomes.
6. **PNV coverage remains uneven.** Several cases use “reject” or alternative SQLSTATE/RPC responses rather than one frozen expected contract; PNV-34 explicitly treats table owner as privileged, and the precise isolated break-glass evidence/no-row exceptions need deterministic test harness setup.

Required correction: provide two separate total matrices: (A) approval-operation lifecycle fields for pending/posted/cancelled/expired/rejected; (B) posted ledger origin/type/provenance fields. For every persisted field use exactly NULL, NOT NULL, enumerated value, or a precisely named historical representation. Specify the exact SQL predicate and ensure each nullable operand is guarded so no branch can yield NULL. Keep actor authentication and authorization in server-side transaction logic, not the CHECK claim.

## 6. Approval-to-ledger cardinality and integrity — §31

**Disposition: PARTIALLY ADDRESSED — HIGH.**

R2.4 now specifies an operation unique key, a composite FK from ledger linkage to operation, a partial unique ledger index for approval operation, immutable operation type, SHA-256 canonical JSON v1, server-side hash computation/recomputation, version retention, and same-ID replay returning the canonical ledger ID without a second posting event. This is a substantial improvement.

Remaining defect: §31 states that pending/cancelled/expired/rejected operations have zero ledger rows and posted operations have exactly one, but it only expressly describes a partial unique index (at-most-one) and an optional/deferred reverse FK plus an RPC transaction invariant. A unique index plus ledger→operation FK does not by itself prove that every posted operation has one ledger row. Nor does it independently prevent a ledger row from existing for a terminal non-posted operation if the status/link consistency rule is not enforced against both tables.

Required correction:
- Make operation↔ledger linkage enforceable in both directions, or explicitly specify the deferred constraint-trigger/transaction mechanism that validates the final committed state.
- Require `posted` iff exactly one canonical ledger row exists; require every non-posted terminal/pending state iff zero ledger rows exist.
- Bind shop, operation type, operation ID, customer, amount, direction, origin, creator, canonical payload/hash/version and canonical ledger ID across both records. The ledger row must not be independently relinkable to another operation.
- State which unique constraint/FK is immediate or DEFERRABLE INITIALLY DEFERRED, exact nullable behavior, and what rejects a direct INSERT/UPDATE/DELETE attempt.
- Hash recomputation must use the stored canonicalization version and server-side persisted payload; operation payload/hash/version must be immutable to all ordinary roles and to any RPC path after initial submit. Define trigger/ACL/owner rules.
- Same-ID replay must return original ledger ID and must not create a second ledger row, operation transition or posting audit event. Add a test that checks ledger row count, audit event count and balance before/after replay.

These are design-enforcement gaps. No runtime claim is made.

## 7. Migration guard handoff — §32

**Disposition: SUBSTANTIALLY ADDRESSED — HIGH residual runtime dependency.**

R2.4 specifies the requested ordered states: WRITERS_DISABLED → MIGRATION_AUTHORITY_ACTIVE → BACKFILL_COMPLETE → PERMANENT_GUARD_ACTIVE → MIGRATION_AUTHORITY_REVOKED → INDEPENDENTLY_VERIFIED → WRITERS_REENABLED. The transition table names preconditions/actors, database actions, evidence, commit boundaries, failure/recovery and writer status. It explicitly keeps writers off until independent verification and describes uncertain role revocation, runner connection loss, partial writer enable and guard-install failure.

Remaining requirements before implementation/runtime authorization:
- Persist the migration phase in a durable, independently readable control record or approved deployment state. A process-local runner flag is insufficient to resume safely after connection loss.
- Identify the exact database role/session identities and trigger `current_user`/`session_user` behavior for every transition and SECURITY INVOKER/DEFINER path.
- Define how “disable financial RPC/grants/feature gate” is atomically verified with active-session draining and how stale pooled sessions are prevented from retaining effective write capability.
- Specify transaction boundaries where DDL and role changes cannot share one transaction; verify state after each independently committed operation.
- Define idempotent transition retry logic and recovery when the runner loses connection after commit but before receiving confirmation.
- Independent verification must be by a reviewer not controlling the migration runner credentials. It must inspect database state rather than accept a runner-generated PASS file alone.

All these require separate DBA/runtime scope. The design’s writer-off rule is accepted; the handoff is not runtime verified.

## 8. Financial lock protocol — §§21–23 and §33; LOCK-01–10 / LOCK-N01–05

**Disposition: NEEDS REVISION — HIGH.**

Strengths: §33 correctly states that customer `FOR UPDATE` must be taken before aggregate balance reads and due/paid writes; shop `FOR KEY SHARE` is explicitly not a balance mutex; different customers may proceed independently; multi-customer/item locks use stable UUID ordering; implicit FK/unique/trigger locks are acknowledged. The positive LOCK schedules and negative inversion cases are included by name.

Confirmed inconsistencies/ambiguities:

1. R2.4 §§21–23 retain an earlier lock table that allows shop `FOR UPDATE`/“approved mode” on approval, while §33 says approval takes shop `FOR KEY SHARE` then membership `FOR UPDATE`. Select one exact shop mode and explain whether membership revocation/owner transfer is serialized by shop+membership. Do not leave “FOR UPDATE/approved mode” as an implementation choice.
2. Submit/approval paths have different order descriptions. §21’s submit path includes shop then membership then customer; §33 describes customer existence/tenant check and approval membership locking. Define one universal order and explain read-only checks versus row locks.
3. Operation-row unique-key arbitration is described as “insert, then re-read/lock”; the exact concurrent conflict path (including `ON CONFLICT`, visibility and lock acquisition) is not specified enough to prove it cannot acquire customer/shop locks in an inverted order.
4. FK parent key-share locks, unique-index arbitration and trigger-internal locks are acknowledged but not enumerated by table/constraint/trigger. Acknowledgement is not a lock graph.
5. LOCK-01–10 are schedule summaries rather than deterministic two-session scripts. Missing exact barriers, statement sequence, lock wait observation, commit/rollback order, SQLSTATE/domain result and final committed row/balance assertions for each case.
6. LOCK-N01–05 intentionally use unsafe inversions, but do not define expected deadlock SQLSTATE (`40P01`) versus lock-timeout outcome (`55P03`), which transaction is victim, how the safe production path is proved, or exact no-partial-write snapshots.
7. “Different customers proceed independently” needs a positive schedule proving both sessions hold their respective customer locks simultaneously while sharing a shop row lock; no global shop mutex should serialize them.

Required correction: publish one fully enumerated lock graph including all endpoints, FK/unique/trigger side effects and role-revocation paths. Expand LOCK-01–10 and LOCK-N01–05 into step-numbered deterministic schedules with two sessions, barrier points, expected lock waits/SQLSTATEs, commit order, final row counts/balances/stock/audit, and rollback assertions. A negative inversion test must be clearly isolated and must not be confused with a passing production schedule.

## 9. Catalog/stock identity and recovery — §34 and related §§9, 22; CAT-01–10

**Disposition: PARTIALLY ADDRESSED — MEDIUM/HIGH.**

Strengths: server-generated opening action ID, distinct catalog and stock operation IDs, distinct restock movement identity/type, response-loss recovery, local-storage-loss server listing, identity versioning, unresolved-stock blocking and identity-update concurrency are stated. CAT-01–10 cover the expected categories.

Remaining:
- PO-06 and PO-10 remain PENDING, so the actual canonical identity columns, variant cardinality, catalog→stock cardinality and unique index definitions remain illustrative. This is properly fail-closed only if implementation and UI paths for those modules remain disabled until PO decisions are recorded.
- The rule that a new request ID cannot duplicate an opening action depends on a server unique key over the stable business action identity, not just the request operation ID. Exact constraint predicate and behavior for catalog-only, one-stock-row, multiple-variant and re-open-after-restore states must be finalized after PO approval.
- The recovery list must provide deterministic disambiguation for multiple unresolved operations (actor/shop/business action/status/created time/canonical IDs) without exposing other users’ data; current text says “select/reconcile” but does not define the result contract.
- CAT tests need exact committed row counts, movement quantity deltas, operation state, returned canonical IDs, and response-loss/retry order. Current CAT-01–10 are concise scenario summaries.

Do not enable dependent indexes or stock/catalog write workflows before PO-06 and PO-10 approval plus DB constraint review.

## 10. Consolidated test-plan verification — §§38–40 and inherited definitions

**Disposition: NEEDS REVISION — HIGH / IMPLEMENTATION GATE NOT SATISFIED.**

R2.4 §38 claims the original detailed tests are “fully expanded here by test fixture/action/outcome references” and relies on R2, R2.1 and R2.2. The actual R2.4 document does not reproduce those definitions. The inherited revisions also do not supply a complete uniform row-by-row spec for every T01–T63. R2.3 §28 explicitly acknowledged that the prior T01–T63 set was not fully expanded; R2.4 does not cure the gap by providing a precise immutable revision/path binding plus complete consolidated specification. R2.4’s test inventory is a title list, not the requested executable design test plan.

### 10.1 Coverage/completeness matrix

| Test family | R2.4 reference | Specification status | Key missing required fields |
|---|---|---|---|
| T01–T63 | §§38–40 and inherited R2/R2.1/R2.2 | INCOMPLETE | not every test has preconditions/seed values, actor+tenant+DB role/session, operation ID/hash, exact action/schedule, exact RPC result/SQLSTATE, committed before/after rows, final ledger balance/stock/movements, operation/request status+canonical IDs, audit evidence, rollback assertions and evidence query/artifact |
| PNV-01–35 | §30.5; summarized again §39 | PARTIALLY SPECIFIED | per-field cases exist, but exact reproducible INSERT/UPDATE statements, exact SQLSTATE/domain code and transaction snapshots are not fixed for all; alternate function owner/table owner/import/nested SECURITY DEFINER matrix remains incomplete |
| MIG-01–10 | §§20.4, 32, 39 | PARTIALLY SPECIFIED | role fixture/catalog state and exact commands/session transitions/SQLSTATE/catalog evidence not fully expanded; MIG-09 is governance/break-glass observation, not a conventional negative SQL test |
| ADV-01–15 | §§23, 39 | PARTIALLY SPECIFIED | several concurrent schedules lack exact step/barrier ordering, victim/error/result, row snapshots, final ledger/stock/audit and rollback assertions |
| LOCK-01–10 | §33 | INCOMPLETE | each is a prose schedule, not a deterministic two-session test script with barriers and exact results/evidence |
| LOCK-N01–05 | §33 | INCOMPLETE | expected `40P01` vs `55P03`, victim session, timeout controls and post-rollback snapshots not defined |
| LEG-01–08 | §29 | PARTIALLY SPECIFIED | good business assertions, but exact actor/role, SQL operation, result code, committed candidate/ledger snapshots and evidence query absent |
| CAT-01–10 | §34 | PARTIALLY SPECIFIED | exact PO-approved unique key fixture, operation row snapshots, movement quantity deltas, RPC results and concurrency barriers absent |
| CUST-01–05 | §35 | PARTIALLY SPECIFIED | exact PO-07 identity fixture/index behavior, operation rows, conflict result/SQLSTATE and committed snapshots absent |
| AUD-01–05 | §36 | PARTIALLY SPECIFIED | role/function-owner/table-owner fixtures, exact mutation statements/SQLSTATE, external break-glass audit artifacts and digest snapshots absent |

### 10.2 Required row-by-row test contract

Every T01–T63 test must include, in the consolidated R2.4 source or a uniquely revision-pinned referenced test document:
- Preconditions and seeded values/IDs, including tenant/shop/customer/memo/item/stock state.
- Authenticated actor, tenant, database role, `session_user`, `current_user` and relevant function owner.
- Operation/request ID and exact canonical payload/hash/canonicalization version.
- Exact RPC/SQL action and ordered concurrency schedule/barrier where relevant.
- Exact expected RPC result or SQLSTATE/domain error.
- Before/after committed rows for all affected tables.
- Final ledger balance and stock quantity/movement rows.
- Operation/request status and canonical entity/ledger/stock IDs.
- Audit event IDs/count/payload and immutable digest checks.
- Rollback and no-partial-write assertions.
- Exact evidence queries/artifact names and custodian.

Cross-reference is acceptable only if the referenced revision, path and relevant test definitions are available, immutable and unambiguous. A list of test IDs or narrative statements that evidence “is required” is not a test specification. No test execution is inferred from specification completeness.

## 11. PO-01 through PO-10

**Disposition: ACCEPTED AS PENDING GOVERNANCE GATES.**

R2.4 does not mark any PO recommendation approved. The table distinguishes suggested defaults from approval and explicitly states that decisions require named PO/date/rationale/evidence. Dependent workflows and unique indexes are described as blocked/fail-closed.

Before implementation, capture signed decisions and update the design:

| PO | Decision area | Dependent work that remains blocked |
|---|---|---|
| PO-01 | Approval authority | no-reference due posting/approval ACL |
| PO-02 | Approval expiry/revocation | expiry worker/UX/terminal transition behavior |
| PO-03 | Reference uniqueness | reference normalization/index/duplicate behavior |
| PO-04 | Aggregate payment/allocation/overpayment | payment validation and balance UX |
| PO-05 | Legacy balance/display | dashboard/customer balance semantics |
| PO-06 | Inventory identity/variants | catalog/stock unique keys and create/update paths |
| PO-07 | Customer identity | create-or-get unique identity index/workflow |
| PO-08 | Second actor/manager model | membership schema and delegated approval |
| PO-09 | Exception thresholds/reasons | threshold enforcement and reason enum |
| PO-10 | Catalog-only/stocked cardinality | catalog-stock relationship/indexes/opening stock |

No recommendation in the R2.4 document is an approval. Do not activate dependent writes or indexes before the decision evidence is recorded.

## 12. Confirmed design defects and required corrections

### P0 — must resolve before implementation approval

1. Correct F22-01–F22-11 mapping in §3 to match actual PR #5 report and retain exact dispositions.
2. Split §30 into an operation lifecycle matrix and posted-ledger matrix; close every provenance field cell and eliminate ambiguous “per approved schema”, HIST and unspecified enum/null values.
3. Specify a total CHECK predicate (or an exact design-level truth table from which it is unambiguous) and field-by-field insert/update negatives; never imply CHECK authenticates an actor.
4. Enforce operation↔ledger cardinality in both directions: posted iff exactly one matching canonical ledger row, all other operation states iff zero. Specify deferred constraints/triggers or transaction protocol and direct-write denial.
5. Freeze canonical payload/hash/version immutability and server recomputation against the stored version; bind all identifying/financial columns and ledger ID.
6. Resolve the single lock graph and exact modes/order across §§21–23/33; define unique-key conflict and implicit FK/trigger locking.
7. Fully expand T01–T63 and deterministic LOCK/ADV cases or provide exact immutable referenced documents that satisfy the complete test contract.

### P1 — required before runtime/pilot acceptance

8. Add durable migration phase/control evidence and exact role/session/trigger transition fixtures; verify independent review and stale connection handling.
9. Finalize PO-06/PO-10 before canonical catalog/stock identity and opening-stock unique constraints; keep all dependent writes blocked.
10. Expand CAT/CUST/LEG/AUD/PNV/MIG/ADV tests with exact roles, SQL statements, SQLSTATEs, committed-state queries and rollback evidence.
11. Define candidate metadata read/display restrictions and approved append-only supersession path.
12. Confirm direct catalog and financial write-path revocation only from actual deployed catalog/ACL/function inventory in separately authorized scope.

## 13. Remaining PO/DBA/runtime dependencies

- PO-01–PO-10: all PENDING; no recommendation is approval.
- DBA/security: exact schema/column fit, unique/FK/deferrable constraint design, table/trigger/function ownership, SECURITY DEFINER grants/search_path, migration role graph, catalog checks and lock side effects.
- Runtime harness: PostgreSQL/Supabase version, disposable synthetic tenant fixtures, controlled two-session barriers, failure injection, browser reload/local-storage-loss tests and evidence custody.
- Product/accounting: aggregate payment and legacy balance presentation, no-reference authority and candidate-link reclassification policy.

## 14. Runtime verification status

**NOT EXECUTED:**
- PostgreSQL/Supabase migration, DDL, CHECK/FK/unique/deferrable constraints and trigger behavior.
- `auth.uid()`, JWT/PostgREST identity, `current_user`, `session_user`, SECURITY DEFINER owner/search_path and ACL behavior.
- Migration role membership, SET/INHERIT/ADMIN OPTION, trigger guard handoff/revocation and independent catalog verification.
- Approval/pending/posted/cancelled/expired/rejected ledger cardinality and same-ID replay.
- Payment/memo/approval concurrency, lock waits, deadlock detection, SQLSTATEs and failure injection.
- Catalog/stock operation recovery, opening action uniqueness, restock movements and local-storage-loss recovery.
- PNV/MIG/ADV/LOCK/LEG/CAT/CUST/AUD test families, backup/restore and browser runtime.

No runtime PASS, PostgreSQL verification, staging acceptance or production acceptance is claimed. All cited tests are PROPOSED / NOT EXECUTED.

## 15. Final QA disposition

# NEEDS REVISION

**Overall severity: HIGH**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.4 resolves several important R2.3 design defects, notably legacy memo-hint handling and the migration handoff. It is nevertheless not acceptable for implementation approval because F22 traceability remains wrong, the provenance matrix is not fully total, approval-to-ledger exact cardinality is not fully enforced in both directions, lock protocol specifications are inconsistent, and the consolidated test package is not executable or completely revision-pinned.

**Explicit restrictions and verification statement:** Documentation-only QA. No application implementation, SQL migration, staging/production database access or mutation, runtime execution, merge or deployment occurred. PR #8 and PR #2–#7 were not modified. Implementation approval remains NOT GRANTED. Financial pilot remains NO-GO.