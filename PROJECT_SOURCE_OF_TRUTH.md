# DokanTools — Project Source of Truth (SSOT)

**Repository:** `Hasnat26/DokanTools` (private)  
**Default branch:** `main`  
**Document:** `PROJECT_SOURCE_OF_TRUTH.md`  
**Status:** ACTIVE ON MAIN  
**Audit snapshot (historical):** 2026-11-10; time of original audit not captured in the audit record; timezone therefore unavailable  
**Audit main/base commit:** `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4`  
**Governance branch at initial audit:** `governance/global-github-ssot`  
**Initial governance branch head:** `46376e96c8b325143440eb7114b026487210ddbb`  
**Revision task:** `DT-GOV-001-R1`  
**DT-GOV-002:** APPROVED AND MERGED  
**DT-GOV-002 reviewed PR head:** `a3c5f4057ccb2aec456167101bfc91ef3a5d185b`  
**DT-GOV-002 merge commit / main HEAD after merge:** `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`  
**Governance document identities after DT-GOV-002:** `WORKER_SINGLE_SOURCE_OF_TRUTH.md` — blob `5714e127aad7a81d3e26da2ac2d77fe875927fdc`; `PROJECT_SOURCE_OF_TRUTH.md` — blob `0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5`  
**PR #21:** APPROVED AND MERGED  
**PR #21 reviewed head:** `10bf1fb4c7687d2223e17c7303902df281deb4c5`  
**PR #21 merge commit / main HEAD at activation:** `3abd0455a7755208049da310f85aab930e9f4200`  
**Governance document identities at activation:** `WORKER_SINGLE_SOURCE_OF_TRUTH.md` (path `/WORKER_SINGLE_SOURCE_OF_TRUTH.md`) — blob `ee6588a85af954128c0b1d0ce2ddd7417ce0b6e9`; `PROJECT_SOURCE_OF_TRUTH.md` (path `/PROJECT_SOURCE_OF_TRUTH.md`) — blob `d94b368a42ebe87e6787c7fd62c1256294e611e4`

> This register is a controlled authority index, not a declaration that all workstreams are approved or implementation-ready. Exact status is stated per artifact. Where the repository lacks the exact approved source document or decision record, status is NOT ESTABLISHED AS GITHUB BASELINE. A PR branch is not equivalent to a merged/approved main-branch baseline. The repository audit below is a historical snapshot, not a claim of current live inventory.

## 1. Single authoritative entry point

All workers MUST read the repository-root `WORKER_SINGLE_SOURCE_OF_TRUTH.md` first, then this file, from the same exact Git commit before beginning any work.

- Worker instruction: `WORKER_SINGLE_SOURCE_OF_TRUTH.md`
- Project authority register: `PROJECT_SOURCE_OF_TRUTH.md`
- The project-wide governance baseline is ACTIVE ON MAIN following PM approval and merge of PR #21.
- PR #21 reviewed head: `10bf1fb4c7687d2223e17c7303902df281deb4c5`; merge commit / main HEAD at activation: `3abd0455a7755208049da310f85aab930e9f4200`.
- Exact governance file paths and activation blob identities are recorded in the document metadata above. All existing workstream-specific restrictions and authorization gates remain in force.

Every task must pin its exact source commit and source document/blob SHA. Workers must not rely on a moving branch name alone.

## 1.1 Existing workstream-local instruction file

PR #20 contains `docs/slice-a/browser-harness/v3/WORKER_SINGLE_SOURCE_OF_TRUTH.md` on its separate, unmerged submission branch. It was created before this project-wide governance proposal and is scoped to the v3 artifact package. This creates a potential competing entry-point instruction if interpreted globally. PR #20 is intentionally left unchanged. The repository-root `WORKER_SINGLE_SOURCE_OF_TRUTH.md` and `PROJECT_SOURCE_OF_TRUTH.md` are the active global authority on `main`; the nested v3 file is subordinate and may only identify v3 package artifacts. It cannot override project-wide precedence, roles, authorization gates or branch/PR rules.

## 2. Repository audit — historical verified snapshot

### 2.1 Snapshot identity, timing and limitations

This inventory records the state observed during the DT-GOV-001 audit on 2026-11-10. The original audit notes retained the date but did not capture a precise time of day or timezone. No time or timezone is inferred here. The exact main base commit used was `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4`; the governance branch head at the recorded initial review point was `46376e96c8b325143440eb7114b026487210ddbb`. Those SHA values identify immutable snapshots even though the precise observation timestamp is unavailable.

The PR inventory scope was the repository's then-visible pull-request list, with open PRs #1–#20 observed as open drafts before PR #21 was created. PRs #17–#20 were individually inspected for status and relevant file scope; the broader #1–#16 entries were counted/classified as historical open draft candidates, not fully re-reviewed for every file or underlying decision. The branch inventory reported 21 branch records. Accordingly, the inventory is a bounded audit snapshot, not a guarantee that every historical branch/file or every later repository event was exhaustively verified.

Access and confidence limitations:
- GitHub branch listing returned `protected: false` for each of the 21 branch records returned. The branch-protection API endpoint returned HTTP 403 `Resource not accessible by integration`; therefore protection/ruleset configuration could not be independently inspected. The returned false flags are recorded as API-reported metadata only, not proof that all repository protections are absent or active.
- Branch-protection/ruleset configuration is NOT VERIFIED. Do not claim protection is active.
- Repository contents, PR metadata, selected PR file inventories and selected source files were readable through the available GitHub connection. The endpoint restriction above limits confidence specifically for protection/ruleset state; the historical PR inventory is also bounded as described and must not be presented as a current count.
- No audit-time timestamp is invented. For this R1 revision, the branch/base/PR states were rechecked separately; their current identities are documented in the PR revision record/comment rather than retroactively changing the historical snapshot.

### 2.2 Repository and main at historical audit

| Item | Verified state |
|---|---|
| Repository | `Hasnat26/DokanTools` |
| Visibility | Private |
| Default branch | `main` |
| Main HEAD at audit | `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4` |
| Repository language metadata | PLpgSQL |
| Main tree | Next.js / React / Supabase web application, SQL migrations and Node tests |
| Native Android project on main | Not found in audited recursive tree |
| Main-branch project-wide authority index | Not present before this governance PR |
| Main-branch Slice A v0.4 UX/architecture/QA baseline documents | Not found in audited recursive tree |
| Main-branch Slice B PO decision/UX specification | Not found in audited recursive tree |

The existing `README.md` and `docs/CURRENT_STAGE_BN.md` describe a reliability-foundation/pilot-preparation web app, not the later native Android Slice A scope. README explicitly states the app is not production-ready and identifies missing offline queue, live Supabase migration/runtime verification, full build/E2E and pilot acceptance. Treat that code as the historical/current main-branch web baseline only; it does not establish the approved native Android architecture.

### 2.3 Branch and PR inventory at historical snapshot

At the audit snapshot, 21 branch records were returned by GitHub. All listed branch records reported `protected: false`. Branch names and commit SHAs were enumerated. No historical branch was deleted or changed as part of DT-GOV-001.

Open PRs observed: #1–#20 (20 open PRs), all draft at the historical snapshot before PR #21 was created. Relevant active review chains:

| PR | Subject | State / base relationship | Authority assessment |
|---|---|---|---|
| #20 | Slice A Browser Harness v3 submission | OPEN / DRAFT / UNMERGED; head `e9f161916cf76f7d571309067031a4b186379ece`; base main `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4` | SUBMITTED; not accepted/merged |
| #19 | DT-002 authoritative source recovery | OPEN / DRAFT; stacked on PR #18 branch | SUBMITTED report; source-recovery snapshot only |
| #18 | DT-002 post-R2.10 DBA/manifest consolidation | OPEN / DRAFT; stacked on PR #17 branch | SUBMITTED; not design closure |
| #17 | M0-01 R2.10 + PO-01–PO-10 register | OPEN / DRAFT; head `d30cfec51e15fe89aeea95b6391a90992aafbffc` | R2.10 CH-1 accepted with conditions; design closure not granted; PO register CH-1 accepted with conditions as a documentation consolidation |
| #1–#16 | Earlier M0-01 revisions and QA/handoff branches | OPEN / DRAFT; multiple stacked branches | Historical candidates/reviews; not a single approved chain |

PR #17/#18/#19 are a stacked documentation/review chain, not three independent approved baselines. PR #19's source-recovery report says PO-01–PO-10 pending, but that statement is stale relative to the later PR #17 submissions and CH-1 acceptance comments (#6758644399–#6758930635) and the consolidated register. Do not reuse the stale PO status. The PR #19 report remains a submitted historical source-recovery artifact; its T01–T63, 28-case and DBA evidence gaps remain relevant.

PR #20 is preserved unchanged by the DT-GOV-001 and DT-GOV-001-R1 work. Its v3 HTML and six companion/worker-index artifacts remain on its submission branch; PR #20 is not merged, retested or otherwise modified here.

### 2.4 Branch protection access limitation

The branch listing reported `protected: false` for `main` and the other 20 branch records in the historical inventory. The branch-protection endpoint returned HTTP 403 `Resource not accessible by integration`. This does not establish whether GitHub rulesets or other controls exist. Branch protection/ruleset state remains NOT VERIFIED. No protection configuration was changed in either governance task.

Recommended configuration is in §8.

## 3. Workstream authority map

Statuses:
- **APPROVED:** explicit decision/review evidence supports approval within the stated scope and exact reviewed artifact.
- **SUBMITTED:** proposed artifact is present in a PR but is not merged/accepted as a main baseline.
- **PENDING:** a required review/decision/authorization remains outstanding.
- **REJECTED:** explicitly not accepted.
- **SUPERSEDED:** replaced for the stated scope by an explicitly identified later baseline; history remains preserved.
- **NOT ESTABLISHED AS GITHUB BASELINE:** the exact approved source artifact/decision record cannot be established from accessible canonical GitHub records. Historical chat, message or meeting references may explain provenance but do not independently supply the missing canonical baseline.

### 3.1 Main web application baseline

| Element | Exact source | Commit / blob | Status | Scope and limit |
|---|---|---|---|---|
| Existing web application source | Repository tree at `main` | Commit `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4` | APPROVED AS EXISTING REPOSITORY BASELINE ONLY | Next.js 15 / React / Supabase web starter and reliability foundation. Not a production release or authority for native Slice A. |
| Main README | `README.md` | Commit `1b872ef2eb3bdb2fc8556b328933cd6dba03dfe4`; blob `141f6387d03a19c74fda01bcb85f2752ad2f1301` | APPROVED AS REPOSITORY DOCUMENTATION ONLY | Describes current web app and its limitations; not proof of live deployment or production readiness. |
| Current stage note | `docs/CURRENT_STAGE_BN.md` | Same main commit; blob `de65042cdab05f819038f48a2e4f5e492ed40074` | APPROVED AS REPOSITORY DOCUMENTATION ONLY | Pilot preparation status; not a native Android baseline. |
| PO-confirmed invoice mockup | `docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md` | Same main commit; blob `efe0d261c50a4cfc706e82c832a6f052c676127c` | APPROVED — PO CONFIRMED, LAYOUT SCOPE ONLY | Bangla food-bill layout and bill QR distinction. Explicitly does not authorize invoice implementation or QR technical design. |

### 3.2 Slice A — Shop Profile / Browser Harness

| Element | Exact source | Commit / blob | Status | Scope and limit |
|---|---|---|---|---|
| Slice A UX Specification v0.4 | Canonical GitHub file not located in audited main tree or reviewed PR #20 file list | No GitHub commit/blob established | NOT ESTABLISHED AS GITHUB BASELINE | Historical governance notes indicate prior CH-1/PO approval, but the exact approved source document must be committed/recovered and reviewed before workers can treat it as a repository-controlled baseline. Historical messages are traceability only. Do not reconstruct, recreate, amend or act on a substitute by assumption. |
| Slice A architecture: Kotlin + Jetpack Compose + Room | Canonical architecture decision document not located in audited main tree or reviewed PR #20 | No GitHub commit/blob established | NOT ESTABLISHED AS GITHUB BASELINE | Historical governance notes indicate a Slice A-specific architecture direction, but the exact canonical decision is unavailable. This does not authorize implementation. Workers must stop and request CH-1/PM disposition before acting on it. API 26 remains the governing PM constraint recorded in project history; do not change it absent a canonical, applicable authorization. |
| Slice A QA Plan v1.2 | Canonical GitHub file not located in audited main tree or reviewed PR #20 | No GitHub commit/blob established | NOT ESTABLISHED AS GITHUB BASELINE | Historical governance notes indicate planning-baseline approval only, but exact approved artifact is missing. No QA execution authorization. Stop before using it as a controlled test baseline; request CH-1/PM disposition. |
| Browser Harness v3 submission | `docs/slice-a/browser-harness/v3/DokanTools_SliceA_BrowserHarness_v3.html` and six companion/worker-index files in the same directory | PR #20 head `e9f161916cf76f7d571309067031a4b186379ece`; HTML Git blob `a9388c896309aed086045896c374db7ba91af886`; HTML SHA-256 `62b2bbe7b051314b0612458dd4dc4640234b84a42a9c336a686931f8b640b734` | SUBMITTED — PR #20 OPEN/DRAFT/UNMERGED | Seven files total including branch-local worker index. CH-1 final source review pending; CH-4 retest not authorized; browser regression not executed/accepted. Preserve exact files unchanged. |
| Browser Harness v2 QA | Historical report/artifacts from prior review | Exact main-branch authority not established | SUPERSEDED FOR CURRENT SUBMISSION BY V3 ONLY | Historical v2 findings remain historical evidence; v3 submission does not imply acceptance. |
| Native Android implementation / runtime QA | No accepted implementation commit/APK/runtime evidence located in main | Not established | NOT AUTHORIZED / NOT ESTABLISHED | No implementation, build, native runtime QA, deployment or pilot authorization. |

**Slice A current gate:** Browser Harness v3 is submitted for CH-1 review. Browser Harness acceptance remains OPEN. Native Android readiness and QA are NOT ESTABLISHED. No CH-4 retest authorization is granted by this register.

### 3.3 Slice B — Local Food Menu Management

| Element | Exact source | Commit / blob | Status | Scope and limit |
|---|---|---|---|---|
| PO-B01–PO-B07 decisions | Canonical GitHub PO decision record not located in audited main tree or reviewed PRs | No GitHub commit/blob established | NOT ESTABLISHED AS GITHUB BASELINE | Historical governance notes record prior PO decisions (menu fields, mandatory fields, 80-character name limit, duplicate policy, deactivation, future-sale-only price changes, categories/units exclusion) and associated unresolved technical caveats. These notes are traceability only. Do not recreate, reinterpret or expand the PO decision record from them. Stop before relying on them as a controlled implementation baseline; request CH-1/PM disposition. |
| Slice B UX Specification v0.1 | Not found in audited repository tree | No commit/blob established | PENDING | CH-2 was authorized to prepare a draft for CH-1 review. No UX approval or implementation authorization established. Because the underlying PO decision record is not established as a GitHub baseline, CH-2 must not invent or fill policy gaps; request CH-1/PM disposition for any requirement that depends on the missing exact decision record. |
| Slice B implementation/schema/QA | No accepted baseline found | Not established | NOT AUTHORIZED | No code/schema/build/test/QA/deployment/pilot authorization. |

### 3.4 DT-002 / M0-01 remediation

| Element | Exact source | Commit / blob | Status | Scope and limit |
|---|---|---|---|---|
| R2.5 canonical PO decision source | `docs/M0-01_Remediation_Design_R2.5.md` on `docs/m0-01-remediation-design-r2-5` | Commit `daeeb7ae8e1df9b51c1f474b3d34f215f83c8512` | HISTORICAL DECISION SOURCE | PO-01–PO-10 options/decision context. Not current implementation authority. |
| R2.10 logical design | `docs/M0-01_Remediation_Design_R2.10.md` on `docs/m0-01-remediation-design-r2-10` | PR #17 head `d30cfec51e15fe89aeea95b6391a90992aafbffc`; blob `1d3aa3ad480d4c5071a19c9f6d1ff1abfdfc9d17` | APPROVED WITH CONDITIONS — CH-1 DOCUMENTATION REVIEW ONLY; PR #17 UNMERGED | Earlier technical-review candidate commit `8c0cf59a7dcba7b4d353207b4e79bd03aec6422` received CH-1 ACCEPT WITH CONDITIONS (PR #17 comment #6736302832). Design closure NOT GRANTED; physical DBA feasibility/runtime not verified; implementation NOT AUTHORIZED. |
| PO-01–PO-10 consolidated decision register | `docs/DT-002_PO-01_to_PO-10_Consolidated_Decision_Register.md` on PR #17 branch | CH-1-reviewed candidate commit `bf5e19e290bef697c86287686e8a9002e5744dbd`; blob `1af243f353ae8976919a17d1d2c5917ab8188f7d`. Current PR #17 head `d30cfec51e15fe89aeea95b6391a90992aafbffc`; current blob `28b99b8df24abc52592f752a2f2f2065b9cac44b` | APPROVED WITH CONDITIONS at exact candidate `bf5e...`; CURRENT PR-HEAD DOCUMENT VERSION PENDING CH-1 REVIEW | 10/10 PO policy decisions accepted with clarification in PR #17 comments; these are conversation comments, not formal PR review objects. CH-1 comment #6759084444 explicitly accepts only candidate `bf5e...`; later commit `d30...` changes the register and no CH-1 review of the current blob `28b...` was located in the historical audit. Therefore workers must use only the exact reviewed candidate for its bounded accepted record, and must not treat the current PR-head file as accepted until reviewed. PR #17 remains unmerged. |
| CH-4 DT-002 governance review | `docs/reviews/DT-002_CH4_INDEPENDENT_GOVERNANCE_REVIEW_2026-11-10.md` on PR #17 branch | Blob `a604be2f934799a529c9a626accf415b82887790` | ACCEPT WITH CONDITIONS — GOVERNANCE DOCUMENT REVIEW ONLY | Not a design/runtime QA acceptance. |
| Post-R2.10 consolidation | `docs/reviews/DT-002_POST_R2.10_CONSOLIDATION_2026-11-09.md` on PR #18 branch | PR #18 head `dd12317552c8198ae40d6a2aa8586cacd574e508`; blob `0f684f6915096f705c7df36533cec0203e1b66c8` | SUBMITTED — PR #18 OPEN/DRAFT/UNMERGED | Consolidates DBA-01–DBA-11 and T01–T63/28-case manifest status. Does not establish physical DBA evidence or design closure. |
| Authoritative source recovery report | `docs/reviews/DT-002_AUTHORITATIVE_SOURCE_RECOVERY_2026-11-10.md` on PR #19 branch | PR #19 head `f67449a1ac77a179e913c51465a30c54f9a79a0d`; blob `d0115b848a334e584fa77afc6495d7dbe27487a4` | SUBMITTED — PR #19 OPEN/DRAFT/UNMERGED | T01–T63 current authoritative manifest NOT LOCATED; 28-case executable contract source NOT LOCATED; DBA physical evidence NOT LOCATED. Its PO-pending statement is stale relative to later PR #17 decision records. |
| Design closure / implementation / financial pilot | No approved closure/authorization record | Not established | NOT GRANTED / NO-GO | No implementation, SQL/DB execution, build, test, deployment or pilot authorization. |

## 4. CH-1 / CH-2 / CH-3 / CH-4 responsibilities

- **PM / PO:** Owns business/product decisions and explicit authorization for implementation, tests, database operations, deployment and pilot. CH-1 cannot override PM restrictions.
- **CH-1 — Project Lead & Chief Reviewer:** Owns this register, exact baseline mapping, conflict resolution, gate decisions, scope review, evidence review and recommendations. CH-1 acceptance is not PM implementation authorization.
- **CH-2 — Product & UX Lead:** Produces UX/requirements from explicit PO decisions. May not invent policy. Submits versioned PRs for CH-1 disposition.
- **CH-3 — Engineering / Implementation:** Performs only specifically authorized engineering. Must use exact approved baseline and preserve source provenance. Cannot self-approve design/QA.
- **CH-4 — Independent QA Reviewer:** Reviews exact immutable candidate commits independently. Distinguishes document review, static checks, browser runtime, native Android runtime and DB runtime. Cannot authorize implementation or change baseline.

## 5. Branch naming and PR workflow

1. Branch from the exact approved base SHA; do not branch from an arbitrary worker branch.
2. Naming: `governance/<task>`, `docs/<workstream>-<revision>`, `feat/<workstream>-<scope>`, `fix/<workstream>-<scope>`, `qa/<review-target>`, `ch1/<review-task>`.
3. Default PR base is `main`. Stacked PRs are permitted only when necessary and must identify the parent PR, dependency and exact parent base SHA in the PR body and this register.
4. One coherent scope per PR. PR body must state task ID, base commit, exact files, scope/exclusions, evidence, tests actually executed, outcomes, unresolved issues and approvals required.
5. No direct commits to `main`; all changes through PR. No force push or history rewrite of reviewed/accepted baselines.
6. Required reviews: independent reviewer for material design/code/QA changes; CH-1 baseline disposition; PM approval for changes/activities requiring PM authority. A PR comment is not a formal GitHub review object; identify which type of approval is recorded.
7. Merge only after required review, checks and explicit PM approval. Draft PRs are proposals, not approved baselines.
8. Preserve historical branches/documents. No cleanup/deletion without explicit PM disposition.

## 6. Source pinning and conflict resolution

Before work, every worker records:
- Repository and task ID.
- Source branch/ref and exact commit SHA.
- Exact file paths and Git blob SHAs.
- Artifact version and status from this register.
- Authorization scope and exclusions.

If any source differs from the registered SHA, or two documents conflict:
1. Stop work and do not choose one by recency or convenience.
2. Record both refs, commit SHAs, blob SHAs and the conflicting clauses.
3. Notify CH-1; CH-1 records a disposition request to PM/PO where business authority is implicated.
4. PM/PO decision is recorded in a new versioned decision record/PR.
5. CH-1 updates this index through a governance PR after verifying the exact source.
6. Workers resume only against the newly recorded exact commit.

Approved documents are immutable. Corrections create new versioned paths/commits; prior versions remain preserved and are marked SUPERSEDED only for an explicitly bounded scope.

## 7. Change-control / execution restrictions

The following require explicit PM authorization for the exact scope: source-code changes, schema/SQL changes, database writes/migrations, builds, automated/manual tests, browser regression, native Android QA, deployment, APK distribution, pilot, merge and production data use.

This PR and DT-GOV-001-R1 do NOT authorize:
- CH-4 v3 browser retest.
- Slice A implementation or native Android QA.
- Slice B implementation.
- M0-01 design closure or implementation.
- Database/SQL execution, build, tests, merge, deployment or pilot.
- Any change to PR #20 or its v3 HTML/evidence.
- Changes to `main`, historical PRs or historical branches.

## 8. Recommended GitHub branch protection / rulesets

**Observed historical status:** branch listing returned `protected: false` for `main` and the other 20 branch records in the historical inventory. The branch-protection endpoint returned HTTP 403 `Resource not accessible by integration`. This does not establish whether GitHub rulesets or other controls exist. Branch protection/ruleset state remains NOT VERIFIED. No protection configuration was changed in either governance task.

Recommended for `main`:
- Require PR before merge; block direct pushes.
- Require at least one approving review from a reviewer other than the author; require CH-1 review for governance/baseline PRs.
- Dismiss stale approvals when new commits are pushed; require approval of the latest reviewable push.
- Require all applicable CI/status checks (tests, lint, typecheck/build as appropriate) before merge.
- Require conversation resolution.
- Require linear history or a controlled merge strategy; prohibit force pushes and branch deletion.
- Restrict bypass/admin bypass to named PM-controlled administrators; do not allow routine worker bypass.
- Require CODEOWNERS review for `PROJECT_SOURCE_OF_TRUTH.md`, `WORKER_SINGLE_SOURCE_OF_TRUTH.md`, `docs/decisions/**`, `docs/**`, `supabase/**`, and application source.
- Keep ruleset changes themselves under PM authorization and audit.

These are recommendations only, not active controls.

## 9. Unresolved decisions / evidence gaps requiring PM or CH-1 disposition

1. **Slice A canonical requirements:** recover/commit the exact approved UX v0.4, architecture decision, and QA Plan v1.2 sources with exact hashes. Until then they remain NOT ESTABLISHED AS GITHUB BASELINES; workers must stop before acting on them and request CH-1/PM disposition.
2. **Slice A v3:** CH-1 final source review remains pending; PR #20 stays unchanged. CH-4 retest requires separate PM authorization.
3. **Slice B:** recover/commit the exact PO-B01–PO-B07 decision record and submit CH-2 UX specification through controlled review. Until the exact PO record is established, workers must not rely on chat history to create/expand policy; stop and request CH-1/PM disposition. No implementation.
4. **DT-002:** CH-4/CH-1 documentation review conditions and R2.10 technical dependencies remain distinct from design closure. PRs #17–#19 are drafts and unmerged.
5. **M0-01 source recovery:** authoritative T01–T63 manifest and executable 28-case contracts not located; DBA-01–DBA-11 physical evidence not located.
6. **Branch protection:** GitHub integration denied the branch-protection endpoint (403); PM/admin must inspect and configure rules in GitHub settings.
7. **PR backlog:** PR #1–#19 include historical/stacked draft candidates. The initial inventory was a bounded snapshot; do not merge or delete them as bulk cleanup. PM/CH-1 should decide a controlled consolidation/closure plan after source reconciliation.

## 10. Current authorization matrix

| Activity | Status |
|---|---|
| Governance documentation on dedicated branch — DT-GOV-002 | AUTHORIZED FOR DOCUMENTATION ONLY |
| PR submission for DT-GOV-002 consistency update | AUTHORIZED |
| PR #20 modification or merge | NOT AUTHORIZED |
| Slice A v3 CH-1 final acceptance | PENDING |
| Slice A v3 CH-4 retest | NOT AUTHORIZED |
| Slice A native Android implementation/build/QA | NOT AUTHORIZED |
| Slice B implementation/schema/build/QA | NOT AUTHORIZED |
| M0-01 design closure / implementation | NOT GRANTED / NOT AUTHORIZED |
| SQL/database operations | NOT AUTHORIZED |
| Deployment / APK distribution / financial pilot | NOT AUTHORIZED / NO-GO |
| PR #21 merge into `main` | COMPLETED — MERGED AT `3abd0455a7755208049da310f85aab930e9f4200` |
| PR #22 — DT-GOV-002 consistency-update merge into `main` | COMPLETED — MERGED AT `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1` |

## 11. Acceptance condition

Global GitHub SSOT is **ACTIVE ON MAIN**. PM approved PR #21, whose reviewed head was `10bf1fb4c7687d2223e17c7303902df281deb4c5`; it was merged at commit `3abd0455a7755208049da310f85aab930e9f4200`. The exact paths and blob SHAs of both governance documents at activation are recorded in this document's metadata. PR #22 (DT-GOV-002) was approved by PM and merged at `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1`; its reviewed head was `a3c5f4057ccb2aec456167101bfc91ef3a5d185b`. The resulting active root governance document blobs are recorded in the metadata above. This update records merge state only and does not expand any workstream authorization.

All existing task-specific PM instructions, missing-baseline hard stops, approval gates and execution restrictions remain in force. Governance activation does not grant implementation, QA execution, SQL/database, build, deployment, APK distribution or pilot authorization.
