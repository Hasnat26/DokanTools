# DokanTools — M0-01 Remediation Design R2.3 Independent QA Report

**Decision: NEEDS REVISION — HIGH severity**  
**Implementation approval: NOT GRANTED. Financial pilot: NO-GO.**

Reviewed R2.3 at `18fbb6aca6919e39bacca9f889b8a02573d9fd97`; actual CH-4 R2.2 report in PR #5; R2.2 at `abd9a784627fc366edc3b1cf2f651b9e3c8a2543`; baseline `efa7d5da139030c092089831f813df697eaed71e`.

## 1. Executive assessment

R2.3 is a substantial improvement. §§18–22 materially improve the provenance model, trusted actor identity, migration-role controls, workflow lock order and durable catalog/stock identity. It is not implementation-ready.

Blocking issues:
1. CHECK/provenance matrix is not yet a fully closed field-by-field total predicate for every origin/type branch.
2. Legacy `source_memo_id` semantics contradict: §18.2 treats legacy source as unproven, while §18.3 allows preserving a value in the enforced FK column.
3. Approval operation linkage needs explicit unique/FK guarantees and immutable canonicalization/hash version.
4. Migration-principal handoff between temporary guard, permanent trigger and writer re-enablement lacks a failure-safe state machine.
5. Financial shop lock mode is unresolved; `FOR KEY SHARE` alone does not mutually exclude balance writers.
6. T01–T63 are not all expanded into executable test specifications; R2.3 §28 explicitly acknowledges this.
7. F22-06 and F22-08–F22-11 traceability in §27 is incorrect against the actual PR #5 report.

No PostgreSQL, Supabase, browser or migration runtime behavior was tested.

## 2. Evidence basis

Read directly from GitHub:
- R2.3 exact head above.
- Full CH-4 report in PR #5, head `75b3b1ec5d61a14f6222b01d60b869f08678e819`.
- R2.2, R2 and R2.1 exact design heads.
- Baseline schema, reliability migration, P0 idempotency migration and relevant UI/RPC call sites.

PR #6 was confirmed open, draft, unmerged, based on R2.2. No reviewed PR or source file was modified.

Evidence labels:
- VERIFIED — source/document inspection.
- DESIGN DEFECT — internally incomplete/contradictory design.
- DESIGN AMBIGUITY — materially different implementations remain possible.
- INFERENCE — logical risk from design/baseline.
- UNVERIFIED — requires runtime execution.

## 3. F22-01 through F22-11 — corrected traceability

R2.3 §27 states that F22-06 and F22-08–F22-11 mapping is provisional. The complete actual PR #5 report is available; the correct mapping is:

| Finding | Actual prior finding | R2.3 coverage | Disposition |
|---|---|---|---|
| F22-01 | CHECK did not define complete approval-field matrix | §18.2–18.6; PNV-01–35 | PARTIALLY ADDRESSED; total field predicate incomplete |
| F22-02 | Two-step approval needed trusted DB identity contract | §19; ADV-01/06/07 | SUBSTANTIALLY ADDRESSED; membership/auth deployment decisions remain |
| F22-03 | Migration-only guard needed closed role-membership/ownership design | §20; MIG-01–10 | SUBSTANTIALLY ADDRESSED; migration transition and runtime proof remain |
| F22-04 | Composite FK model sound; CHECK/nullability incomplete | §18; PNV-16–19, PNV-33/34 | PARTIALLY ADDRESSED; legacy source semantics conflict |
| F22-05 | Global lock order needed workflow lock graph | §21; ADV-01–06 | SUBSTANTIALLY ADDRESSED; lock modes/implicit locks remain |
| F22-06 | Atomic financial idempotency vs durable pending workflows; clarify processing/recovery | R2.2 §8 retained; R2.3 §§21–22 states | ADDRESSED AT DESIGN LEVEL; runtime unverified |
| F22-07 | Durable catalog/stock recovery, reload/response loss/new-ID prevention | §22; ADV-10–13 | SUBSTANTIALLY ADDRESSED; PO identity decisions block implementation |
| F22-08 | Catalog audit boundary and direct catalog write paths | §22.3, §24, T18/T38/T61 | ADDRESSED AT DESIGN LEVEL; direct writes must be revoked/replaced |
| F22-09 | Customer create-or-get recovery and duplicate identity policy | §25; ADV-14; T54/T62 | ADDRESSED AT DESIGN LEVEL; PO-07 identity key pending |
| F22-10 | Audit immutability, owner capability and append-only correction | §24; ADV-08; T53/T57/T63 | SUBSTANTIALLY ADDRESSED; DBA/runtime verification remains |
| F22-11 | PO decisions and fail-closed feature dependencies | §26; §29 | ADDRESSED AS GOVERNANCE DESIGN; PO items remain pending |

R2.3 currently maps F22-06 to audit, F22-08 to customer, F22-09 to test detail, F22-10 to PO policy and F22-11 to scope/verification. This is inaccurate. Replace §27 with the corrected mapping above.

## 4. CHECK/provenance — §§18.2–18.6 and PNV-01–35

### Valid origin/type model

The proposed combinations are correct:
- memo + due only, exact memo/shop/customer source;
- memo + paid prohibited;
- manual + due referenced;
- manual + due no-reference only after two-step approval; pending approval has no ledger row;
- manual + paid;
- legacy_unclassified + due/paid historical only;
- all other combinations prohibited.

### HIGH design defect: legacy source_memo_id contradiction

§18.2 says legacy source is unproven/no inferred memo FK. §18.3 permits retaining historical `source_memo_id` if present. That column participates in the composite memo FK, so a historical hint can either fail the FK or be treated as a real memo relationship.

**Correction:** Keep the enforced `source_memo_id` NULL for legacy_unclassified unless the link is positively proven and reclassified through a reviewed process. Preserve historical candidate hints in a separate non-authoritative legacy metadata field/table, explicitly marked unverified.

### Total CHECK matrix still required

§18.3 does not enumerate every provenance field for every path; §18.4 states the rules but does not give a complete total predicate. Add an exhaustive field table with one row per valid origin/type/state and one column per persisted provenance field. Every cell must specify NULL, NOT NULL or an enumerated value. Pending-operation fields must be defined separately from ledger fields.

### Approval linkage

§18.5 correctly describes atomic operation-to-ledger posting. Still specify:
- unique/FK relationship ensuring at most one ledger row per approval operation;
- operation/shop/type/customer/amount binding;
- canonical hash algorithm and version;
- immutable canonical payload and hash;
- replay returning the original ledger ID with no second event.

### PNV gaps

PNV is broad, but:
- PNV-01 must distinguish new writes from legacy historical creator=NULL.
- PNV-13 needs explicit non-null operands and RPC trust checks; DB inequality is not authorization.
- PNV-14 needs changed operation-type and canonicalization-version cases.
- PNV-15 must compare server-recomputed hash with immutable stored payload.
- PNV-18 should split wrong shop and wrong customer.
- PNV-24 has unresolved raw-reference retention policy.
- PNV-29 needs migration role/trigger context.
- PNV-30/31/35 must update each field individually and via alternate SECURITY DEFINER.
- PNV-34 must separately test authenticated, service, function owner, table owner, import role and nested definer paths.

## 5. Trusted identity / SECURITY DEFINER — §19; ADV-01/06/07

Strengths:
- Client is untrusted.
- Business actor derives from auth.uid(); DB execution identities are distinguished.
- Dedicated NOLOGIN least-privilege function owner, no BYPASSRLS/migration membership proposed.
- Exact overload/ACL/search_path inventory required.
- Membership revocation serializes with approval on membership row.

Remaining:
- Baseline does not establish the proposed manager/membership schema. Owner-only fallback is the only possible approval mode until approved.
- Define trusted PostgREST/Supabase auth context for every user RPC and separate system actor context.
- Finalize trusted schemas/search_path and helper ownership.
- Set exact shop lock mode and owner-transfer serialization.
- Prove auth and membership are checked in the same transaction as ledger posting.

## 6. Migration principal — §20; MIG-01–10

R2.3 improves materially: NOLOGIN default, ephemeral credential, membership direction, SET/INHERIT/ADMIN restrictions, function-owner restrictions, maintenance window, writer disable, external audit and break-glass residual risk.

Remaining blocker: temporary guard to permanent guard handoff lacks a failure-safe state machine. Define:
writers disabled → migration authority active → backfill complete → permanent guard active → migration authority revoked → writers re-enabled.

Writers must not reopen until permanent guard and role/credential closure are independently verified. Define recovery if any transition fails. MIG-09 is privileged-boundary/governance evidence, not an ordinary negative SQL test.

MIG-01–10 still need exact session identities, role fixtures, SQL commands, SQLSTATEs, before/after catalog query outputs and external audit artifacts. Add trigger owner, schema owner, owner transfer, default privilege and nested definer tests.

## 7. Global lock graph — §21; ADV-01–06

The order operation/request → shop → membership → customer → catalog/inventory → writes/audit/completion is coherent.

Critical remaining ambiguity: §21.1 allows shop `FOR KEY SHARE` for stable existence, or `FOR UPDATE` for serialization. Payment/due balance writers require a mutually exclusive shared lock protocol; KEY SHARE alone does not serialize concurrent balance writers.

Also:
- Unique-key insert arbitration is not an existing row lock; define the exact sequence.
- Enumerate implicit FK, unique-index and trigger locks.
- Ensure customer/catalog identity paths do not acquire identity locks then shop locks.
- Keep legacy reconciliation read-only/disabled until separately approved.
- ADV-06 negative inversion test must be paired with positive safe schedules.

Select exact financial lock mode, specify unique arbitration, enumerate final constraint/trigger locks and add deterministic positive schedules.

## 8. Catalog/stock identity — §22; ADV-10–13

R2.3 correctly separates catalog identity, stock identity, operation IDs, one-time opening action and restock movement. It requires server uniqueness, same-ID idempotency, distinct-ID conflict, versioned updates and server-side reload recovery.

PO-06/PO-10 remain pending, so no final identity key/cardinality is approved. Dependent indexes and workflows must remain disabled.

Further clarify:
- one stock row per catalog item implies variants need distinct catalog identities;
- opening_action_id is allocated once server-side and cannot regenerate on retry;
- recovery listing after local storage loss with multiple unresolved actions;
- restock movement has independent ID and quantity delta;
- catalog identity update and stock create concurrency are serialized in the DB, not just UI.

## 9. Test specification adequacy — T01–T63, PNV, MIG, ADV

**NOT SUFFICIENT FOR IMPLEMENTATION APPROVAL.**

R2.3 §28 explicitly admits that T01–T63 are retained and not all fully described. Test titles cannot substitute for executable specifications.

Every T01–T63 needs:
- preconditions and seeded IDs/values;
- tenant, authenticated actor, DB session/role;
- operation/request ID and canonical payload/hash;
- deterministic action/barrier/schedule;
- exact RPC result or SQLSTATE/domain error;
- before/after committed rows in all affected tables;
- aggregate balance/stock quantities and movements;
- operation/request status and canonical IDs;
- audit event IDs/count/payload;
- rollback/absence-of-partial-write assertions.

PNV needs actor/session/role, insert/update, SQLSTATE and no-commit assertions for every field. MIG needs role/owner/trigger context plus catalog and external audit evidence. ADV needs deterministic barriers and exact outcomes, especially ADV-01–06 concurrency interleavings, ADV-07 role graph, ADV-10–13 finalized identity constraints, ADV-14 PO-approved customer identity, and ADV-15 per-write failure injection.

R2.4 should publish one consolidated executable test plan for all T01–T63, PNV-01–35, MIG-01–10 and ADV-01–15.

## 10. PO-01 through PO-10

All remain PENDING in §26. Suggested defaults are not approvals.

| PO | Required decision | Dependent modules that remain disabled |
|---|---|---|
| PO-01 | No-reference approval authority | No-reference due posting |
| PO-02 | Expiry TTL/revocation | Approval expiry worker/UI guarantees |
| PO-03 | Reference uniqueness scope/cross-kind | Reference unique indexes and duplicate validation |
| PO-04 | Aggregate payment and overpayment | Payment validation/balance presentation |
| PO-05 | Legacy balance/display treatment | Customer balance/dashboard |
| PO-06 | Inventory identity/variants | Catalog/stock identity indexes and create/update |
| PO-07 | Customer identity key | Customer create-or-get unique key |
| PO-08 | Owner/manager/second actor | Membership schema and delegated approval |
| PO-09 | No-reference thresholds/reasons | Threshold logic/reason enum |
| PO-10 | Catalog-only/stocked identity | Catalog-stock linkage/cardinality/opening action |

PO-01/02/08 affect approval/security; PO-03/04/05 accounting/reference semantics; PO-06/10 inventory identity; PO-07 customer identity; PO-09 risk controls.

## 11. Required corrections

### P0
1. Correct R2.3 §27 traceability.
2. Complete total CHECK/provenance matrix.
3. Resolve legacy source_memo_id contradiction.
4. Enforce one approval operation to at most one ledger row; bind operation fields and immutable payload hash/version.
5. Select exact mutual-exclusion lock for financial balance writers.
6. Define migration guard handoff/closure state machine and recovery.
7. Resolve blocking PO decisions before dependent implementation; keep those modules disabled.

### P1
8. Add deterministic positive concurrency schedules.
9. Fully expand T01–T63.
10. Complete actor/session/SQLSTATE/committed-state assertions for PNV/MIG/ADV.
11. Finalize catalog/stock/opening/restock keys after PO-06/10.
12. Finalize customer identity after PO-07.
13. Remove direct catalog write paths before audit completeness claim.
14. Execute catalog/ACL/function ownership inventory only under separately authorized runtime scope.

## 12. Runtime verification

**NOT EXECUTED:** PostgreSQL/Supabase migrations or SQL; CHECK/FK/index runtime; auth.uid/JWT/PostgREST; current_user/session_user/nested SECURITY DEFINER; role membership/SET ROLE; RLS/ACL; approval/payment/deadlock concurrency; transaction failure injection; browser reload/response loss; backup/restore.

All T01–T63, PNV, MIG and ADV tests remain proposed/unexecuted. No runtime PASS claim is made.

## 13. Final disposition

# NEEDS REVISION

**Severity: HIGH**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.3 is a substantial design improvement, but the provenance/CHECK matrix still needs a total field specification, legacy source reference semantics are contradictory, approval/migration/lock contracts need final implementable decisions, and T01–T63 are not fully specified.

**Explicit statement:** This QA report does not grant implementation approval. Runtime tests and database verification were NOT EXECUTED. No application code, SQL migration, staging or production database was accessed or mutated. PR #6, PR #5, PR #4, PR #3, PR #2 and main were not modified by this QA work.
