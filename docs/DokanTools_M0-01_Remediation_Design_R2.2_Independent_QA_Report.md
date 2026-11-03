# DokanTools — M0-01 Remediation Design R2.2 Independent QA Report

**Role:** CH-4 Independent QA & Test Engineer  
**Repository:** Hasnat26/DokanTools  
**Reviewed design PR:** https://github.com/Hasnat26/DokanTools/pull/4  
**Reviewed head:** `abd9a784627fc366edc3b1cf2f651b9e3c8a2543`  
**Reviewed document:** `docs/M0-01_Remediation_Design_R2.2.md`  
**Document blob SHA:** `98fd5c0fb61f14495097e7ec1262c848042eec49`  
**R2:** `2e97683d66700726826d89c18d0fc6f01d533f80`  
**R2.1:** `352703589a2f2bfdd8db70d43693e0e9ac21f64d`  
**Baseline:** `efa7d5da139030c092089831f813df697eaed71e`  
**QA branch:** `qa/ch4-m0-01-r2-2-independent-report`  
**QA branch base:** `efa7d5da139030c092089831f813df697eaed71e`

---

## 1. Executive decision

# NEEDS REVISION

**Overall severity: HIGH**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.2 is a substantial and technically serious improvement over R2/R2.1. It addresses the majority of previous findings with explicit workflows, database invariants, role/ACL inventory requirements, operation identity, migration controls and a wider adversarial test matrix.

The review does not find a reason to reject the overall architecture. The remaining issues are concentrated in implementability and enforcement boundaries rather than absence of design topics.

Blocking issues:

1. The no-reference approval workflow needs one fully authoritative authorization/commit protocol. The design provides strong controls, but the trusted auth subject and database role context must be explicit for the approval RPC and all callable paths.
2. The migration-only legacy guard is directionally sound, but its proposed `current_user` check is insufficient if routine SECURITY DEFINER owners, role inheritance, grants or migration credentials can activate the exception. The exact database trust model must be chosen and constrained before implementation.
3. The final CHECK specification has a three-valued-logic defect risk: the non-exception manual-due branch does not explicitly constrain all approval fields (notably `approved_by_user_id`, `approval_method`, creator identity and approval timestamp relationships). The semantic target is not yet a complete closed field matrix.
4. The global request → shop → customer → inventory lock order is coherent, but the operation identity has multiple roles (atomic idempotency row versus durable approval/stock workflow row). The document must define how locks are acquired and which operations may update/query the durable operation without creating inversion with cancellation, expiry or other state transitions.
5. The durable catalog/stock workflow is improved, but server-side recovery and unique business identity need exact constraints and a complete mapping of catalog operation, stock operation and initial-stock business action. Different IDs must not permit duplicate opening actions.
6. Several PO-pending decisions materially affect key constraints and role authorization. The design correctly says to fail closed, but implementation must not begin until the blocking decisions are resolved and incorporated.

These are design-level blockers or ambiguities, not runtime findings. PostgreSQL and browser runtime behavior remains unverified.

## 2. Review scope and evidence basis

Reviewed directly from GitHub:
- R2.2 document at the exact supplied head SHA.
- R2 and R2.1 documents at the exact supplied head SHAs.
- Original baseline `supabase/schema.sql`.
- Original baseline `supabase/migrations/20261019_reliability_foundation.sql`.
- Original baseline `supabase/migrations/20261102_p0_idempotency.sql`.
- Original baseline Baki and stock UI call sites.

PR #4 was confirmed open, draft and unmerged, based on the R2.1 head. It contains the R2.2 design document as a documentation-only change.

### Evidence classifications
- **VERIFIED — source review:** Directly visible in the specified GitHub source/document.
- **DESIGN DEFECT:** Proposed logical rule is incomplete or internally inconsistent, independent of runtime execution.
- **DESIGN AMBIGUITY:** Multiple materially different implementations remain possible.
- **INFERENCE:** Risk derived from the specified design or baseline behavior.
- **UNVERIFIED — runtime:** Requires PostgreSQL/Supabase/browser execution. No such execution was performed.

No source-repository application code, SQL migration, staging DB or production DB was modified.

## 3. Previous finding disposition

| Prior finding | R2.2 disposition | CH-4 disposition |
|---|---|---|
| R21-01 — no-reference approval | §4 defines durable pending request, separate approve RPC, trusted actor derivation, creator/approver separation, hash binding, expiry, cancellation and replay. | SUBSTANTIALLY ADDRESSED; NEEDS PRECISION |
| R21-02 — migration-only legacy origin | §5 defines migration principal, temporary guard, permanent trigger, trust boundary and break-glass residual risk. | SUBSTANTIALLY ADDRESSED; HIGH IMPLEMENTATION BLOCKER |
| R21-03 — nullable/FK semantics | §6 specifies nullability, allowed combinations, CHECK semantics, composite FKs and direct SQL tests. | PARTIALLY ADDRESSED; CHECK MATRIX NEEDS REVISION |
| R21-04 — reference uniqueness | §12 and PO-03 leave scope/cross-kind policy explicit. | PO-PENDING; IMPLEMENTATION BLOCKER FOR INDEX DESIGN |
| R21-05 — audit immutability | §11 defines ACL, trigger, append-only corrections and owner/superuser limitation. | ADDRESSED AT DESIGN LEVEL; RUNTIME UNVERIFIED |
| R21-06 — balance writer coverage | §7 enumerates known and unknown writers and prescribes catalog inventory and disabling unknown paths. | ADDRESSED AT DESIGN LEVEL; INVENTORY EXECUTION REQUIRED |
| R2-07 — processing ambiguity | §8 separates in-flight atomic claims, durable pending operations, legacy stuck rows and client uncertainty. | ADDRESSED; STATE/LOCK IMPLEMENTATION MUST MATCH |
| R2-08 — catalog/stock recovery | §9 defines stable IDs, durable server operation, reload recovery, identity uniqueness and state transitions. | SUBSTANTIALLY ADDRESSED; INITIAL-STOCK IDENTITY NEEDS CLOSURE |
| R2-09 — catalog audit guarantee | §9.6/T61 ties audit guarantees to RPC-controlled writes. | ADDRESSED; ALL DIRECT WRITES MUST BE REMOVED IF AUDIT IS CLAIMED |
| R2-10 — customer create-or-get | §10 defines operation ID, canonical payload, conflict/no-merge behavior and recovery. | ADDRESSED AT DESIGN LEVEL; IDENTITY PO DECISION PENDING |
| R2-11 — privileged owner/role | §7.5–7.6 and §11.4 define target model and catalog verification. | ADDRESSED AT DESIGN LEVEL; DBA/SECURITY APPROVAL PENDING |

## 4. R2.2 findings

### F22-01 — CHECK constraint does not yet define a complete approval-field matrix

**Severity: HIGH — DESIGN DEFECT / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §6.1–6.3, especially the CHECK alternatives at approximately document lines 314–346; T45.

R2.2 correctly explains that PostgreSQL CHECK accepts TRUE or NULL and includes explicit field null checks in the no-reference exception branch. However, the proposed semantic CHECK is not a fully closed field matrix.

For the referenced manual-due branch (`reference_exception=false`), the proposed predicate requires reference fields and checks that `approved_by_user_id` and `approved_at` are NULL, but does not explicitly require all other approval-provenance fields to be NULL (for example `approval_method`). It also does not fully define treatment of `created_by_user_id`, independent-origin confirmation timestamp and approval event linkage for every direction/origin combination.

For the non-manual-due branch, the predicate requires reference/exception/approver fields to be null, but its exact relationship to creator identity or approval provenance should be stated rather than left to nullable defaults.

The second branch enforces `approved_by_user_id <> created_by_user_id`, but a CHECK only proves inequality. It does not prove the approver's authenticated identity, shop role, current authorization, or that the pending approval record was created by the asserted creator.

**Required correction:**
- Provide a field-by-field truth table for every allowed direction/origin combination.
- Explicitly require NULL or NOT NULL for every creator, approver, approval method, timestamp, reason, confirmation, source and payload-hash field in every branch.
- Authorization facts must be derived/validated by server-side RPC logic and tied to the durable pending operation.
- T45 must include every CHECK column with NULL, forged, mismatched and unexpected non-NULL values, not only source/customer/shop fields.

### F22-02 — Two-step approval requires an explicit trusted database identity contract

**Severity: HIGH — DESIGN AMBIGUITY / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §4.2–4.5; §7.6; §11; T40–T43 and T55.

R2.2 is materially stronger than R2.1. It states that creator and approver IDs are derived from trusted auth context, that the approval RPC takes no approver ID argument, and that the actor is revalidated at posting time. It also binds approval to the pending operation ID and canonical payload hash.

However, the design uses `auth.uid()` / trusted server context without defining the exact execution contract for the proposed SECURITY DEFINER function. SECURITY DEFINER changes `current_user` to the function owner; it does not inherently change the caller's JWT subject, but the implementation must not confuse the two identities.

**Adversarial conclusions:**
- A forged extra `approved_by_user_id` field must be ignored/rejected. T41 covers this.
- A direct caller of the approve RPC must still be authorized by trusted `auth.uid()` and server-owned shop membership. T42 covers unauthorized actor.
- Creator/approver distinction must compare trusted authenticated subject IDs, not client fields. T40/T41 address this.
- A previously authorized manager whose role is revoked before final posting must be rejected. §4.4 states this.
- Approval replay after posting must return the original canonical result only to authorized actors. §4.4/T43 address this.

**Required correction:** Specify the complete identity chain:
1. Which request claims and trusted JWT claims are accepted by PostgREST/Supabase.
2. Which database identity is used for ACL/trigger decisions (`current_user`, `session_user`, function owner).
3. Which identity is used as business actor (`auth.uid()`).
4. Which database role owns each approval function and what it can do.
5. How shop role lookup is protected from caller mutation.
6. How role revocation is serialized with approval posting (membership row lock or documented transactionally valid recheck).

### F22-03 — Migration-only guard: `current_user` requires a closed role-membership and ownership design

**Severity: HIGH — DESIGN AMBIGUITY / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §5.2–5.4; §7.5–7.6; T44/T56/T63.

R2.2 recognizes that a SECURITY INVOKER trigger sees the invoking database role context, while a SECURITY DEFINER function runs under its function owner. It also states that function owners must not be the migration principal or members of the migration role and that service role alone does not bypass triggers. This is correct as a design concern.

The proposed dedicated non-login migration principal and temporary invoker guard are directionally sound. But implementation needs a more exact authority model.

**Adversarial conclusions:**
- `current_user` is not sufficient by itself unless the migration principal cannot be assumed, inherited, set by or reached through a SECURITY DEFINER owner.
- A SECURITY DEFINER writer owned by the migration principal would satisfy the trigger's role check even when called by an ordinary authenticated user; R2.2 prohibits this in principle, but the final invariant must be enforced by catalog verification and deployment controls.
- Role membership/inheritance can make a supposedly restricted principal reachable unless membership, SET ROLE/SET option, admin option and ownership are checked.
- Service-role/BYPASSRLS does not automatically bypass triggers, but a privileged writer can still write rows unless blocked by the final trigger and privileges.
- A table owner/superuser can disable triggers or alter schema. R2.2 properly calls this break-glass and external governance risk.

**Required correction:**
- Specify migration principal ownership, LOGIN/NOLOGIN, role membership direction, INHERIT/SET behavior, ADMIN OPTION, default privileges and exact migration runner identity.
- Explicitly require no SECURITY DEFINER function owner to be the migration principal or any role able to SET ROLE to it.
- Define the post-backfill closure operation and prove the trigger no longer recognizes temporary migration context.
- Ensure the permanent trigger rejects new legacy inserts and any modification of existing legacy classification outside the approved one-time backfill.
- Add T63 assertions for nested SECURITY DEFINER call chains, owner role membership, role inheritance and attempted SET ROLE.
- Use trigger owner and table owner separation where feasible; define who can ALTER/DISABLE the trigger and how such changes are externally recorded.

### F22-04 — Composite foreign key model is sound in principle; final CHECK/nullability needs completion

**Severity: HIGH — DESIGN DEFECT / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §6.1–6.6; T45.

R2.2 correctly identifies ledger customer_id as NOT NULL, memo customer_id as nullable for zero-due memos, memo-origin due as requiring a non-null source memo and customer, manual/legacy ledger rows as having NULL source memo, composite customer and exact composite memo FKs, MATCH SIMPLE behavior, CHECK TRUE-or-NULL semantics, and cross-table amount equality/eligibility as RPC invariants rather than ordinary CHECK constraints.

The proposed composite FK pattern is appropriate if all child components for memo-origin rows are forced non-null by a complete CHECK. The nullable parent candidate key `memos(id, shop_id, customer_id)` can represent customerless memo rows; such rows cannot be referenced by a memo-origin ledger row whose customer is non-null, because the exact composite key does not match. This is the right direction.

**Remaining defect:** The CHECK branch matrix is not yet complete (F22-01). In addition, a CHECK cannot establish memo amount equality or posted/eligible state. Those must be guaranteed by the memo RPC, and the unique index protects only the memo source key.

**Required correction:**
- Retain explicit NOT NULL constraints for ledger shop/customer/amount/direction/origin.
- Make all required memo-source FK child columns non-null under the memo-origin branch.
- Include all combinations of source memo null/non-null, customer null/non-null, wrong shop, wrong customer and nullable memo parent in T45.
- Define whether `memos.due_amount` may be updated after posting. It should be immutable under this scope.
- Validate memo ledger amount equality from committed DB state in T01 and T45.
- Test INSERT and UPDATE, not only INSERT.

### F22-05 — Lock order is coherent but operation-row workflow needs a precise lock graph

**Severity: HIGH — DESIGN AMBIGUITY / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §4.2–4.4; §7.2–7.4; §8; T08/T09/T28/T29/T33/T34/T46–T48/T58–T59.

R2.2 defines a consistent global order: operation/idempotency row, shop row, customer row, inventory rows in deterministic UUID order, business writes, audit/result completion, commit. This is sensible and addresses the earlier ambiguity.

The system now has two operation categories: atomic financial request claims that exist only within the same uncommitted transaction, and durable pending approval/catalog-stock workflow rows committed before final posting.

The approval path locks the pending operation row first, then shop/customer. This is compatible with the global order if cancellation, expiry, rejection, recovery and maintenance operations touching the same row also follow the same order or only lock the operation row and never later request lower-order resources.

**Required correction:**
- Publish a lock graph for every operation endpoint: submit, approve, cancel, expire, reject, recover, get/status, payment, memo, manual due, customer create/get, catalog, stock.
- For every row lock, specify `FOR UPDATE`, `FOR KEY SHARE`, advisory lock or unique-key arbitration.
- State which state transitions lock only the operation row and which acquire shop/customer/stock after it.
- Define role revocation serialization. If membership rows are locked, include them in global lock order; otherwise define the concurrent revocation/approval rule.
- Ensure request-row uniqueness conflict paths do not keep locks in a different order.
- Add deadlock tests for approval vs cancellation, approval vs expiry, payment vs memo due, same-ID retries, and stock adjustment vs sale.

### F22-06 — Atomic financial idempotency is separated from durable pending workflows

**Severity: MEDIUM — DESIGN ACCEPTABLE WITH VERIFICATION**  
**Source:** R2.2 §8.1–8.4; T59.

R2.2 distinguishes uncommitted in-flight claims, durable pending operations, historical legacy processing rows, impossible new atomic partial completion, and client-side response uncertainty. This resolves the conceptual conflict in R2/R2.1.

The design is coherent if implemented as described. Runtime proof remains required for same-ID/same-payload concurrency, same-ID/changed-payload rejection, rollback at every write point, lost response after commit, and historical committed processing anomaly reconciliation.

Do not create a durable processing claim for an atomic financial RPC outside its business transaction unless a separate lease/reconciliation protocol is specified.

### F22-07 — Durable catalog/stock recovery is improved but still needs final identity constraints

**Severity: HIGH — DESIGN AMBIGUITY / IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §9.1–9.7; §12.2; T16/T17/T18/T35–T38/T49–T52/T60/T61.

R2.2 requires stable catalog and stock operation IDs, a server-side operation record, canonical IDs and payload hashes, browser reload recovery, no new ID while an action is unresolved, stable catalog identity and unique opening-stock action.

The identity hierarchy and normalized catalog identity remain PO-pending. The design must clarify what happens if a catalog identity already exists but the user intentionally wants a second stocked item with a legitimate variant or package difference.

**Required correction:**
- Decide PO-06 and PO-10 before selecting unique identity constraints.
- Define exact unique keys for catalog identity, stock identity and initial-stock movement/business action.
- Enforce uniqueness in PostgreSQL, not only RPC existence checks.
- Define update semantics with expected version/revision for catalog metadata and identity changes.
- Ensure server operation listing/reconciliation is complete for all unresolved operations owned by shop/actor.
- Test distinct IDs racing on identical identity, same ID after reload, response loss after catalog commit, response loss after stock commit, and duplicate initial-stock action.
- Keep restocking distinct from opening stock, with separate movement identity.

### F22-08 — Catalog audit claim is correctly bounded, but direct catalog paths must be disabled

**Severity: MEDIUM — IMPLEMENTATION PRECONDITION**  
**Source:** R2.2 §9.6; §11; T18/T38/T61.

R2.2 correctly limits catalog audit guarantees to RPC-controlled writes. Implementation must revoke direct catalog write grants and replace every baseline UI direct insert/update with the approved RPC before claiming complete catalog audit coverage. Catalog-only state should atomically persist catalog, operation and audit data.

### F22-09 — Customer create-or-get remains PO-dependent

**Severity: MEDIUM — PO-PENDING / IMPLEMENTATION BLOCKER FOR CUSTOMER RPC**  
**Source:** R2.2 §10.1–10.2; §13 PO-07; T54/T62.

The proposed create-or-get contract is coherent: stable request ID, canonical payload, shop-scoped key, no automatic merge and server recovery after response loss. The actual identity key (phone, normalized phone, phone+name or another stable key) remains a PO decision. Do not choose an unapproved unique index or silently merge customers.

### F22-10 — Audit immutability is appropriately qualified

**Severity: MEDIUM — DESIGN ACCEPTABLE WITH VERIFICATION**  
**Source:** R2.2 §11.1–11.4; T53/T57/T63.

ACL and trigger enforcement plus append-only correction events are appropriate. Ensure audit table owner is not an ordinary application role, function owner cannot update/delete audit rows, service role has no routine direct mutation and break-glass changes are externally recorded.

### F22-11 — PO decisions materially affect schema/security and must be resolved

**Severity: HIGH — GOVERNANCE/IMPLEMENTATION BLOCKER**  
**Source:** R2.2 §13, PO-01 through PO-10.

Blocking dependent implementation:
- PO-01/PO-08: approval authority and manager role model.
- PO-02: expiry duration and revocation behavior.
- PO-03: manual reference uniqueness scope/cross-kind behavior.
- PO-04: aggregate payment semantics and overpayment policy.
- PO-06/PO-10: inventory identity and catalog-only/stock identity.
- PO-07: customer identity key and reuse policy.

PO-05 determines legacy display/reporting and balance semantics. PO-09 determines risk controls and reason-code/threshold design. Resolve these before financial pilot; no-reference exceptions can remain disabled until then.

## 5. SQL/schema and PostgreSQL semantics

### Direction/origin model
The `type = due/paid` plus separate `origin = memo/manual/legacy_unclassified` model is correct. The main remaining issue is completeness of CHECK enforcement over approval/provenance fields, not the overall model.

### CHECK three-valued logic
R2.2 correctly documents PostgreSQL CHECK NULL behavior. The proposed sample remains illustrative, not accepted DDL. Every branch must explicitly constrain every nullable approval field so the predicate cannot pass as NULL or leave untrusted fields unconstrained.

### Composite FK and MATCH SIMPLE
The FK pattern `(shop_id, customer_id) → customers(shop_id, id)` and `(source_memo_id, shop_id, customer_id) → memos(id, shop_id, customer_id)` is appropriate if the ledger CHECK forces all required child fields non-null on memo origin. MATCH SIMPLE skips memo FK checks for manual/legacy rows because source_memo_id is NULL, while the memo-origin branch must force all three components non-null. The nullable parent memo customer is valid only for zero-due memos and cannot be used as a memo-origin due source.

### Cross-table invariants
Ordinary CHECK cannot compare ledger amount with memo due amount or determine memo eligibility. The memo RPC must enforce those invariants atomically and tests must compare committed values.

### Migration guard
A current_user migration principal works only with tightly constrained owner/membership/SET-role arrangements. Do not use caller-settable GUC as migration authority. Close the temporary migration context and verify permanent trigger/role state.

## 6. Lock and concurrency review

The global order operation → shop → customer → inventory is coherent. The remaining risk is incomplete application to workflow transitions. Define exact lock mode/order for memo, manual due, payment, approve, cancel, expire, reject, recover, customer create/get, catalog, stock, legacy reconciliation and break-glass.

Approval row lock before shop/customer is acceptable. Cancellation/expiry may lock only the operation row if they never subsequently acquire lower-order resources. Any workflow that locks shop/customer and then updates/locks the operation row risks a deadlock against approval. Define role revocation serialization and include membership-row locking in the graph if used.

## 7. Idempotency and durable state

R2.2 correctly distinguishes atomic in-flight financial claims, durable pending workflows, historical legacy processing rows, impossible new atomic partial completion and client response uncertainty. Preserve that distinction: financial claims and effects commit in one transaction; durable approval/stock operations use explicit state transitions; browser reload recovers server-side canonical state; new IDs cannot evade unresolved operations or unique business identity.

## 8. T01–T63 test coverage

**Assessment: good breadth; not yet a complete executable acceptance specification.**

| Test area | Coverage | Assessment |
|---|---|---|
| Memo idempotency/duplicate due | T01–T04 | Adequate categories; assert committed rows, audit and stock effects |
| Manual due/reference | T05–T07, T28/T29, T40–T43, T55 | Good basic flow; add role-revocation and approve/cancel/expiry races |
| Payment concurrency | T08–T10, T27, T33/T34, T46/T47 | Broad; add deadlock schedule for approval/cancel/payment |
| Tenant isolation/ACL | T12–T14, T42, T48, T58, T63 | Add nested SECURITY DEFINER, role inheritance and SET ROLE attacks |
| Rollback | T15, T59 | Inject failure at every write/transition and inspect all tables |
| Stock/catalog recovery | T16–T18, T35–T38, T49–T52, T60/T61 | Add duplicate opening action and variant identity cases |
| Migration/legacy | T19–T22, T39, T44, T56 | Add migration principal inheritance/admin-option/trigger-owner attacks |
| FK/CHECK/nullability | T23/T24, T45 | Include every approval/provenance field and every NULL combination |
| Cancellation/reversal | T26 | Sufficient if all edit/delete financial paths are blocked |
| Customer recovery | T54/T62 | Coherent but PO identity policy is pending |
| Audit immutability | T53/T57 | Include function owner and table owner contexts |
| Full writer inventory | T48/T58/T63 | Must be executed; do not accept an unverified inventory |

### Additional recommended cases
1. Approver role revocation committed concurrently with approve RPC.
2. Approval vs cancel vs expire using independent sessions; exactly one terminal state and one audit chain.
3. Approval vs payment and approval vs memo due for same customer.
4. Membership-row lock order and deadlock detection.
5. SECURITY DEFINER function owned by a role with migration-role membership; deployment must reject configuration.
6. Attempt SET ROLE to migration principal from service/function owner and inherited member.
7. Update each nullable approval field independently on posted manual due.
8. Different stock operation IDs with same identity but different variant fields.
9. Retry same opening-stock action with new ID after server indicates prior commit.
10. Catalog identity change while stock creation for old identity is unresolved.
11. Duplicate manual reference across kinds according to final PO decision.
12. Repeated no-reference exceptions for same customer: require approval and audit visibility.

Every test requires independent session IDs where concurrent, request IDs and payload hashes, RPC response/SQLSTATE, before/after committed rows, balance, operation state, audit evidence, stock movements and explicit absence of partial writes.

## 9. Migration, interrupted migration and rollback

R2.2's forward-only migration and recovery principles are sound: preserve historical migrations, preflight, conservative classification, transactional DDL where supported, separate nontransactional index operations, inspect invalid indexes, no blind rerun, and no destructive rollback after financial data exists.

Remaining preconditions:
- Confirm actual migration runner and migration ledger behavior.
- Define exact checkpoints for migration-principal activation and revocation.
- Prove no window exists between backfill and permanent-trigger activation where ordinary writers can create legacy rows.
- Quiesce/revoke financial writers during migration/backfill.
- Test verified staging backup restore after interrupted migration.
- Compare fresh install and upgraded effective schema/security state, not only table definitions.

No migration or rollback was executed in this QA review.

## 10. PO decisions still unresolved

| PO | Outstanding decision | Safe handling until approved |
|---|---|---|
| PO-01 | No-reference approval authority | Owner-only or approved delegated manager; disable exception until policy exists |
| PO-02 | Expiry duration and revocation | Server expiry and role recheck; decide exact duration before deployment |
| PO-03 | Reference uniqueness and cross-kind scope | Do not finalize unique indexes until scope is approved |
| PO-04 | Aggregate payment and overpayment | Do not claim memo settlement; approve aggregate policy |
| PO-05 | Legacy display and balance inclusion | Label historical-origin-unknown; confirm aggregation/accounting policy |
| PO-06 | Inventory identity and variants | No name-only uniqueness until variant rules approved |
| PO-07 | Customer identity/create-or-get | No automatic merge; choose stable shop-scoped key |
| PO-08 | Manager role model | Owner-only default or disable exception; do not infer member authority |
| PO-09 | No-reference limits/reason codes | Do not invent thresholds or taxonomy |
| PO-10 | Catalog-only vs stocked identity | Preserve separate state; approve canonical identity/opening-stock policy |

PO-01/08, PO-02, PO-03, PO-04, PO-05, PO-06/10 and PO-07 affect financial authorization, accounting or schema uniqueness. Resolve them before dependent implementation or pilot acceptance.

## 11. Mandatory R2.3 corrections

### P0
1. Complete CHECK field matrix with explicit nullability for all provenance/approval fields in every branch.
2. Specify exact SECURITY DEFINER identity contract for approval RPCs: trusted auth subject, database current_user, owner role, shop authorization source and role-revocation serialization.
3. Close migration-role trust: membership/SET/INHERIT/admin-option, ownership, function owner and trigger owner constraints; prove no nested SECURITY DEFINER path can use migration context.
4. Publish complete lock graph for every workflow transition, including approve/cancel/expire/reject, with exact lock order and role recheck behavior.
5. Finalize operation identity model for atomic requests versus durable workflows and ensure no new-ID retry duplicates a business action.
6. Finalize identity uniqueness decisions needed for manual references, customer create-or-get, catalog/stock and opening-stock movement.

### P1
7. Add adversarial role-revocation and approval/cancel/expiry concurrency tests.
8. Add migration-principal SET ROLE/role inheritance/admin-option tests.
9. Add audit approval-field update/delete negative tests under function owner and service roles.
10. Add stock/catalog variant and unresolved-operation/new-ID duplicate tests.
11. Confirm catalog audit coverage only after all direct catalog write paths are removed.
12. Confirm customer create-or-get behavior for concurrent different operation IDs and conflicting identity details.

## 12. Runtime verification status

**NOT EXECUTED in this review:** PostgreSQL/Supabase migration; CHECK/FK/index runtime; current_user/session_user/SECURITY DEFINER behavior; role membership/SET ROLE; RLS/ACL; payment/approval concurrency; deadlock tests; transaction failure injection; browser reload/response-loss recovery; backup/restore.

The R2.2 document itself labels T01–T63 proposed/not executed. This report makes no runtime PASS claim.

## 13. Final QA disposition

# NEEDS REVISION

**Severity: HIGH**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.2 is substantially improved and the architecture is generally acceptable as a design direction. It is not ready for implementation approval because the CHECK/provenance matrix remains incomplete, and the trusted authorization, migration-principal and global lock/recovery contracts still need final precision.

Do not authorize SQL or application implementation until the P0 items are resolved, the PO decisions for dependent features are explicit, and a revised design is submitted for independent QA.

**Explicit statement:** This report does not grant implementation approval. Runtime tests and database verification were NOT EXECUTED. No application code, SQL migration, staging database or production database was accessed or mutated. PR #4 was not merged or modified. PR #2, PR #3 and `main` were not modified by this QA work.