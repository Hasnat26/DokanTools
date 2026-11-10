# DokanTools — DT-002 Post-R2.10 Documentation Consolidation

**Record type:** DBA Evidence Register + Manifest Work Register + Governance Gate Summary  
**Status:** DRAFT / SUBMITTED FOR CH-1 REVIEW — documentation only  
**Exact reviewed design baseline:** R2.10 commit `8c0cf59a7dcba7b4d353207c42c99a9800434542`  
**Reviewed document:** `docs/M0-01_Remediation_Design_R2.10.md`  
**CH-1 review source:** PR #17 comment https://github.com/Hasnat26/DokanTools/pull/17#issuecomment-6736302832  
**Original CH-4 F25 source:** PR #11 report `docs/DokanTools_M0-01_Remediation_Design_R2.5_Independent_QA_Report.md`  
**Repository default branch at preparation:** `main`  
**Consolidation branch base:** exact reviewed R2.10 commit above

> This document is a tracking and evidence-control artifact. It does not revise R2.10's logical design, create executable SQL/test definitions, or constitute DBA/PO approval. R2.10 and its PR/review history are preserved unchanged. No physical, runtime or database verification is claimed.

---

## 1. Purpose, precedence and evidence rules

This register consolidates remaining work after the CH-1 R2.10 documentation disposition. R2.10 remains the controlling logical design candidate for the subjects it covers. The CH-1 issue comment on PR #17 records **ACCEPT WITH CONDITIONS** for documentation review and explicitly retains implementation and pilot gates.

### 1.1 Evidence precedence

1. Exact GitHub artifact or review comment on the relevant commit.
2. The original CH-4 F25 report in PR #11 for the source definition of F25-01–F25-08.
3. CH-1's R2.10 disposition in PR #17 for the current review status and residual conditions.
4. PR #13 handoff and Sprint plan as historical coordination records only; they are not current M0-01 gate approvals.

Where an expected artifact cannot be located in the accessible repository record, this register reports it as **NOT LOCATED / NOT VERIFIED**. No inferred content is promoted to a verified source record.

### 1.2 Status vocabulary

- **PENDING:** assigned work not yet evidenced as complete.
- **UNVERIFIED:** requirement exists but supporting proof was not available or has not been independently checked.
- **BLOCKED:** the next activity cannot proceed until a named prerequisite is supplied and accepted.
- **ACCEPTED AT LOGICAL DOCUMENTATION LEVEL:** reviewer accepted the written contract, not physical feasibility or execution.
- **NOT EXECUTED:** no runtime/database test evidence exists in the reviewed record.
- **NOT APPLICABLE:** may be used only with documented evidence and reviewer acceptance; not assumed.

### 1.3 Authorization rule

Documentation acceptance does not authorize application implementation, SQL execution, database mutation, test execution, QA execution, merge, deployment, production data use, or pilot. Each remains subject to separate explicit authorization and required evidence/review gates.


---

## 2. Deliverable A — DBA Evidence Register

**Register owner:** CH-3 maintains this register; DBA supplies physical evidence; CH-1 reviews completeness/disposition; CH-4 independently assesses evidence when authorized by the review sequence.

**Current overall status:** all rows below are **PENDING / UNVERIFIED / BLOCKED** as indicated. No DBA physical feasibility acceptance is evidenced in the reviewed PR #17 record.

| ID | Requirement / evidence needed | R2.10 section | Owner | Required artifact or proof | Status | Blocking gate | Acceptance criteria | Physical/runtime verification? |
|---|---|---:|---|---|---|---|---|---|
| DBA-01 / CH4-30-01 | Source predicate, source-row concurrency control and phantom protection for every mutation class | §19 | DBA; CH-3 supplies mutation inventory | Predicate-to-index/guard map; isolation-level and row-lock strategy; concurrent UPDATE/DELETE/INSERT/phantom schedule; exact expected identity/version/count and abort proof | PENDING / UNVERIFIED | F25-07; implementation gate | Demonstrates no qualifying source row can enter/leave/change key or version between authoritative discovery and protected DML without conflict/abort; exact mechanism mapped to actual schema | Yes — physical PostgreSQL verification required; runtime concurrency evidence required only after separate authorization |
| DBA-02 / CH4-30-02 | Trusted authenticated-subject context and SECURITY DEFINER trust chain | §§13.3, 19.5–19.6 | DBA / Security; CH-3 documents contract | Function owner, SECURITY DEFINER, fixed search_path, EXECUTE grants, caller-auth assertion source, backend PID/transaction ID/nonce/request-digest binding, context-table privileges and cross-context forgery denial evidence | PENDING / UNVERIFIED | F25-07; security/implementation gate | Application role cannot forge subject, shop, RPC identity, backend/transaction binding, nonce or registered key set; all function and table grants are proven from actual catalogs | Yes — catalog/ACL inspection and authorized negative runtime tests |
| DBA-03 / CH4-30-03 | N02D forbidden-path callable surface, ACL and denial SQLSTATE | §20 | DBA / Security; CH-3 test-contract owner | Complete callable function inventory; table/sequence privileges; function ownership/search_path/EXECUTE map; alternate writer paths; exact attempted forbidden calls; observed denial SQLSTATE and lock snapshot | BLOCKED / SQLSTATE UNVERIFIED | F25-04 and F25-07; N02D gate | Every non-approved mutation/lock path is denied before protected row lock or DML; one exact denial outcome is pinned from actual mapping; no 40P01 expectation is used for the approved RPC path | Yes — physical ACL mapping and authorized negative test |
| DBA-04 / CH4-30-04 | PostgreSQL feasibility of FK/UNIQUE/CHECK/deferred-constraint cycle | §§14, 21 | DBA | Actual PostgreSQL version; logical-to-physical column map; unique target eligibility; FK columns/actions/MATCH/deferrability; CHECK definitions; deferred constraint-trigger event/row-key behavior; commit/rollback evidence | PENDING / UNVERIFIED | F25-07; implementation gate | Actual schema supports the exact R2.10 reciprocal invariant and nullable non-posted/posted branches; any incompatibility is documented and returned to CH-1/CH-4 before design change | Yes — catalog/schema feasibility; controlled transaction proof only after authorization |
| DBA-05 / CH4-30-05 | INSERT/UPDATE/DELETE trigger, RETURNING, read-back and partition reconciliation | §§13.2, 22 | DBA; CH-3 maps mutation classes | Per-table/event trigger inventory; transition-relation support; RETURNING/read-back capability; partition routing and trigger firing map; per-identity OLD/NEW full-K equality proof or blocked disposition | PENDING / UNVERIFIED | F25-07; mutation-class enablement gate | For each mutation class, exact expected identities and full OLD/NEW K pairs equal observed DML output/read-back; count-only checks rejected; unsupported table/partition path marked BLOCKED | Yes — physical trigger/partition inspection and authorized runtime verification |
| DBA-06 / DTK1 vectors and multi-key ordering | DTK1 input/hash/signed-bigint/namespace vectors and shared writer/trigger ordering | R2.8 §5; R2.10 §§13.2, 19.2 | DBA; CH-3 maintains vector specification | Independently calculated canonical vectors (UTF-8 bytes, full SHA-256, first 8 bytes, unsigned/signed values, namespace/pair); multiple K sorted acquisition order; collision and concurrent multi-key traces | PENDING / UNVERIFIED | F25-04 / F25-07; lock feasibility gate | Independent implementation reproduces all vectors; writer/guard/deferred validation agree; multi-key acquisition uses identical full-K bytewise order; no out-of-order lock acquisition | Yes — implementation/vector proof and authorized concurrency test |
| DBA-07 / PostgreSQL version + schema/partition map | Actual database product/version and full physical map | §§13.4, 14, 19, 21, 22 | DBA | Signed version inventory; relation/partition/column/type/nullability map; indexes/constraints/triggers/functions/roles/grants; schema revision identifier and evidence timestamp/hash | PENDING / NOT LOCATED | F25-07 | Every logical R2.10 object maps to an actual object or is explicitly absent; physical constraints and partition paths are identified; signed by accountable DBA | Physical catalog inspection required; no runtime PASS implied |
| DBA-08 / N02D negative-test evidence | Forbidden direct/alternate entry-point attempts and denial proof | §20 | DBA / Security; CH-4 independently reviews | Approved isolated fixture/role; exact attempted routine/table operation; exact SQLSTATE from actual ACL/function mapping; backend/transaction/lock snapshot; B0/B1 business-state comparison | BLOCKED | DBA-03 complete and explicit test authorization | Both forbidden attempts fail before protected mutation/lock acquisition; B0=B1 for operation/event/ledger/balance; evidence retained and reviewed | Yes — authorized negative test; NOT EXECUTED |
| DBA-09 / isolation, lock, retry and rollback evidence | Actual isolation behavior, lock hierarchy, timeout/deadlock handling, transaction retry and atomic rollback | §§6, 13, 15, 19, 21 | DBA; CH-3 maintains schedule map; CH-4 reviews test design | Actual isolation setting; lock inventory; two-session wait graphs; lock ordering traces; deadlock/timeout classification; fresh-transaction retry evidence; whole-transaction rollback/COMMIT failure snapshots | PENDING / UNVERIFIED | F25-04 / F25-07; runtime gate | Approved paths acquire advisory locks before row locks; retry starts in fresh transaction with full rediscovery; failed deferred constraint or DML leaves no partial operation/event/audit/ledger/balance effect | Yes — physical lock mapping and authorized runtime concurrency/failure tests |
| DBA-10 / Direct DML and writer inventory | Prove only approved RPCs can mutate protected relations | §§13.1, 13.3, 13.4, 19.5 | DBA / Security | Complete application/service/owner roles, direct table/sequence grants, function EXECUTE grants, SECURITY DEFINER inventory, writer routine inventory and privilege-negative evidence | PENDING / UNVERIFIED | F25-07; writer activation gate | Every protected write route is inventoried; application roles cannot bypass approved RPC; unknown writer count is zero or affected capability remains disabled | Physical catalog and authorized negative test required |
| DBA-11 / FK-cycle final-state evidence | Non-posted NULL branch and posted reciprocal FK cycle | §§14, 21 | DBA | Mapped FK-O-L and FK-L-O-L constraints, exact unique target, NULL/non-NULL CHECK, deferred trigger inventory, commit-time and forced-rollback evidence | PENDING / UNVERIFIED | DBA-04; implementation gate | Non-posted operation with NULL ledger pointer is accepted only under non-posted CHECK; posted requires non-NULL pointer and one exact reciprocal ledger row at COMMIT; any violation rolls back entire transaction | Physical schema validation and authorized transaction test required |

### 2.1 DBA evidence intake fields

| Field | Required content |
|---|---|
| Evidence ID | Stable unique register ID; not a test/query ID |
| Requirement ID | DBA-01 … DBA-11 |
| Source revision | Actual schema revision / PostgreSQL version / repository commit where relevant |
| Artifact locator | Exact repository path, PR comment, approved secure evidence store reference or ticket |
| Evidence owner | Named DBA/security owner or accountable role |
| Captured at | Timestamp with timezone |
| Integrity | SHA-256 or repository commit/blob identity where applicable |
| Scope | Relations, functions, roles, partitions, mutation class and environment covered |
| Result | VERIFIED / PARTIALLY VERIFIED / BLOCKED / NOT APPLICABLE with rationale |
| Reviewer | DBA peer and CH-1; CH-4 where independent QA evidence review is required |
| Authorization | Explicit approval reference for any runtime evidence collection |

No evidence artifact is registered as received in this consolidation. CH-1's R2.10 comment names residual dependencies but is not physical DBA proof.


---

## 3. Deliverable B — Manifest Work Register

### 3.1 Current scope — preserved without reclassification

| Scope | Total | Fully specified / confirmed | Closed | Overall status | Row-level classification | Blocked/partial breakdown | Actual query IDs assigned |
|---|---:|---:|---:|---|---|---|---:|
| T01–T63 | 63 | 0 | 0 | 63 NOT CLOSED | UNAUDITED | NOT ESTABLISHED | 0 confirmed |
| LEG/CAT/CUST/AUD | 28 | 0 with complete executable contracts | 0 | 28 enumerated; 28 blocked; NOT CLOSED | Family-level enumeration only; case contracts remain incomplete | 28 blocked; no partial split established | 0 |

**Preserved finding status:**
- F25-05 — **PARTIALLY ADDRESSED**.
- F25-06 — **PARTIALLY ADDRESSED**.
- F25-07 — **PENDING**.
- F25-08 — **PENDING**.

No status is upgraded by this register.

### 3.2 T01–T63 row-by-row audit work

**Source limitation:** the accessible R2.10 document and CH-1 review state that 63 test IDs exist but the complete authoritative row-by-row manifest is not present in the accessible R2.10/PR #17 artifact. PR #11 contains the original CH-4 review report, not the 63-row source manifest. PR #13 planning/handoff records do not provide those individual test rows. Therefore this document intentionally does **not** generate T01…T63 placeholder rows or infer each case's definition/status.

| Work item | Current status | Owner | Required source/evidence | Acceptance criteria | Dependency |
|---|---|---|---|---|---|
| Locate authoritative T01–T63 source manifest | BLOCKED / NOT LOCATED | CH-1 + CH-3 | Exact repository path/commit or explicitly supplied source artifact containing all 63 individual rows | Source provenance, version and completeness confirmed; no reconstructed row substituted for source | CH-1 identifies source record or PO supplies it |
| Audit T01–T63 IDs 1–63 | NOT STARTED | CH-3, with CH-4 review | Actual source manifest | Each real row assessed against fixture, actor/role, precondition, exact action, single expected result, B0/B1 query IDs, evidence, cleanup and dependencies | Source manifest located |
| Classify fully specified / partially specified / blocked | UNAUDITED | CH-3 | Audited row-by-row register | Every actual ID classified exactly once; mutually exclusive counts sum to 63; rationale and evidence per row | Audit completion |
| CH-1 accept T01–T63 manifest | PENDING | CH-1 | Versioned audit output and reconciliation | CH-1 written acceptance of full row-level register; no manifest closure inferred from enumeration | CH-3 audit done |

A spreadsheet/table containing only generated identifiers T01, T02 … T63 would not meet this work item and is not created.

### 3.3 Supplemental 28-row executable-contract work

**Known family-level register (from R2.8/R2.10):** LEG-01–08, CAT-01–10, CUST-01–05, AUD-01–05. The cases are individually enumerated in R2.8 §8 but have no actual query IDs and remain blocked. The underlying authoritative per-case executable-contract source/approved query set is not located in the accessible reviewed artifacts. This register does not repeat family descriptions as if they were approved test specifications.

| Work item | Scope | Current state | Owner | Required evidence / next deliverable | Acceptance criteria |
|---|---|---|---|---|---|
| SUP-00 — Source contract intake | All 28 real case records | BLOCKED / source package not located | CH-1 + CH-3 | Exact manifest source, version and provenance | All 28 existing cases traced without adding/removing scope |
| SUP-LEG — Contract completion | LEG-01–LEG-08 (8) | 8 BLOCKED; 0 query IDs | CH-3; DBA inputs | For each original row: fixture, shop/actor/session/role, precondition, command, one expected result, B0/B1 query IDs, read-only evidence query, cleanup | Each source case becomes deterministic and independently reviewable; actual query IDs created only when real queries exist |
| SUP-CAT — Contract completion | CAT-01–CAT-10 (10) | 10 BLOCKED; 0 query IDs | CH-3; DBA/PO inputs | Same per-case contract; include physical catalog/stock object facts only after DBA map and approved PO choices | Exact source-to-contract traceability and CH-1 acceptance |
| SUP-CUST — Contract completion | CUST-01–CUST-05 (5) | 5 BLOCKED; 0 query IDs | CH-3; DBA/PO inputs | Same per-case contract; identity-key/tenant assumptions tied to accepted PO decisions | Exact source-to-contract traceability and CH-1 acceptance |
| SUP-AUD — Contract completion | AUD-01–AUD-05 (5) | 5 BLOCKED; 0 query IDs | CH-3; DBA/PO inputs | Same per-case contract; distinguish normal application negative tests from owner/superuser governance evidence | Exact source-to-contract traceability and CH-1 acceptance |
| SUP-RECON — Count and completeness audit | All 28 | NOT STARTED | CH-3 | 8+10+5+5 reconciliation, real query registry and evidence links | Total remains exactly 28; each source row has one status; actual query IDs are real, not placeholders |
| SUP-ACCEPT — Independent review | All completed 28 contracts | PENDING | CH-1; CH-4 independent review after CH-1 | Exact manifest revision and supporting artifacts | Written CH-1 acceptance and required CH-4 independent disposition |

**No fabricated 28 test rows:** the table above is a work register by known family, not a substitute for the original 28 case records. Existing identifiers are acknowledged; case actions/outcomes are not reconstructed from names alone.

### 3.4 Minimum per-case contract template — blank template, not a test definition

| Field | Required value at future completion |
|---|---|
| Existing case ID | Must match actual source manifest |
| Source path / revision | Exact provenance |
| Business objective / invariant | Source-derived statement |
| Fixture IDs and starting state | Approved, fixed and reproducible |
| Shop/tenant | Fixed scope |
| Actor / session / role | Exact mapped identity |
| Preconditions / feature gate | One fixed state |
| Exact action | One command or explicitly numbered action sequence |
| Expected result | Exactly one domain result or DBA-mapped SQLSTATE |
| Expected persisted effects | Exact operation/event/ledger/audit/stock/balance assertions |
| B0 query ID | Actual assigned read-only query ID |
| B1 query ID | Actual assigned read-only query ID |
| Evidence artifact | Actual schema, fields and integrity rule |
| Cleanup / rollback | Exact non-business-effect cleanup |
| Owner / reviewer | Assigned accountable roles |
| Dependencies | PO/DBA/security/schema/authorization items |
| Execution authorization | Separate explicit reference; default NOT AUTHORIZED |
| Execution result | NOT EXECUTED until evidence exists |

The template is intentionally blank. It does not assign IDs, actions, expected outcomes or test status.


---

## 4. Deliverable C — Governance / Gate Summary

### 4.1 Current review dispositions

| Gate / review | Current disposition | Evidence / interpretation |
|---|---|---|
| CH-1 R2.10 disposition | **ACCEPT WITH CONDITIONS** | Verified in PR #17 comment `6736302832`, exact reviewed commit `8c0cf59a7dcba7b4d353207c42c99a9800434542` |
| CH-4 R2.10 report supplied to CH-1 | **ACCEPT WITH CONDITIONS** | CH-1 confirms that the independent CH-4 R2.10 report was supplied outside PR #17 GitHub review/comment history. The exact report filename/path was not provided to CH-3 in this task; no filename, URL, review ID or comment reference is inferred. |
| CH-4 verdict linked in PR #17 GitHub history | **NOT LOCATED / NOT VERIFIED** | The supplied report is distinct from the PR #17 GitHub review/comment record. |
| CH-4 R2.10 repository traceability | **PENDING** | The report's exact repository artifact/linkage must be recorded when supplied or published; do not treat missing PR #17 linkage as absence of the report itself. |
| Original CH-4 F25 source | PR #11 R2.5 independent QA report | This is the source for F25-01–F25-08; its verdict on R2.5 was NEEDS REVISION, not an R2.10 verdict |
| Physical DBA feasibility | NOT VERIFIED | No actual schema/role/trigger/constraint mapping or DBA sign-off artifact located |
| Runtime/database verification | NOT EXECUTED | CH-1 R2.10 disposition explicitly confirms no execution |
| Design closure | NOT GRANTED | Documentation acceptance is conditional and not design closure |
| M0-01 implementation | NOT AUTHORIZED | No implementation authorization evidenced |
| Financial pilot | NO-GO | Explicitly retained in CH-1 disposition |
| Merge / deployment | NOT AUTHORIZED by this consolidation | This PR remains draft/unmerged; no deployment activity |

### 4.2 Logical acceptance is not authorization

CH-1's ACCEPT WITH CONDITIONS means the R2.10 written responses to CH1-29-01…05 were accepted at the stated logical-documentation level, subject to residual dependencies. It does not prove:
- PostgreSQL physical schema or trigger feasibility;
- authenticated-subject or SECURITY DEFINER trust-chain correctness;
- actual ACL denial behavior or SQLSTATE;
- DTK1 runtime vector equivalence or multi-key lock behavior;
- FK cycle success on the actual schema;
- partition/RETURNING/read-back equality;
- any test execution or PASS.

No database, build, QA, merge, deployment or pilot approval is created by this register.

### 4.3 Required gate order

1. CH-4 independent review of the exact R2.10 commit and its CH-1 conditions must be located and recorded. The current accessible repository comment trail does not yet contain that verdict.
2. DBA completes the physical evidence register rows, with exact schema/version/function/role/partition references and proof.
3. CH-1 reviews DBA evidence and unresolved deviations; CH-4 independently challenges evidence as assigned.
4. PO resolves PO-01–PO-10 and F25-08 decisions in signed/explicit decision records.
5. CH-3 completes the T01–T63 and supplemental 28-row source-manifest work without changing scope.
6. CH-1/CH-4 accept the exact manifest and design evidence. Any physical incompatibility requires explicit design review rather than silent implementation substitution.
7. PM/PO must separately authorize implementation, QA execution, database operations, merge/deployment and financial pilot as applicable. No downstream step is implied by earlier acceptance.


---

## 5. Risks, blockers and unresolved questions

| ID | Risk / blocker | Impact | Current response / required next step |
|---|---|---|---|
| RSK-01 | CH-4 R2.10 report was supplied to CH-1, but its exact repository linkage is not recorded in PR #17 history | Repository traceability remains incomplete; the report's ACCEPT WITH CONDITIONS verdict is nevertheless recorded as supplied to CH-1 | Record the actual report artifact/filename and repository location when available; do not invent a link or review ID |
| RSK-02 | T01–T63 row source manifest unavailable | No defensible row-by-row audit or partition | CH-1/PO provides exact source artifact path and revision |
| RSK-03 | Supplemental 28 case contract source/query definitions unavailable | Cannot convert enumerated cases into executable manifest without invention | Locate original 28 case definitions and DBA/PO evidence |
| RSK-04 | PostgreSQL schema/version/partition map unverified | Physical constraints/triggers may not support logical contract | DBA completes DBA-04/07/11 |
| RSK-05 | Auth subject / SECURITY DEFINER trust chain unverified | Application role may bypass or forge mutation context if physical design is deficient | DBA/Security completes DBA-02/10 and negative evidence |
| RSK-06 | Phantom protection and partitioned mutation semantics unknown | OLD/NEW key set may be incomplete under concurrency | DBA completes DBA-01/05 with exact predicate/index/partition mapping |
| RSK-07 | N02D denial SQLSTATE and callable surface unknown | Negative-path test cannot be finalized/executed | DBA completes DBA-03/08 |
| RSK-08 | DTK1 vectors and concurrency behavior unverified | Lock ordering and serialization remain design-only | DBA completes DBA-06/09 with independent vectors and authorized traces |
| RSK-09 | PO-01–PO-10 remain pending | Financial/manual payment and migration policy gates remain closed | PO provides explicit signed decisions; F25-08 stays PENDING |


---

## 6. Change control and non-claims

- This artifact is separate from R2.10; it does not create R2.11 or restate CH-4 findings as a design revision.
- R2.10 commit `8c0cf59a7dcba7b4d353207c42c99a9800434542` is the exact baseline and remains unchanged.
- The consolidation is a new one-file documentation artifact on a separate branch.
- The source T01–T63 row-by-row register and fully specified 28-case executable contracts were not located in the accessible sources; no synthetic records were created.
- CH-4's R2.10 report was supplied to CH-1 with an ACCEPT WITH CONDITIONS verdict. Its linkage in PR #17 GitHub history remains NOT LOCATED / NOT VERIFIED, and repository traceability remains PENDING. The exact report filename/path was not supplied to CH-3 in this task.
- F25-05/F25-06 remain PARTIALLY ADDRESSED; F25-07/F25-08 remain PENDING.
- No code, SQL, database operation, build, runtime test, QA execution, deployment, merge or pilot was performed.
- No test PASS, physical DBA feasibility, design closure or implementation readiness is claimed.

**Prepared by:** CH-3 Engineering / Implementation  
**Submission purpose:** CH-1 consolidation review  
**Current status:** DRAFT / OPEN FOR REVIEW
