# DT-002 Phase 1 — Authoritative Source Recovery Report

**Project:** DokanTools — M0-01  
**Role:** CH-3 Engineering / Implementation  
**Report date:** 2026-11-10  
**Search baseline:** PR #18 consolidation head `dd12317552c8198ae40d6a2aa8586cacd574e508`  
**R2.10 design baseline:** `8c0cf59a7dcba7b4d353207c42c99a9800434542`  
**Scope:** Read-only repository investigation and documentation-only reporting  
**Disposition:** Source recovery completed to the extent supported by accessible repository evidence. No test records, query IDs, DBA evidence or PO decisions were reconstructed.

---

## 1. Executive findings

1. **T01–T63:** Individual records exist in historical R2.5 and R2.6 design candidates. R2.5 contains 63 rows with richer test fields; R2.6 contains 63 condensed result/B0→B1 rows. Neither is an accepted authoritative manifest. R2.5 received CH-4 **NEEDS REVISION — HIGH**; R2.6 received CH-1 **NOT ACCEPTED — HIGH**. R2.7 explicitly says most rows retain inherited R2.6 intent and remain blocked until a complete versioned manifest pins actor, fixture, exact action, query IDs and B0/B1. R2.9 explicitly states that the complete authoritative row-by-row manifest is not present. R2.10 preserves that boundary.  
   **Current authoritative T01–T63 source: NOT LOCATED.**

2. **Supplemental 28 cases:** Historical individual descriptions exist in R2.5; R2.8/R2.9/R2.10 enumerate all 28 with status and missing evidence-query placeholders. The later revisions explicitly state that placeholders are not actual query IDs and that the cases remain blocked. The historical descriptions do not provide complete executable contracts, actual B0/B1 query IDs, executable evidence-query definitions or per-case cleanup.  
   **Current authoritative 28-case executable-contract source: NOT LOCATED.**

3. **DBA-01 through DBA-11:** The requirement register exists in the PR #18 consolidation document. R2.10 provides logical design requirements and acceptance criteria, not physical PostgreSQL evidence. No DBA evidence artifact is registered as received in the consolidation. The existing main-branch Supabase schema/migration files are source-code baselines, not a signed mapping to the R2.10 logical design and not proof of the deployed database state.  
   **Physical PostgreSQL evidence for DBA-01–DBA-11: NOT LOCATED. All eleven require DBA input; some also require separate execution authorization and/or CH-4 review.**

4. **PO dependencies:** PO-01–PO-10 remain pending in the reviewed design trail. AUD-03 specifically remains blocked on the PO correction-policy decision. Source recovery does not resolve or approve any PO item.

No implementation, SQL execution, database operation, build, test, QA execution, merge or deployment was performed.

---

## 2. Search scope and inspected repository refs

Repository: `Hasnat26/DokanTools` (private)  
Default branch: `main`  
Main head observed: `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4`

All **21 currently exposed branch refs** were enumerated. Relevant M0-01 design branches and review/handoff refs were inspected at their recorded heads:

| Branch | Head commit |
|---|---|
| `main` | `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4` |
| `docs/m0-01-remediation-design-r1` | `1e9da68285c237ab46c787e3a239b0375796f9d0` |
| `docs/m0-01-remediation-design-r2` | `2e97683d66700726826d89c18d0fc6f01d533f80` |
| `docs/m0-01-remediation-design-r2-1` | `352703589a2f2bfdd8db70d43693e0e9ac21f64d` |
| `docs/m0-01-remediation-design-r2-2` | `abd9a784627fc366edc3b1cf2f651b9e3c8a2543` |
| `docs/m0-01-remediation-design-r2-3` | `18fbb6aca6919e39bacca9f889b8a02573d9fd97` |
| `docs/m0-01-remediation-design-r2-4` | `f3772c95ce40b9d5a7526ae6764f8f0896b69b05` |
| `docs/m0-01-remediation-design-r2-5` | `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512` |
| `docs/m0-01-remediation-design-r2-6` | `5df078b0246e9f66afb984ab3ec2665bb9f0a4ab` |
| `docs/m0-01-remediation-design-r2-7` | `e88bfad2472b75f5a7d74116db92af1b64030087` |
| `docs/m0-01-remediation-design-r2-8` | `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb` |
| `docs/m0-01-remediation-design-r2-9` | `77515894e26e1454be22b77b4e79bd03aec6426f` |
| `docs/m0-01-remediation-design-r2-10` | `8c0cf59a7dcba7b4d353207c42c99a9800434542` |
| `docs/session-continuity-handoff` | `ae0f6a868087696d091e4f116e2535921bb60697` |
| `qa/ch4-m0-01-r2-2-independent-report` | `75b3b1ec5d61a14f6222b01d60b869f08678e819` |
| `qa/ch4-m0-01-r2-2-report-base` | `efa7d5da139030c092089831f813df697eaed71e` |
| `qa/ch4-m0-01-r2-3-independent-report` | `70ebb3fe58f391dfd0f804908f034a621ce91687` |
| `qa/ch4-m0-01-r2-3-report-base` | `efa7d5da139030c092089831f813df697eaed71e` |
| `qa/ch4-m0-01-r2-4-independent-report` | `62964fa97d78e70460b66b460678b0352eb84517` |
| `qa/ch4-m0-01-r2-5-independent-final` | `207a196458d2e81ca3d50e3dde9f5ae648706449` |
| `docs/dt-002-post-r2-10-consolidation` | `dd12317552c8198ae40d6a2aa8586cacd574e508` |

### PR and review artifacts inspected

- PR #5 — CH-4 R2.2 independent QA report; NEEDS REVISION — HIGH.
- PR #7 — CH-4 R2.3 independent QA report; NEEDS REVISION — HIGH.
- PR #8 — R2.4 design candidate.
- PR #9 — CH-4 R2.4 independent QA report; NEEDS REVISION — HIGH.
- PR #10 — R2.5 design candidate.
- PR #11 — CH-4 R2.5 independent QA report; NEEDS REVISION — HIGH.
- PR #12 — R2.6 design candidate; CH-1 review comment records NOT ACCEPTED — HIGH.
- PR #13 — session handoff, planning and CH-1 R2.6/F25 traceability artifacts.
- PR #14 — R2.7 design candidate; CH-1 targeted revision required.
- PR #15 — R2.8 design candidate; CH-1 targeted revision required.
- PR #16 — R2.9 design candidate; CH-1 targeted R2.10 clarification required.
- PR #17 — R2.10 candidate; CH-1 ACCEPT WITH CONDITIONS, design closure not granted.
- PR #18 — post-R2.10 consolidation, current head `dd12317552c8198ae40d6a2aa8586cacd574e508`.

The repository code-search endpoint returned no indexed hits for the targeted test/DBA search strings on the default branch. Direct Git tree, exact-ref file retrieval, branch enumeration, PR metadata and PR discussion retrieval were used instead. This is not treated as proof that no source exists outside the accessible repository.

---

## 3. Workstream A — T01–T63 source recovery

### 3.1 Historical source candidates

| Revision / date (UTC) | Exact path | Commit SHA | Blob SHA | Individual T rows | Assessment |
|---|---|---|---|---:|---|
| R1 / 2026-11-03 | `docs/M0-01_Remediation_Design_R1.md` | `1e9da68285c237ab46c787e3a239b0375796f9d0` | `66416a6bd3d01eb47654deee777af20c5b65b3bd` | 0 | Historical design proposal; no T01–T63 manifest |
| R2 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.md` | `2e97683d66700726826d89c18d0fc6f01d533f80` | `0bafa6b6e517e97d15466a90404745a2c95c01c5` | 27 (T01–T27) | Historical partial test inventory, not the 63-row manifest |
| R2.1 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.1_Clarification.md` | `352703589a2f2bfdd8db70d43693e0e9ac21f64d` | `5bceda4dc7b31f7a8147d38148071114b792119b` | 12 (T16–T27) | Historical clarification; not a complete manifest |
| R2.2 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.2.md` | `abd9a784627fc366edc3b1cf2f651b9e3c8a2543` | `98fd5c0fb61f14495097e7ec1262c848042eec49` | 24 (T40–T63) | Historical partial matrix; CH-4 PR #5 NEEDS REVISION — HIGH |
| R2.3 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.3.md` | `18fbb6aca6919e39bacca9f889b8a02573d9fd97` | `e4b32e0fa382cc9dabfefec1378216a946557668` | 24 (T40–T63) | Historical partial matrix; CH-4 PR #7 NEEDS REVISION — HIGH |
| R2.4 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.4.md` | `f3772c95ce40b9d5a7526ae6764f8f0896b69b05` | `7494b82e8592efe8dfdd41101c6d615d58d95b1e` | 24 (T40–T63) | Historical partial matrix; CH-4 PR #9 NEEDS REVISION — HIGH |
| R2.5 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.5.md` | `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512` | `1ca33fb640b258a7c6d342ba4604c51c68fed55f` | **63** | Historical row-level candidate; CH-4 PR #11 NEEDS REVISION — HIGH |
| R2.6 / 2026-11-03 | `docs/M0-01_Remediation_Design_R2.6.md` | `5df078b0246e9f66afb984ab3ec2665bb9f0a4ab` | `4afe4c07ad509913da985c4c315bfe1fc675b7ea` | **63** | Historical condensed matrix; CH-1 PR #12 NOT ACCEPTED — HIGH |
| R2.7 / 2026-11-09 | `docs/M0-01_Remediation_Design_R2.7.md` | `e88bfad2472b75f5a7d74116db92af1b64030087` | `5aea8659a40e562b9afa271d9cbb6b1c9b93e434` | 6 expanded rows (T31, T32, T34A, T34B, T41, T48) | Partial correction only; remainder explicitly inherited and not individually rewritten |
| R2.8 / 2026-11-09 | `docs/M0-01_Remediation_Design_R2.8.md` | `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb` | `7cd5731143cfee19da7002eff88d771d0e6aaade` | 0 | No full T-row source; 28 supplemental cases explicitly blocked |
| R2.9 / 2026-11-09 | `docs/M0-01_Remediation_Design_R2.9.md` | `77515894e26e1454be22b77b4e79bd03aec6426f` | `7587014a28773680052fa985f77630a3b64da7bd` | 0 | Explicitly states complete authoritative row-by-row manifest is not present |
| R2.10 / 2026-11-09 | `docs/M0-01_Remediation_Design_R2.10.md` | `8c0cf59a7dcba7b4d353207c42c99a9800434542` | `1d3aa3ad480d4c5071a19c9f6d1ff1abfdfc9d17` | 0 | Preserves manifest boundary; does not add T01–T63 records |

Dates above are commit author dates from GitHub metadata; exact source commit and blob identities are shown so the artifacts can be retrieved without relying on branch names.

### 3.2 R2.5 row-level candidate — field coverage

R2.5 §11.2 contains 63 individual rows. Its table columns are:

- ID;
- objective / preconditions and exact seed;
- actor/session, operation and payload/action;
- expected result/error;
- committed-state/evidence assertion.

R2.5 §11.1 also defines a global evidence capture contract, including database/migration identity, actor/session context, request IDs, payload/hash, action, timestamps, SQLSTATE/domain result, before/after IDs and counts, balances, stock, audit evidence and rollback/absence-of-partial-write evidence.

**Not present as a complete per-row manifest contract:** actual B0 query IDs, actual B1 query IDs, executable read-only query definitions, per-row cleanup/teardown instructions and a mutually exclusive row-level fully-specified/partial/blocked audit. Some RPC names, domain codes, PO-dependent outcomes and database role names remained dependencies. The document labels all tests PROPOSED / NOT EXECUTED.

**Review disposition:** CH-4 PR #11 reviewed exact R2.5 commit `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512` and returned NEEDS REVISION — HIGH. F25-05 specifically found T01–T63 retained conditional or fixture-inconsistent outcomes and incomplete response-loss/failure assertions. The R2.5 file is therefore a valuable historical row-level source, not an accepted authoritative manifest.

### 3.3 R2.6 and later disposition

R2.6 §7.2 retains 63 individual IDs but compresses the row content to a deterministic-result and B0→B1 assertion matrix. It does not carry the complete per-row actor, exact command, query ID and cleanup fields. CH-1's PR #12 review (comment `6602212097`) states that T31, T32, T34 and T41 still have multiple/conditional outcomes and that T48 lacks a sufficiently defined inventory evidence artifact.

R2.7 §7 expands six selected cases and explicitly states that T01–T30, T33, T35–T40 and T42–T63 retain inherited R2.6 IDs/intent. It says any inherited row without a pinned actor/action/query is BLOCKED pending a versioned manifest amendment. It also requires actual query IDs and B0/B1 evidence before execution.

R2.8/R2.9/R2.10 do not restore the 63-row manifest. R2.9 §16 and its boundary statement record 63 NOT CLOSED, zero confirmed fully specified, the full/partial/blocked partition unaudited and zero actual query IDs confirmed. R2.10 §16/§23 retain the same boundary and owner/next-deliverable requirement.

### 3.4 Workstream A disposition

**NOT LOCATED** **Authoritative current T01–T63 source manifest**

**HISTORICAL / NON-AUTHORITATIVE** R2.5 §11.2 and R2.6 §7.2 are the best located historical row-level candidates.

**Next owner/action:** CH-1 must identify the authoritative source artifact and exact revision (or confirm that no separate source exists and direct PO to provide the controlled source). CH-3 must then audit the actual 63 rows against the R2.9/R2.10 closure fields without reconstructing missing content. CH-4 should independently review the audited manifest after CH-1 review. DBA must supply physical facts/query definitions where row outcomes depend on actual PostgreSQL behavior.

---

## 4. Workstream B — Supplemental 28-case source recovery

### 4.1 Source artifacts

| Family | IDs / count | Historical description source | Later register source | Current assessment |
|---|---:|---|---|---|
| LEG | LEG-01–LEG-08 / 8 | R2.5 §12, `docs/M0-01_Remediation_Design_R2.5.md`, commit `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512` | R2.8 §8.2, R2.9 §8.2, R2.10 §8.2 | Descriptions and blocked status available; executable contract NOT LOCATED |
| CAT | CAT-01–CAT-10 / 10 | R2.5 §9.2, same R2.5 path/commit | R2.8 §8.3, R2.9 §8.3, R2.10 §8.3 | Descriptions and blocked status available; executable contract NOT LOCATED |
| CUST | CUST-01–CUST-05 / 5 | R2.5 §9.3, same R2.5 path/commit | R2.8 §8.4, R2.9 §8.4, R2.10 §8.4 | Descriptions and blocked status available; executable contract NOT LOCATED |
| AUD | AUD-01–AUD-05 / 5 | R2.5 §12, same R2.5 path/commit | R2.8 §8.5, R2.9 §8.5, R2.10 §8.5 | Descriptions and blocked status available; executable contract NOT LOCATED |

R2.5 §12 contains LEG-01–08 and AUD-01–05 rows; CAT-01–10 and CUST-01–05 are in R2.5 §§9.2–9.3. These historical rows include actor/action, expected result and committed-state/evidence descriptions. They do not define a complete frozen fixture, exact executable command, actual B0/B1 query IDs, executable read-only query text, artifact schema/hash for every case and cleanup/rollback procedure.

### 4.2 Later authoritative status register

R2.8 `docs/M0-01_Remediation_Design_R2.8.md`, commit `87814dcb150c54d968b7bfb81d8a1ac2ac6fb5eb`, §8.2–§8.6, enumerates all 28 cases and assigns family placeholders such as `LEG.Q01`, `CAT.Q01`, `CUST.Q01` and `AUD.Q01`. The document explicitly states that these are **NOT ASSIGNED** query definitions and that a placeholder is not an actual query ID. R2.9 and R2.10 carry the same blocked register forward.

| Family | Historical case descriptions | Current case enumeration | Actual query IDs | Evidence query definitions | Cleanup requirements |
|---|---|---|---:|---|---|
| LEG (8) | Available in R2.5 §12 | Available in R2.8/R2.9/R2.10 §8.2 | 0 | NOT LOCATED; LEG.Q01–Q08 are placeholders only | NOT LOCATED per case |
| CAT (10) | Available in R2.5 §9.2 | Available in R2.8/R2.9/R2.10 §8.3 | 0 | NOT LOCATED; CAT.Q01–Q10 are placeholders only | NOT LOCATED per case |
| CUST (5) | Available in R2.5 §9.3 | Available in R2.8/R2.9/R2.10 §8.4 | 0 | NOT LOCATED; CUST.Q01–Q05 are placeholders only | NOT LOCATED per case |
| AUD (5) | Available in R2.5 §12 | Available in R2.8/R2.9/R2.10 §8.5 | 0 | NOT LOCATED; AUD.Q01–Q05 are placeholders only | NOT LOCATED per case |

Special conditions preserved by R2.8–R2.10:
- AUD-03: `BLOCKED_PO_AND_MANIFEST`; PO correction-policy decision absent and AUD.Q03 not assigned.
- AUD-05: `BLOCKED_GOVERNANCE_ONLY`; external ticket, dual approval and independent review evidence not assigned.
- The family totals remain 8 + 10 + 5 + 5 = 28; 28 blocked; 0 actual query IDs; 0 closed/PASS.

### 4.3 Workstream B disposition

**PARTIALLY AVAILABLE** Historical descriptions and current blocked enumeration are located.

<badge label="NOT LOCATED" color="warning"/> Authoritative executable-contract package, actual query definitions/IDs and per-case cleanup requirements.

**Next owners/actions:**
- **CH-1:** identify/provide the controlled source package and confirm whether R2.5 descriptions remain the intended source of scope.
- **CH-3:** map each original case to the source package; do not expand or alter case intent until provenance is confirmed.
- **DBA:** provide actual schema-grounded read-only evidence queries and confirm SQLSTATE/ACL-dependent outcomes.
- **PO:** resolve PO-01–PO-10 and the AUD-03 correction-policy dependency before PO-gated cases are finalized.
- **CH-4:** independently review the completed 28-case contracts after CH-1 review. No execution is implied.

---

## 5. Workstream C — DBA-01 through DBA-11 evidence-source inventory

### 5.1 Register provenance

The DBA-01…DBA-11 IDs and the detailed requirement/evidence table are in:

- **Path:** `docs/reviews/DT-002_POST_R2.10_CONSOLIDATION_2026-11-09.md`
- **Branch:** `docs/dt-002-post-r2-10-consolidation`
- **Commit:** `dd12317552c8198ae40d6a2aa8586cacd574e508`
- **Blob:** `0f684f6915096f705c7df36533cec0203e1b66c8`
- **Section:** §2, “Deliverable A — DBA Evidence Register”.

These DBA IDs are register requirement IDs introduced by the consolidation; they are not evidence IDs and do not themselves prove that evidence has been supplied. The register states: no evidence artifact is registered as received. The corresponding R2.10 sections are logical design contracts and evidence requirements, not physical PostgreSQL verification.

### 5.2 Item-by-item inventory

| ID | Existing source / exact location | Evidence currently available in repository | Missing evidence / next action | Explicit owner in register | Real DBA required? |
|---|---|---|---|---|---|
| **DBA-01** | R2.10 §19; consolidation §2 row DBA-01 | Logical source-key discovery, concurrency, version/count and abort requirements | Actual predicate-to-index/guard map; isolation/row-lock strategy; concurrent INSERT/UPDATE/DELETE/phantom proof against actual schema | DBA; CH-3 supplies mutation inventory | **YES** |
| **DBA-02** | R2.10 §§13.3, 19.5–19.6; consolidation §2 row DBA-02 | Logical authenticated invocation and transaction-context binding contract | Actual function owner, SECURITY DEFINER, fixed search_path, EXECUTE grants, trusted auth source, backend/transaction/nonce/request binding, context-table privilege and forgery-denial proof | DBA / Security; CH-3 documents contract | **YES** |
| **DBA-03** | R2.10 §20; consolidation §2 row DBA-03 | N02D is defined as a forbidden-path negative test; approved RPC path must not be assigned a 40P01 expectation | Complete callable function/overload inventory; table/sequence/function ACL map; alternate writer paths; exact denial SQLSTATE from actual mapping | DBA / Security; CH-3 test-contract owner | **YES** |
| **DBA-04** | R2.10 §§14, 21; consolidation §2 row DBA-04 | Logical FK/UNIQUE/CHECK/deferred-cycle requirements | Actual PostgreSQL version; physical column/type/nullability map; unique-target eligibility; FK MATCH/actions/deferrability; deferred constraint-trigger map; commit/rollback proof | DBA | **YES** |
| **DBA-05** | R2.10 §§13.2, 22; consolidation §2 row DBA-05 | Logical INSERT/UPDATE/DELETE OLD/NEW full-key reconciliation and fail-closed rule | Actual trigger inventory; transition-relation support; RETURNING/read-back capability; partition routing/firing map; per-identity equality proof | DBA; CH-3 maps mutation classes | **YES** |
| **DBA-06** | R2.8 §5; R2.10 §§13.2, 19.2; consolidation §2 row DBA-06 | Normative DTK1 encoding/hash/signed-bigint/namespace specification and sorted-key design | Independently calculated full vectors; implementation equivalence; common writer/trigger key derivation; collision and multi-key concurrency traces | DBA; CH-3 maintains vector specification | **YES**, with independent implementation/vector review |
| **DBA-07** | R2.10 §§13.4, 14, 19, 21, 22; consolidation §2 row DBA-07 | Explicit list of required version/schema/partition inventory fields | Signed actual PostgreSQL product/version; schema revision; relation/partition/column/type/nullability/index/constraint/trigger/function/role/grant map; evidence timestamp/hash | DBA | **YES** |
| **DBA-08** | R2.10 §20; consolidation §2 row DBA-08 | Negative-test acceptance intent and B0/B1 business-state comparison requirement | Authorized isolated fixture/role; actual forbidden calls; observed SQLSTATE; backend/transaction/lock evidence; read-only B0/B1 query outputs and review | DBA / Security; CH-4 evidence reviewer | **YES**, plus separate test authorization |
| **DBA-09** | R2.10 §§6, 13, 15, 19, 21; consolidation §2 row DBA-09 | Proposed lock schedules, timeout/deadlock distinctions, retry and rollback requirements | Actual isolation settings; physical lock inventory/wait graphs; lock-order traces; exact deadlock/timeout outcomes; fresh-transaction retry and whole-transaction rollback evidence | DBA; CH-3 maintains schedule map; CH-4 reviews | **YES**, plus separate runtime authorization |
| **DBA-10** | R2.10 §§13.1, 13.3, 13.4, 19.5; consolidation §2 row DBA-10 | Logical approved-RPC-only writer boundary | Complete app/service/owner role inventory; direct table/sequence grants; function EXECUTE grants; SECURITY DEFINER inventory; writer routine inventory and privilege-negative evidence | DBA / Security | **YES** |
| **DBA-11** | R2.10 §§14, 21; consolidation §2 row DBA-11 | Logical non-posted NULL pointer and posted reciprocal-link final-state contract | Actual FK-O-L/FK-L-O-L mapping; exact unique target; NULL/non-NULL checks; deferred trigger inventory; commit-time success and forced-rollback evidence | DBA | **YES** |

### 5.3 Existing SQL source files — limited relevance

The current `main` tree contains these SQL source artifacts:

| Path | Main-branch head | Blob SHA | Assessment |
|---|---|---|---|
| `supabase/schema.sql` | `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4` | `e859b6de9660533962eddb6f9f3d17ad8a4c1cca` | Existing project schema snapshot; not a signed R2.10 physical mapping |
| `supabase/migrations/20261019_reliability_foundation.sql` | same | `6b6b51318a5b4d1f38880ec2007049409102931c` | Existing migration source; not evidence of deployed catalog state |
| `supabase/migrations/20261102_p0_idempotency.sql` | same | `03c9cb2940799731d614e97a9b48da2d9418f707` | Existing P0 idempotency migration source; not R2.10 DBA acceptance evidence |
| `supabase/migrations/20261019_inventory_catalog.sql` | same | `1f72ad2c8d643ec2d536225d8c8c09992d53cdc3` | Existing catalog migration source; not R2.10 DBA acceptance evidence |

A read-only source scan found no `approval_operation` identifier in these four files. They may help a DBA establish the pre-existing project baseline, but no evidence was found tying them to the actual target database version/schema used for R2.10. They do not establish DBA-01…DBA-11 completion, and they are not substituted for actual catalog inspection or signed DBA mapping.

### 5.4 DBA workstream disposition

**REQUIRES DBA** DBA-01 through DBA-11 all require actual DBA-supplied physical evidence. No item is physically verified by the reviewed documentation.

**Next action:** assign an accountable DBA (individual or formally named team), establish the target database identity/schema revision and evidence authorization boundary, then produce one traceable evidence artifact per DBA requirement. CH-3 maintains the register; CH-1 reviews completeness and deviations; CH-4 independently assesses evidence where assigned. Do not update any DBA status to VERIFIED from design text or source SQL alone.

---

## 6. Consolidated source inventory and status

| Source / requirement | Status | Basis |
|---|---|---|
| R2.5 T01–T63 individual rows | **HISTORICAL / NON-AUTHORITATIVE** | 63 rows found; CH-4 NEEDS REVISION — HIGH |
| R2.6 T01–T63 result/B0-B1 matrix | **HISTORICAL / NON-AUTHORITATIVE** | 63 rows found; CH-1 NOT ACCEPTED — HIGH |
| Current authoritative T01–T63 manifest | **NOT LOCATED** | R2.9 explicitly says complete authoritative row-by-row manifest is not present; R2.10 preserves gap |
| R2.5 LEG/CAT/CUST/AUD descriptions | **HISTORICAL / NON-AUTHORITATIVE** | 28 descriptions distributed across §§9.2, 9.3 and 12; contract fields incomplete |
| R2.8–R2.10 28-case register | **PARTIALLY AVAILABLE** | 28 IDs/actions/statuses enumerated; query placeholders are not actual IDs |
| Authoritative executable 28-case contract package | **NOT LOCATED** | No actual query IDs/definitions or per-case cleanup found |
| DBA-01–DBA-11 requirement register | **VERIFIED SOURCE** | Consolidation §2 exists at exact PR #18 head; it is a requirements register, not physical evidence |
| Physical evidence for DBA-01–DBA-11 | **REQUIRES DBA** | No received evidence artifact registered |
| PO-01–PO-10 decisions | **REQUIRES PO** | R2.5–R2.10 preserve pending status; no signed decision source located in reviewed artifacts |
| AUD-03 correction-policy decision | **REQUIRES PO** | R2.8–R2.10 label case blocked on PO decision |
| CH-1/CH-4 acceptance of a completed T01–T63 or 28-case manifest | **NOT LOCATED** | No accepted complete manifest revision found |

“VERIFIED SOURCE” means that the identified repository artifact and its contents/provenance were verified. It does **not** mean the requirement itself has been physically verified or accepted.

---

## 7. Missing source list and next-owner action

| Missing source / evidence | Next owner | Required next action |
|---|---|---|
| Controlled authoritative T01–T63 source and revision | CH-1; PO if source is outside repository | Provide exact path/URL or controlled source artifact, revision/date and provenance; otherwise explicitly confirm no separate authoritative source exists |
| T01–T63 completed row audit and classifications | CH-3, after source intake | Audit all actual rows once; include fixed fixture, actor/role, precondition, exact action, one outcome, actual B0/B1 query IDs, evidence artifact, cleanup and dependencies; reconcile exactly 63 |
| Independent T01–T63 manifest review | CH-4 after CH-1 review | Independently challenge the exact versioned manifest; do not execute tests absent separate authorization |
| Controlled source package for 28 cases | CH-1 / PO | Confirm source authority and intended scope for LEG/CAT/CUST/AUD |
| 28 executable contracts and actual read-only query definitions | CH-3 with DBA inputs | Complete each original case only from source evidence; actual query IDs assigned only when query definitions exist |
| PO-dependent 28-case outcomes, including AUD-03 | PO | Provide explicit written decisions; keep dependent cases disabled/blocked until decision |
| DBA-01 predicate/concurrency evidence | DBA; CH-3 supplies mutation inventory | Actual predicate/index/guard mapping and authorized concurrency/phantom evidence |
| DBA-02 auth context and SECURITY DEFINER trust evidence | DBA / Security | Actual owner/search_path/grant/context binding and anti-forgery evidence |
| DBA-03 / DBA-08 callable surface, ACL and negative evidence | DBA / Security | Complete routine/ACL/writer inventory; map exact denial result; execute only when separately authorized |
| DBA-04 / DBA-11 physical FK and deferred-cycle evidence | DBA | Actual PG version/schema/constraint map and commit/rollback proof |
| DBA-05 trigger/partition/OLD-NEW reconciliation | DBA; CH-3 maps mutations | Actual trigger/transition/RETURNING/read-back/partition mapping |
| DBA-06 DTK1 vectors and ordering | DBA with CH-3 specification | Independent vector calculation, implementation cross-check and authorized multi-key traces |
| DBA-07 actual database/schema/partition inventory | DBA | Signed database identity/version and catalog/schema revision evidence |
| DBA-09 isolation/lock/retry/rollback traces | DBA; CH-3 schedule map; CH-4 review | Actual lock inventory, wait graph, retry and atomic rollback evidence |
| DBA-10 direct DML and writer inventory | DBA / Security | Actual roles/grants/functions and complete protected-writer inventory |
| CH-1/CH-4 acceptance and any gate changes | CH-1 / CH-4 / PM-PO as applicable | Record exact reviewed commit and explicit disposition; no downstream authorization implied |

---

## 8. Explicit limitations and non-claims

- The search covered the 21 branch refs exposed by GitHub at the time of retrieval and the relevant M0-01 design, QA and handoff PRs listed above. Deleted refs, external storage, unlinked local files and chat-only attachments are outside repository visibility.
- The session handoff and Agile planning files are coordination artifacts, not source manifests or test evidence. The handoff explicitly describes itself as a coordination snapshot.
- The CH-4 R2.5 QA report is a review artifact, not the T01–T63 source manifest. Its exact path is `docs/DokanTools_M0-01_Remediation_Design_R2.5_Independent_QA_Report.md`, commit `207a196458d2e81ca3d50e3dde9f5ae648706449`, blob `051794a179db204772f5f180df535a5f968da7f1`.
- The CH-1 R2.6 traceability report is `docs/reviews/CH1_DT-002_R2.6_F25_TRACEABILITY_2026-11-09.md`, commit `ae0f6a868087696d091e4f116e2535921bb60697`, blob `7efc5eb71d0912a1ae46c0631d27f718ed8d29b6`. It records R2.6 NOT ACCEPTED — HIGH and F25-05 NOT CLOSED.
- The session handoff is `docs/governance/SESSION_CONTINUITY_HANDOFF_2026-11-09.md`, same commit `ae0f6a868087696d091e4f116e2535921bb60697`, blob `2f7913794f87e1597d49dbf960c2e4ec3c812eaa`. The sprint plan is `docs/planning/AGILE_BACKLOG_SPRINT_PLAN_v0.1.md`, same commit, blob `ca8c96f89eef50e94bc37d471f10efbc07433bfa`. Neither supplies missing manifest rows or DBA evidence.
- No PostgreSQL database was connected to or inspected. No SQL was executed. No schema, role, grant, trigger, function, partition, lock, isolation or runtime behavior is physically verified by this report.
- No tests, builds, QA execution, database operations, merge or deployment were performed.
- No synthetic T01–T63 rows, supplemental contracts, B0/B1 query IDs, SQLSTATE mappings, evidence-query IDs or cleanup steps were created.
- Design acceptance is not implementation authorization. Design closure remains NOT GRANTED; M0-01 implementation remains NOT AUTHORIZED; financial pilot remains NO-GO; runtime/database verification remains NOT EXECUTED.

---

## 9. Final CH-3 disposition

**T01–T63:** Historical individual rows located; current authoritative manifest **NOT LOCATED**.  
**Supplemental 28:** Historical descriptions and later blocked enumeration located; authoritative executable contracts **NOT LOCATED**.  
**DBA-01–DBA-11:** Requirement register verified; physical evidence **REQUIRES DBA**.  
**PO-01–PO-10:** **REQUIRES PO**; pending status preserved.

**Recommended immediate handoff:** CH-1 to identify/provide the authoritative T01–T63 and supplemental 28-case source package, and assign the DBA owner for physical evidence intake. CH-3 should not reconstruct missing source records. Wait for CH-1 review before proceeding.

**Prepared by:** CH-3 Engineering / Implementation  
**Report status:** DRAFT — submitted for CH-1 review  
**Change scope:** This report only; no change to R2.10, PR #17 or PR #18.
