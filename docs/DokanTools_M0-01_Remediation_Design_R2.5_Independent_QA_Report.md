# DokanTools — M0-01 Remediation Design R2.5 Final Independent QA Report

**Role:** CH-4 Independent QA & Test Engineer  
**Repository:** Hasnat26/DokanTools  
**Reviewed PR:** https://github.com/Hasnat26/DokanTools/pull/10  
**Reviewed branch:** `docs/m0-01-remediation-design-r2-5`  
**Reviewed document:** `docs/M0-01_Remediation_Design_R2.5.md`  
**Exact reviewed head:** `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512`  
**Document blob SHA:** `1ca33fb640b258a7c6d342ba4604c51c68fed55f`  
**PR #10 base:** `f3772c95ce40b9d5a7526ae6764f8f0896b69b05`

**QA branch:** `qa/ch4-m0-01-r2-5-independent-final`  
**QA branch base:** `efa7d5da139030c092089831f813df697eaed71e`

---

## 1. Verdict

# NEEDS REVISION

**Overall severity: HIGH**  
**Design closure:** NOT GRANTED  
**Implementation approval:** NOT GRANTED  
**Financial pilot:** NO-GO  
**Runtime/database verification:** NOT EXECUTED

R2.5 is a substantial improvement over R2.4. It corrects the F22 traceability mapping, separates approval-operation lifecycle state from ledger provenance, states the intended reciprocal operation↔ledger invariant, establishes one canonical lock ordering, adds positive and negative two-session schedules, expands T01–T63 into individual test rows, strengthens migration handoff evidence, and retains all PO-01–PO-10 decisions as pending.

However, the R2.5 document still contains design-level ambiguity where it claims a total/exhaustive contract. The highest-impact residual issues are: incomplete state-specific actor/confirmation/event rules in the operation matrix; a ledger provenance matrix that still uses conditional/HIST/unspecified values; missing exact schema/constraint mapping for the reciprocal cardinality mechanism; lock/test schedules with nondeterministic outcomes; and test definitions that sometimes conflict with their own fixed fixtures or retain conditional acceptance outcomes. These prevent an ACCEPT verdict.

## 2. Scope and evidence basis

Reviewed directly from GitHub:
- PR #10 metadata at exact head `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512`; open, draft, unmerged, one changed file.
- Full R2.5 design at that exact commit.
- Actual CH-4 R2.2 QA report in PR #5.
- Actual CH-4 R2.3 QA report in PR #7.
- Actual CH-4 R2.4 QA report in PR #9.
- PR #10 changed-file list and base/head metadata.

PR #10 changes only `docs/M0-01_Remediation_Design_R2.5.md`. It is open/draft/unmerged and based on R2.4 exact head `f3772c95ce40b9d5a7526ae6764f8f0896b69b05`.

Evidence labels:
- **VERIFIED — document:** directly supported by the cited R2.5 section.
- **DESIGN DEFECT:** internal specification cannot enforce or uniquely determine the claimed invariant.
- **DESIGN AMBIGUITY:** more than one materially different behavior remains possible.
- **PARTIALLY ADDRESSED:** earlier finding improved but acceptance condition remains.
- **PENDING DEPENDENCY:** correctly deferred to PO/DBA/security/runtime; not itself a defect if dependent functionality stays disabled.
- **UNVERIFIED — runtime:** requires actual database/application execution.

No application code, SQL migration, database, staging or production system was accessed or modified. No tests were executed. No PASS claim is made.

## 3. Prior finding traceability — F22-01 through F22-11

**Disposition: ACCEPTED AS CORRECT TRACEABILITY.**

R2.5 §3 now uses the actual prior PR #5 finding meanings, as corrected in PR #7 and re-confirmed in PR #9. The F22 mapping is no longer the R2.4 error. Specifically, F22-06 is idempotency versus durable pending workflow; F22-08 is catalog audit/direct-write boundary; F22-09 is customer create-or-get; F22-10 is audit immutability/privileged owner; and F22-11 is PO decision dependency.

R2.5 appropriately keeps F22-01, F22-02, F22-03, F22-04, F22-05 and F22-07 partial where schema, role, PO or runtime proof remains outstanding. It does not treat a related section alone as proof of runtime closure.

Remaining caveat: F22 statuses are design dispositions only. F22-02/03/04/05/07/08/10 still require the exact DBA/PO/runtime work listed in §3; no underlying runtime control has been verified.

## 4. Findings register

### F25-01 — Operation lifecycle matrix leaves state-dependent actor and confirmation fields unresolved

**Severity:** HIGH  
**References:** R2.5 §§4.1–4.3; particularly §4.2 rows `approver_user_id`, `confirmation_actor`, `confirmation_method`, `terminal_event_id`, and rule 4.  
**Classification:** DESIGN DEFECT / DESIGN AMBIGUITY  
**Blocks:** Design closure; implementation; financial pilot.

**Reproducible technical explanation:**

§4.2 is presented as a NULL/NOT NULL/immutable matrix, but several cells remain conditional rather than closed. `approver_user_id` for cancelled/rejected operations depends on policy; `confirmation_actor` is marked NN while the exact actor policy is PO-pending; confirmation fields are IMM across states without fully defining whether they are submission confirmation or approval confirmation; `reason_code/text` is NN only “according to approved reason policy”; and terminal event/audit IDs are not fully defined when both terminal and audit fields may identify the same event. Rule 4 says rejection actor must be in a separately defined field/event, but the matrix does not name that field. This permits schema designers to select different persisted layouts while claiming the matrix is normative.

**Required correction:**
- Define separate immutable submit-confirmation fields and approval-authorization fields, with actor provenance and timestamp rules.
- Define an explicit `terminal_actor_user_id`/terminal actor evidence structure for cancelled/rejected/expired states, or explicitly state that no user actor is recorded for system expiry.
- For each state, give exact NULL/NN/ENUM rules for reason fields, confirmation fields, approval fields, terminal event IDs and audit IDs.
- Distinguish a trusted identity actor from a workflow confirmation assertion; do not treat `confirmation_actor` as proof of authenticated authorization.
- Where PO policy legitimately determines a field, keep the dependent operation disabled until policy choice and then publish the selected matrix before implementation.

### F25-02 — Posted ledger provenance matrix is still not fully total for legacy and confirmation semantics

**Severity:** HIGH  
**References:** R2.5 §§5.1–5.4, especially §5.2 branch rows `referenced manual due`, `manual payment`, `historical legacy due/paid`, and §5.3.  
**Classification:** DESIGN DEFECT  
**Blocks:** Design closure; implementation; financial pilot.

**Reproducible technical explanation:**

R2.5 improves the separation between operation-only and ledger-only fields, but the claimed “total valid branch matrix” still uses values that are not schema-ready: `HIST`, “false or NULL per exact schema branch”, “NULL unless source evidence exists”, “explicit approved legacy representation”, and “NN only if migration provenance generated and retained”. Those descriptions do not define exactly which field is NULL or which typed historical representation is stored in each scenario. The referenced manual due row also leaves `independent_confirmation` as “false or approved exact N/A value”; the manual payment row allows false or NULL; legacy rows allow multiple conditional forms. A matrix with these alternatives is not yet total.

**Required correction:**
- For each ledger branch and every field in §5.1, specify exactly NULL, NN, one named ENUM, or one concrete legacy-only typed representation.
- Define whether `independent_confirmation` is required for referenced manual dues and manual payments; do not leave false/NULL alternatives.
- Define exactly when `legacy_import_batch_id` and `legacy_snapshot_digest` are populated, including the no-source/unknown case.
- Define if legacy approval metadata is always NULL in this scope; do not retain an exception for historic approval unless it is represented by a separately approved, explicitly typed historical record and does not imply current M0-01 approval.
- Keep legacy `source_memo_id` NULL absent separately approved positive proof/reclassification; the candidate metadata must remain non-authoritative.

### F25-03 — Logical reciprocal cardinality mechanism lacks exact constraint-trigger and mutation semantics

**Severity:** HIGH  
**References:** R2.5 §§6.1–6.3, especially §6.2 “Constraint design”, “Deferrability and timing”, and “ACL/ownership boundary”.  
**Classification:** DESIGN AMBIGUITY / ENFORCEMENT SPECIFICATION GAP  
**Blocks:** Design closure; implementation; financial pilot.

**Reproducible technical explanation:**

R2.5 correctly recognizes that a ledger→operation FK and partial unique index provide only existence/at-most-one, not “posted iff exactly one”. It therefore proposes a reciprocal FK and a DEFERRABLE INITIALLY DEFERRED constraint trigger on both operation and ledger tables. This is the right enforcement direction. However, it does not identify the exact trigger event/row-key algorithm, handling of deleted/replaced ledger rows, update transitions, cascaded FK actions, or locking needed to prevent two concurrent transactions from each observing a locally valid but globally conflicting state. It also says a trigger “or equivalent DBA-approved constraint mechanism”, leaving multiple materially different mechanisms acceptable. §6.2 says exact columns must avoid FK cycles “if schema permits”, not how a failure to support that design is resolved.

**Required correction:**
- Choose one normative mechanism: reciprocal deferred FK plus deferred constraint trigger, or another fully described equivalent. Do not leave alternatives open in the closure candidate.
- Specify trigger firing on INSERT/UPDATE/DELETE on both tables, key derivation from OLD and NEW rows, and how status/ledger ID changes are checked.
- Define concurrency serialization/locking for the operation key and ensure deferred validation cannot race with concurrent row changes.
- State precise FK nullability, `MATCH SIMPLE`/`MATCH FULL` behavior, deferrability, referential actions and unique indexes.
- Define failure behavior for operation delete, ledger delete, relink, status-only update, duplicate ledger insert and operation reassignment.
- Prove via proposed tests that every bypass path is denied by ACL and that only the approved posting RPC can complete the reciprocal pair. No runtime proof is claimed.

### F25-04 — Canonical lock schedules are named deterministic but key outcomes remain underspecified

**Severity:** MEDIUM  
**References:** R2.5 §§7.1–7.4; especially LOCK-01–10 and LOCK-N01–05.  
**Classification:** DESIGN AMBIGUITY  
**Blocks:** Design closure for lock/test specification; implementation; financial pilot.

**Reproducible technical explanation:**

R2.5 provides one canonical hierarchy and explicitly distinguishes shop `FOR KEY SHARE` from the customer `FOR UPDATE` balance mutex. It also supersedes conflicting R2.4 endpoint descriptions. However, the schedule table still uses phrases such as “first winner”, “both may commit”, “per PO-04”, “conflict/recovery per PO”, and “deadlock/timeout”. LOCK-N01–N03 do not specify expected SQLSTATE (`40P01` versus `55P03`), timeout settings, victim session, barrier command sequence, or evidence for each schedule. LOCK-N04 and N05 describe forbidden production patterns but do not give executable negative harness preconditions/results. §7.3 acknowledges PostgreSQL-version/schema-specific implicit locks but does not give a constraint/trigger lock inventory template or required inventory output. These gaps prevent exact reproducibility.

**Required correction:**
- Expand each LOCK case into explicit numbered statements/barriers, fixed starting rows/balances, lock observations, commit/rollback ordering, and exact expected success/domain result.
- For each negative test, specify the deliberate inversion, `lock_timeout`/deadlock detection behavior, expected SQLSTATE or allowed bounded outcome, victim session and post-rollback committed-state snapshot.
- For LOCK-04, explicitly show both distinct-customer sessions concurrently holding customer locks while sharing shop-level KEY SHARE, demonstrating no shop-wide balance mutex.
- Define the DBA inventory deliverable for all FK parent checks, unique-index conflict points, trigger SQL, cascades and function-internal locks, tied to actual schema revision.
- Any PO-pending payment/identity branch must have “feature disabled / no write” as the pre-approval expected result, then a separately approved scenario after decision.

### F25-05 — T01–T63 contains policy-conditional and fixture-inconsistent expected outcomes

**Severity:** HIGH  
**References:** R2.5 §§11.1–11.2, particularly T08–T18, T28–T34, T45, T48, T52, and the completeness statement after T63.  
**Classification:** DESIGN DEFECT / TEST SPECIFICATION INCOMPLETENESS  
**Blocks:** Design closure; implementation; financial pilot.

**Reproducible technical explanation:**

R2.5 makes a major improvement: it gives stable synthetic IDs, a shared evidence contract, and an individual row for each T01–T63. However, not all cases have a single deterministic expected result. Examples:
- T08/T33 include both a specific final balance/accepted row expectation and a PO-04-dependent “one accepted / policy-approved count” outcome. The test cannot be run deterministically until pre-approval feature-disabled behavior is separated from post-approval policy cases.
- T18 permits either catalog creation or disabled behavior, depending on PO approval, in one test case.
- T31 says success only if baseline product allows the operation, without defining the baseline acceptance fact or a preflight result.
- T16 describes timeout after an opening movement commit, but the expected committed operation/audit/result rows and recovery sequence need exact assertions in this test row (not only supplemental CAT tests).
- T17 says confirmed rollback and retry success but does not enumerate which operation/request/event rows must be absent before retry and present after retry.
- T28 combines submit and approval in one row while approval role policy remains pending; its expected result is conditional rather than a fixed feature-disabled result before PO approval.
- T45 claims exhaustive field mutation but does not enumerate a cross-product tying every field in §§4–5 to each valid and prohibited branch; the PNV suite covers many fields but does not fully specify every state transition field from §4.2.

**Required correction:**
- Split PO-gated tests into two explicit test cases or branches: pre-approval must prove writer disabled/no write; post-approval must use a fixed approved fixture and expected result.
- Make baseline product assumptions explicit and version-pinned, or change tests to verify only the accepted design invariant.
- Add before/after operation, ledger, audit, stock movement and canonical ID assertions directly to every response-loss/failure-injection case.
- Add a machine-auditable matrix mapping each persisted operation/ledger field × valid branch × prohibited mutation to PNV/test IDs.
- Replace “success if allowed”, “per PO”, and unspecified result alternatives with deterministic outcomes or clearly split scenarios.

### F25-06 — Supplemental test family contracts still rely on generic evidence and vague expected outcomes

**Severity:** MEDIUM  
**References:** R2.5 §12; PNV-01–35, MIG-01–10, ADV-01–15, LEG-01–08, CAT-01–10, CUST-01–05 and AUD-01–05.  
**Classification:** PARTIALLY SPECIFIED  
**Blocks:** Test-specification design closure; implementation/pilot acceptance.

**Reproducible technical explanation:**

R2.5 provides scenario/action/result/assertion rows for the supplemental families, which is an improvement over R2.4. The remaining suite still often uses “reject”, “denied/review”, “success if approved”, “deadlock/timeout”, “only if approved”, and generic references back to §11.1 instead of a unique exact SQLSTATE/domain result and query-level assertion. For example MIG-05 allows denial unless “exact controlled runner context” without specifying exact actor/session; ADV-05 allows both rows or a policy rejection; CAT-03 and CAT-09 refer to conflict/review without a frozen code; CUST-03 depends on the still-pending PO-07 identity key; AUD-02 has an open owner boundary. These are acceptable future gates only where pre-approval behavior is explicitly disabled and post-approval tests are separately defined.

**Required correction:**
- Freeze expected outcomes and SQLSTATE/domain codes for implementation tests, or define exact pre-approval no-write behavior pending PO/DBA decisions.
- Give MIG-05 the exact intended runner identity and SECURITY DEFINER owner/trigger context; keep owner/superuser residual tests separately classified as governance evidence.
- Split ADV-05 into deterministic allowed/denied cases after PO decision; do not leave “both rows or one policy rejection”.
- Give CAT/CUST tests approved identity-key fixtures only after PO-06/07/10 are resolved, plus pre-approval disabled/no-write assertions.
- Add query names or SQL snippets for committed row counts/digests/event counts to each family; generic evidence contract does not resolve ambiguous individual outcomes.

### F25-07 — Operation and ledger schema mapping remains a material pre-implementation dependency

**Severity:** MEDIUM  
**References:** R2.5 §§4.1, 5.1–5.3, 6.2–6.3.  
**Classification:** PENDING DBA DEPENDENCY, but design closure wording must remain conditional  
**Blocks:** Implementation until DBA mapping; does not alone block acceptance as a design-only candidate if explicitly retained as a gate.

**Reproducible technical explanation:**

R2.5 explicitly says logical operation fields must be mapped to exact columns/types before implementation and that actual schema/constraint fit remains for DBA review. This is correctly deferred. However, the logical schema uses names such as `approval_shop_id`, `approval_operation_type`, `approval_operation_id`, `ledger_entry_id`, `approval_event_id`, and legacy batch/digest fields without confirming whether they are new fields, existing fields or a side-table design. Circular reciprocal FKs and trigger strategy depend materially on those physical choices.

**Required correction:**
- Preserve the DBA gate, but add a mandatory schema-mapping deliverable: logical field → physical table.column/type/nullability/index/FK/owner/ACL/trigger.
- Provide a single documented alternative if the current schema cannot support reciprocal FK linkage without cycles; require CH-1/CH-4 re-review of that alternative before implementation.
- Do not represent the schema as implementation-ready until the mapping and constraint plan are signed off.

### F25-08 — PO and migration/audit gates are correctly pending; no defect found in their governance posture

**Severity:** LOW  
**References:** R2.5 §§1, 8–10, 13–15.  
**Classification:** PENDING DEPENDENCY — ACCEPTED AS DOCUMENTED  
**Blocks:** Implementation/pilot until approvals and runtime verification; does not independently block design closure.

**Evidence and reasoning:**

R2.5 leaves PO-01–PO-10 PENDING and clearly states CH-3 recommendations are not approvals. PO-dependent reference, payment, customer and inventory decisions are not represented as approved. §§8 and 13 keep financial writers disabled through migration, role/ACL closure, independent verification and runtime evidence. §8.2 correctly limits audit immutability claims at owner/table-owner/DBA/superuser boundaries and conditions complete catalog audit on direct writes being revoked. This report does not treat the absence of DBA/runtime evidence as a design defect where the document expressly marks the work pending and fail-closed.

Required action is operational rather than a design correction: retain these gates and do not activate dependent writes/indexes until the named approval and evidence exist.

## 5. Acceptance matrix

| Review area | R2.5 result | Disposition |
|---|---|---|
| F22-01–F22-11 traceability | Correct mapping against actual PR #5/#7 and prior PR #9 | ACCEPTED |
| Operation lifecycle matrix | Improved but actor/confirmation/event cells remain conditional | NEEDS REVISION |
| Posted ledger provenance matrix | Improved but HIST/conditional cells remain | NEEDS REVISION |
| PostgreSQL CHECK 3VL | Correctly distinguishes CHECK from auth/runtime invariants | ACCEPTED AT DESIGN LEVEL |
| Approval↔ledger cardinality | Reciprocal/deferred enforcement concept described; trigger/constraint mutation details incomplete | NEEDS REVISION |
| Canonical lock ordering | One canonical hierarchy; customer mutex correctly identified | ACCEPTED AT HIGH LEVEL; schedules need detail |
| Implicit PostgreSQL locks | Recognized; inventory remains DBA/runtime dependency | PENDING, not design failure if retained |
| T01–T63 | Individually listed, but several outcomes conditional/underspecified | NEEDS REVISION |
| Migration handoff/role closure | Ordered states, durable phase, reviewer separation, fail-closed | ACCEPTED AS DESIGN; runtime NOT EXECUTED |
| Direct-write/audit restrictions | Correct target restriction and privileged residual | ACCEPTED AS DESIGN; runtime NOT EXECUTED |
| PO-01–PO-10 | All PENDING; affected work gated | ACCEPTED AS GOVERNANCE |

## 6. Required correction priority

**P0 — before design closure:**
1. F25-01: close operation lifecycle actor/confirmation/terminal-event rules.
2. F25-02: remove all conditional/HIST ambiguity from the posted-ledger provenance matrix.
3. F25-03: specify one enforceable reciprocal cardinality mechanism including trigger mutation events, concurrency lock, FK actions and bypass denial.
4. F25-05: make T01–T63 deterministic, particularly policy-gated and response-loss/failure tests.

**P1 — before implementation/runtime test authorization:**
5. F25-04: expand LOCK-01–10 and LOCK-N01–05 into numbered session scripts and specify expected SQLSTATE/timeout/victim/evidence.
6. F25-06: close supplemental suite expected outcomes and exact evidence queries.
7. F25-07: complete DBA schema mapping and select exact physical constraint design.
8. Preserve F25-08 governance gates; do not authorize any PO item or enable blocked modules in this QA report.

## 7. Runtime verification status

**NOT EXECUTED:**
- PostgreSQL/Supabase schema, CHECK/FK/unique/deferred constraint and trigger execution.
- Reciprocal operation↔ledger commit-time cardinality and concurrent bypass attempts.
- `auth.uid()`, JWT/PostgREST, `current_user`, `session_user`, SECURITY DEFINER identity/search_path/ACL.
- Migration role SET/INHERIT/ADMIN closure and handoff under connection loss/stale pooled sessions.
- Financial balance concurrency, implicit FK/unique/trigger locks, deadlock/timeout behavior and failure injection.
- All T01–T63, PNV, MIG, ADV, LOCK, LEG, CAT, CUST and AUD tests.
- Catalog/stock/customer reload and local-storage-loss recovery.
- Backup/restore and browser runtime.

No PostgreSQL, staging or production PASS is claimed. All tests remain PROPOSED / NOT EXECUTED.

## 8. Final disposition

# NEEDS REVISION

**Overall severity: HIGH**  
**Design closure: NOT GRANTED**  
**Implementation approval: NOT GRANTED**  
**Financial pilot: NO-GO**

R2.5 resolves important R2.4 findings and is close to an acceptable design closure candidate. It is not accepted because the operation and ledger matrices still contain unresolved conditional field semantics, the reciprocal cardinality mechanism is not yet specified at trigger/mutation/concurrency level, and the consolidated test specifications retain nondeterministic branches. These issues are correctable and do not require rejecting the overall architecture.

**Restrictions:** This is documentation-only independent QA. No application code, SQL migration, database, staging or production system was changed or tested. PR #10 and PR #2–#9 were not modified. No PO approval, implementation approval, merge or deployment is granted. Financial pilot remains NO-GO.