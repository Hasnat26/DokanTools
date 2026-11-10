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
| DT-GOV-002 consistency-update PR merge into `main` | PENDING PM APPROVAL |

## 11. Acceptance condition

Global GitHub SSOT is **ACTIVE ON MAIN**. PM approved PR #21, whose reviewed head was `10bf1fb4c7687d2223e17c7303902df281deb4c5`; it was merged at commit `3abd0455a7755208049da310f85aab930e9f4200`. The exact paths and blob SHAs of both governance documents at activation are recorded in this document's metadata. This DT-GOV-002 consistency-update PR proposes only to correct the post-merge status record; it does not deactivate or replace the active governance baseline until any approved follow-up merge takes effect.

All existing task-specific PM instructions, missing-baseline hard stops, approval gates and execution restrictions remain in force. Governance activation does not grant implementation, QA execution, SQL/database, build, deployment, APK distribution or pilot authorization.


---

## 12. Invoice-First Web MVP — current authority and control record

**Control snapshot:** 2026-11-10, refreshed against main HEAD 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1. This section is a current workstream addendum; it does not rewrite the historical audit snapshot in §§2–3.1. It becomes an active main-branch authority entry only when the governance PR carrying this change is reviewed and merged.

### 12.1 Exact source baseline and repository evidence

| Item | Exact identity at the pinned source | Status / bounded authority |
|---|---|---|
| Repository main | main HEAD 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 | VERIFIED current source snapshot |
| Worker instructions | WORKER_SINGLE_SOURCE_OF_TRUTH.md — blob 5714e127aad7a81d3e26da2ac2d77fe875927fdc | ACTIVE governance instruction |
| Project authority register | PROJECT_SOURCE_OF_TRUTH.md — blob 0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5 | ACTIVE before this proposed update |
| PO invoice mockup | docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md — blob efe0d261c50a4cfc706e82c832a6f052c676127c | PO-CONFIRMED — invoice layout/content and bill-QR purpose only |
| Existing app package | package.json — blob ae172ae60fa1ea497ea57c076026b46d70790109 | Next.js 15.5.28, React 19.3.1, Supabase JS ^2.45.4 |
| Dashboard source | src/app/dashboard/page.tsx — blob ee6dc3733cd4d50ec1dd76106477d50ab4b25c0c | Existing app source only; not Phase A1 acceptance |
| Supabase client / Shop type | src/lib/supabase.ts — blob 93c187a8384752346c0f0911c84b61f35b88cae6 | Existing client and shop field type |
| Shop loading hook | src/components/ShopGuard.tsx — blob 1f2509f02ce717ea90fbe939b03f56e2ad1775a9 | Existing auth/profile loading helper |
| Existing utility functions | src/lib/utils.ts — blob f7dbb1f5309de4f79a2dab032d60715f7607a470 | Includes normalizeBdPhone; not a profile validator |
| Repository schema | supabase/schema.sql — blob e859b6de9660533962eddb6f9f3d17ad8a4c1cca | Repository SQL source only; not proof of deployed DB state |
| Reliability migration | supabase/migrations/20261019_reliability_foundation.sql — blob 6b6b51318a5b4d1f38880ec2007049409102931c | Repository migration source only; not proof it ran in the live project |

The GitHub branch endpoint reported main as protected=false. Ruleset/branch-protection configuration is not independently verified; do not claim that required-review or status-check protections are active.

### 12.2 PO-confirmed mockup — limited authority

The pinned PO record confirms the standard Bangla food-bill layout for Bangladesh food shops, hotels and restaurants. It confirms shop name, shop address, mobile number, Google Maps shop location, bill number, date/time, item name, quantity, price, total, an individual bill verification/details QR, the exact heading **খাবারের বিল**, and the exact footer **ধন্যবাদ, আবার আসবেন!**.

The QR on an individual bill must identify that bill. A shop promotional/profile QR is a separate concept and must not replace the bill QR.

This record does **not** decide paper size, unit-price versus line-amount semantics, QR token protocol or lifetime, revocation/cancellation policy, offline issuance/verification, menu policy, or implementation. It grants no implementation, QA, merge, deployment or pilot authorization.

### 12.3 PR #28 — CH-3 technical design v0.2

| Field | Verified value |
|---|---|
| PR | https://github.com/Hasnat26/DokanTools/pull/28 |
| Branch | docs/dt-invoice-first-mvp-tech-design-001 |
| Base | main at 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 |
| Current head | 2b1e0be89e2487bedf841dbc8247d646529ae7cc |
| v0.2 file | docs/design/INVOICE_FIRST_WEB_MVP_TECHNICAL_DESIGN_v0.2.md |
| v0.2 blob | 348ec933a2798ba2c790707397d723e8377a8442 |
| Preserved v0.1 blob | 10f795ddfc24b0d3eab204b8006379616ab2ec13 |
| PR state | OPEN / UNMERGED; two Markdown files; not part of main |
| CH-1 review object | Review 5839806278, state COMMENTED, against exact v0.2 head |
| CH-1 disposition | ACCEPTED WITH CONDITIONS — DESIGN DOCUMENTATION ONLY |

The v0.2 document maps CH4-01..CH4-11 to technical sections and proposed acceptance scenarios. CH-1's review records CH4-01 as design-resolved only with the PO-12 bearer-link risk gate; CH4-02..CH4-11 as document-level design-resolved. All database enforcement, key/KMS, CDN/cache, rate-limit, font/renderer and runtime evidence remains outstanding. Proposed tests are NOT EXECUTED. This review is not implementation approval, QA acceptance or merge approval.

### 12.4 PR #30 — CH-2 owner/customer UX v0.1

| Field | Verified value |
|---|---|
| PR | https://github.com/Hasnat26/DokanTools/pull/30 |
| Branch | docs/invoice-first-owner-customer-ux |
| Base | main at 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 |
| Current head | ca8324005048148b8d82c5151528ea41a2aa8a5a |
| UX file | docs/ux/INVOICE_FIRST_WEB_MVP_OWNER_CUSTOMER_UX_v0.1.md |
| File blob | 076987722886a1b08246f8c644e8aa2744eb33de |
| PR state | OPEN / UNMERGED; one Markdown file; not part of main |
| CH-1 disposition | ACCEPT WITH CONDITIONS — UX DESIGN ONLY, recorded in PR comment 6763856297; this is a conversation comment, not a formal CH-1 PR review object |

**Outstanding review thread:** PR #30 has one unresolved, non-outdated P2 inline thread at line 160, thread ID PRRT_kwDOVhBFWs61okrS, comment 4523203685. It requires menu deactivation/reactivation/deletion behavior to remain explicitly provisional until the canonical PO menu decision is recovered or re-approved. The Issue #24/31 authority addenda gate menu policy, but the inline thread itself remains unresolved. Owner: CH-2. Closure requires a narrowly scoped correction on the existing UX PR (no new UX version unless necessary), followed by CH-1 review of the exact revised head. This does not block Phase A1; it blocks menu-policy acceptance and the full menu workflow.

### 12.5 CH-2 final UX reconciliation

The controlling criterion-level recount is Issue #24 comment 6764578884. UX-01 through UX-39 are each listed exactly once:

| Status | Count | Criteria |
|---|---:|---|
| MAPPED | 14 | UX-05, UX-15, UX-16, UX-18, UX-19, UX-20, UX-22, UX-27, UX-28, UX-30, UX-32, UX-34, UX-35, UX-36 |
| PARTIAL | 12 | UX-01, UX-02, UX-06, UX-13, UX-14, UX-17, UX-21, UX-24, UX-25, UX-37, UX-38, UX-39 |
| GAP | 5 | UX-03, UX-04, UX-10, UX-11, UX-33 |
| PO-GATED | 8 | UX-07, UX-08, UX-09, UX-12, UX-23, UX-26, UX-29, UX-31 |
| TOTAL | 39 | 14 + 12 + 5 + 8 = 39 |

MAPPED means design mapping and proposed acceptance coverage only; it does not mean implemented, tested or accepted at runtime. UX-19 is mapped for the confirmed invoice field inventory; only the affected price presentation remains PO-04-gated. UX-21 is PARTIAL, not PO-GATED: engineering selects a default PDF profile, and a defined normal-bill corpus must render on one page without clipping, truncation, overlap or illegible shrinkage; larger bills paginate losslessly. UX-23 is PO-GATED for end-to-end public verification, while bill-specific QR identity itself is PO-confirmed.

For Phase A1, the relevant UX profile criteria are UX-01..UX-05. UX-01 and UX-02 remain PARTIAL; UX-03 and UX-04 are GAPs requiring direct required-field/preservation and failed-save/retry assertions. UX-05 concerns future issued-invoice snapshot immutability and is not an A1 feature. A1 must add its own criterion-level test coverage before QA acceptance; it must not claim these gaps were tested.

### 12.6 CH-3 technical closeout and existing application findings for Phase A1

**Verified repository facts at main 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1:**

1. The existing stack is Next.js 15.5.28, React 19.3.1 and Supabase JS. No replacement architecture or new dependency is proposed for A1.
2. The existing shops table contains shop_name, address, phone and map_link. shop_name is NOT NULL; address, phone and map_link are nullable in the repository schema. The Shop type already contains these fields.
3. The original schema defines owner-scoped RLS policies for shop SELECT, INSERT and UPDATE using auth.uid() = user_id. The reliability migration grants authenticated users SELECT, INSERT on named shop columns and UPDATE on named shop columns, including the four A1 fields. The repository source does not prove that the same migration/schema/policies are deployed in the live Supabase project.
4. The current dashboard creation form requires only shop_name. It also exposes shop_type and owner_name, and its createShop function inserts default rows into item_catalog after creating the shop. That side effect is outside Phase A1 and makes the existing create path unsafe to reuse unchanged.
5. The current dashboard displays shop information but has no complete profile-edit flow. ShopGuard loads the first shop by created_at; the app does not expose multi-shop selection.
6. The shops table has no unique constraint on user_id and no updated_at column in the pinned schema. Existing data cardinality and live RLS state have not been inspected.
7. normalizeBdPhone strips non-digits and prefixes 88 when the number does not start with 880 or 0. It is a WhatsApp-link helper, not a profile validator and must not be reused as one.
8. Existing tests use Node's built-in test runner. The repository has no dedicated Shop Profile test suite. No dependency installation, build, lint, automated test, browser test or live DB inspection was performed for this assignment.

**Engineering conclusion:** the existing shops table is sufficient for basic A1 CRUD at the repository-schema level; no new table or column is indicated. A1 must isolate profile create/view/edit and remove the default item_catalog seeding side effect from the profile-creation path. It must update only shop_name, address, phone and map_link, preserving existing shop_type, owner_name, logo_url, plan and is_public values. RLS, not a client-supplied user_id filter alone, is the tenant boundary. No service-role key may be exposed to the browser.

The current UI's earliest-shop selection implies a single primary-shop experience, but the database does not enforce one shop per user. A1 should not add multi-shop or branch selection. Do not add a unique index until a read-only duplicate-data audit and explicit PM decision establish that one-shop-per-user is the intended invariant. Live data and deployed RLS remain NOT VERIFIED.

### 12.7 PO decision closure — current status

The latest consolidated PO response request is Issue #31 comment 6764860208. At this snapshot, the issue contains no PO response comments. Silence, acknowledgement, CH-1 recommendations and issue closure are not approval. No duplicate reminder issue is to be created; use the existing Issue #31 request.

| Decision ID | Required PO response | Status | Feature dependency |
|---|---|---|---|
| PO-02 — online-only issuance and verification promise | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates final customer-facing online/offline promise and invoice release; does not block A1 |
| PO-04 — unit price and line amount presentation | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates final customer-facing invoice/PDF price presentation; does not block A1 |
| PO-05 — quantity precision, fractional quantity and units | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates final composer/quantity semantics; does not block A1 |
| PO-06 — food-menu minimum fields and lifecycle | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates menu fields/lifecycle and menu implementation; does not block A1 |
| PO-11 — invoice revocation, correction and customer-visible state | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates revocation/correction and customer-visible revoked state; does not block A1 |
| PO-12 — public bill-link lifetime and bearer-access risk | APPROVE / MODIFY / DEFER; specify expiry if finite | PENDING-PO | Gates public bill verification/link lifecycle; does not block A1 |
| PO-I11 — customer verification wording | APPROVE / MODIFY / DEFER with exact wording | PENDING-PO | Gates public verification wording; does not block A1 |
| PO-I06A — key-compromise business-impact acknowledgement | Explicit acknowledgement and PO/Security disposition | PENDING-PO | Gates acceptance of key-retention/compromise business risk; does not block A1 |

The six principal decisions and two supplementary decisions remain separate. PO-11/12 gate public bill verification, not independent shop-profile work. Database integrity, RLS, HMAC, key management, cache controls, rate limits and QA evidence remain engineering obligations and cannot be waived by PO approval.

### 12.8 Phase A1 — Shop Profile Foundation: PM authorization package

**Package status:** PREPARED FOR PM DECISION; NOT AUTHORIZED FOR IMPLEMENTATION.

**Proposed source baseline:** repository main commit 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1. The package is valid only against this exact source snapshot. If main moves before PM authorization, CH-1 must re-pin the baseline and reassess the diff; workers must not silently rebase or select a new source.

**Proposed implementation branch:** feat/phase-a1-shop-profile, created from the exact source commit above only after explicit PM authorization.

**Purpose:** implement the authenticated owner's Shop Profile foundation in the existing Next.js/Supabase application.

**Included scope:**
1. Create a shop profile.
2. View the saved profile.
3. Edit the same profile record.
4. Persist the four fields: shop name, shop address, mobile number and Google Maps location.
5. Field validation and actionable field-level errors.
6. Authenticated access and shop ownership checks.
7. Tenant isolation and data-access controls using the existing Supabase RLS model.
8. Loading, empty, saving, success, failure and retry states.
9. Automated test source for profile validation and persistence/ownership behavior.
10. Required QA evidence plan for desktop/mobile browser behavior and tenant isolation.

The CH-2 O-01 UX proposal treats all four fields as required. The PO mockup confirms that these fields belong in the invoice header, but does not separately specify field requiredness or exact validation rules. For A1 planning, all four are proposed as required; this is an explicit UX/engineering proposal, not a new PO decision.

**Explicit exclusions:**
- Food menu/catalog CRUD or lifecycle.
- Invoice composer, issue, numbering or history.
- Financial calculations, price overrides, discount, tax, paid or due.
- Customer records or customer ledger.
- Public bill QR, public bill verification or shop promotional QR changes.
- PDF generation, printing or WhatsApp sharing.
- Payment, accounting, stock, inventory or supplier functions.
- Multi-branch or multi-shop selection.
- Unrelated dashboard redesign, refactoring or architecture replacement.
- Database schema/RPC/policy/migration changes unless separately authorized after source/live-state verification.
- Dependency, build configuration or environment-secret changes unless separately authorized.

**Proposed minimum code impact:**
- Modify src/app/dashboard/page.tsx only for the shop-profile create/view/edit flow; do not broaden the change into existing memo, stock, public-page or other dashboard features.
- Add a focused src/components/ShopProfileForm.tsx if needed to isolate create/edit behavior.
- Add src/lib/shop-profile-validation.mjs and its declaration file src/lib/shop-profile-validation.d.mts, following the repository's existing .mjs/.d.mts helper pattern.
- Add tests/shop-profile-validation.test.mjs using the existing Node test runner.
- Modify src/components/ShopGuard.tsx only if the implementation needs a narrowly scoped correction to authentication/loading/error handling.
- No change to src/lib/supabase.ts is expected because the Shop type already includes the four fields.
- No other application paths are authorized by this package.

**Database impact and permission boundary:**
- Preferred A1 implementation uses the existing shops table and existing owner RLS/grants; no new table, column, index, RPC, SQL, migration or policy change is included.
- No live database inspection or operation has been performed. Before implementation acceptance, the deployed schema and RLS/grants must be checked under a separate explicit read-only DB-inspection permission.
- If the live schema differs, required fields cannot be safely enforced, existing data contains duplicates that affect the primary-shop assumption, or a database constraint is judged necessary, STOP and obtain a separate PM authorization for the exact migration/SQL scope. Do not improvise a schema change.
- Do not add a unique user_id index without a data audit and explicit PM approval.

**Proposed validation contract for CH-4 review:**
- Trim outer whitespace and reject empty shop name and address; preserve Bengali/Unicode display text.
- Require a non-empty mobile number. Reject alphabetic characters; allow digits and common display characters (+, spaces, hyphens and parentheses). Do not claim carrier verification or a verified phone identity. Do not reuse normalizeBdPhone as validation. A stricter Bangladesh-number rule must be explicitly specified and tested before adoption.
- Require a Google Maps URL using HTTPS and an explicit host allow-list. Proposed hosts for review: maps.google.com, www.google.com with a /maps path, maps.app.goo.gl, and goo.gl/maps. Parse the URL; do not accept javascript:, data:, arbitrary external hosts or malformed values. Do not claim geocoding or pin accuracy; store the supplied share URL only.
- Preserve all entered values after validation or save failure. Do not silently truncate input.
- Exact maximum text lengths are not specified in the existing PO mockup/schema; CH-3 must propose bounded UI limits and CH-4 must review them before implementation. Do not silently invent a PO limit.

**Security and privacy controls:**
- Resolve the authenticated user from Supabase Auth; never trust a user_id supplied by a form.
- Insert the authenticated user's ID and rely on RLS WITH CHECK to enforce ownership.
- On update, target the selected shop row and authenticated owner; RLS must independently reject cross-tenant access.
- Do not expose service-role credentials in browser code.
- Select only the profile fields needed by the UI; do not expose internal account/auth data.
- Preserve existing column-level grants and RLS. Do not broaden table privileges.
- Display the Maps link only after safe URL validation; no geocoding or third-party tracking is part of A1.
- No profile deletion or owner-transfer flow.

**Proposed acceptance criteria (all require future evidence):**
- A1-AC-01: Unauthenticated access to the profile flow redirects to login and exposes no shop data.
- A1-AC-02: An authenticated account without a shop sees the empty/create state with all four profile fields and clear required-field labels.
- A1-AC-03: A valid save creates the shop profile for the authenticated owner and persists all four fields; it creates no item_catalog, stock, memo, customer or ledger rows.
- A1-AC-04: A page reload retrieves and displays the same saved profile from Supabase.
- A1-AC-05: Edit updates the existing shop row, not a second row, and preserves unrelated existing columns such as shop_type, owner_name, logo_url, plan and is_public.
- A1-AC-06: Empty/whitespace required fields and malformed phone/Maps values produce adjacent actionable errors; valid fields remain unchanged.
- A1-AC-07: A failed save retains the full draft and provides a retry path; duplicate taps do not create duplicate profile rows.
- A1-AC-08: Two-user negative tests prove that one authenticated user cannot read or update another user's shop, including when the other shop ID is supplied directly.
- A1-AC-09: The Maps link is HTTPS and matches the approved host/path allow-list; invalid schemes/hosts are rejected.
- A1-AC-10: A1 contains no menu, invoice, QR, PDF, WhatsApp, payment, accounting, customer, stock or inventory capability.

**Proposed test strategy (NOT EXECUTED):**
- Unit: required-field trimming, Unicode preservation, phone character grammar, Maps URL parsing/allow-list, invalid scheme/host and boundary lengths.
- Supabase integration: two authenticated test users; owner create/read/update; cross-tenant SELECT/UPDATE denial; spoofed user_id denial; profile persistence; no catalog/ledger side effects.
- UI/browser: empty/create/view/edit, field errors, loading/saving/success/failure/retry, duplicate taps, reload persistence, 320 CSS px and common mobile widths, keyboard/focus/labels.
- Regression: existing login/signup and existing dashboard routes remain functional; profile-only changes do not alter existing memo/stock/public-page behavior.
- Use existing Node test infrastructure where possible. No new test dependency is included. Browser/DB QA execution requires separate PM authorization and an identified staging environment/test accounts.
- All results must record environment, exact commit, command/action, output and limitations. No BLOCKED or NOT EXECUTED result may be reported as PASS.

**Implementation sequence after authorization:**
1. Reconfirm main/source commit and mandatory SSOT files.
2. Under explicit read-only DB permission, verify deployed shops columns, RLS policies and grants; stop on drift.
3. Implement isolated profile create/view/edit and validation.
4. Remove the item_catalog seeding side effect from the profile creation path; verify no menu writes.
5. Add unit and authorized integration test source.
6. CH-4 reviews the exact implementation candidate and acceptance evidence.
7. Execute only the separately authorized QA scope; report results and defects.
8. Submit a separate merge request for PM approval. Deployment and pilot remain separate gates.

**Effort estimate (engineering estimate, not commitment):** 3–5 engineering person-days for focused UI, validation, persistence and unit-test implementation; 1–2 QA person-days for authorized staging/RLS and browser acceptance. Add 1–2 engineering days if live schema drift, duplicate shop records or migration needs are discovered. These estimates exclude invoice/menu work and production release.

**Rollback:** A1 is intended to require no database migration. Roll back by reverting the A1 application commit/deployment to the prior known-good app version. Retain shop profile records; do not delete user data. If a migration is later separately authorized, it requires a pre-migration backup, explicit forward/rollback SQL and its own approval.

**PM permissions requested — not granted by this package:**
- Implementation: authorize only the exact A1 code paths above on feat/phase-a1-shop-profile from the pinned baseline.
- Database: no schema/SQL/migration changes. Separately authorize read-only staging schema/RLS inspection if required.
- Tests: authorize writing the A1 test source as part of implementation; test execution is NOT AUTHORIZED until a separate QA permission specifies test layers, environment and accounts.
- Merge, deployment and pilot: NOT AUTHORIZED; separate later decisions required.

### 12.9 CH-4 assurance status and findings

The recorded independent CH-4 report at PR #28 comment 6763798273 reviewed v0.1 and returned REJECT. Issue #29 is now closed as completed for that v0.1 review scope. There is **no recorded independent CH-4 review of PR #28 v0.2 or of this Phase A1 package**. CH-1's v0.2 integrated review is not a substitute for CH-4's independent review. Issue #27 remains open for the required v0.2/A1 review. Do not claim the CH-4 gate is complete.

CH-1's adversarial cross-check identified the following items for CH-4 to confirm independently:

| Finding | Severity | Evidence / impact | Owner | Required closure evidence | Blocks A1? | Blocks full MVP? |
|---|---|---|---|---|---|---|
| A1-F01 — profile creation has an out-of-scope catalog side effect | MAJOR | dashboard createShop inserts default item_catalog rows; violates profile-only scope | CH-3 | isolated create path and test proving zero catalog/stock/ledger writes | YES | No, but profile onboarding |
| A1-F02 — existing profile form does not enforce all four required fields and has no edit flow | MAJOR | dashboard form requires only shop_name; phone/address/map_link optional; no profile edit | CH-3 | field-level validation and create/view/edit acceptance evidence | YES | No |
| A1-F03 — live RLS/schema state unverified | MAJOR | repository SQL is not deployed DB evidence | CH-3 / DBA | authorized read-only staging inspection with exact environment and policy/grant evidence | YES for acceptance/release | YES for secure tenant release |
| A1-F04 — mobile normalization helper is not a validator | MINOR | normalizeBdPhone blindly prefixes 88; unsuitable as input validation | CH-3 | separate validator unit tests; no false phone-verification claim | YES | No |
| A1-F05 — shop cardinality is not enforced | OBSERVATION | current UI selects earliest shop; schema has no unique user_id constraint | PM / CH-3 | preserve primary-shop assumption or explicit PM decision after duplicate-data audit; no unapproved unique index | CONDITIONAL | No |
| UX-F01 — menu lifecycle statements remain under an unresolved P2 thread | MAJOR | PR #30 line 160; menu lifecycle may be interpreted as approved despite missing PO-B01–B07 baseline | CH-2 | narrowly scoped UX correction or canonical PO decision; resolve exact inline thread and CH-1 re-review | NO | YES for menu |
| UX-F02 — profile-specific UX-03/UX-04 coverage is incomplete | MAJOR | Issue #24 crosswalk marks required-field/preservation and failed-save/retry as GAP | CH-2 / CH-4 | A1-AC-06/07 and corresponding unit/UI tests in the QA plan | YES for QA acceptance | No |

**Provisional review recommendation:** ACCEPT WITH CONDITIONS for the Phase A1 design package, subject to CH-4 independently confirming the acceptance criteria and the findings above. This is a CH-1 recommendation only; it is not a CH-4 disposition or QA acceptance. The formal independent CH-4 gate remains PENDING-QA.

### 12.10 Consolidated pending-item register — Invoice-First workstream

Statuses below use the controlled status vocabulary in the PM directive. A completed design deliverable does not imply that its PR is merged or that implementation/QA is authorized.

| ID / GitHub location | Status | Owner | Closure criteria / evidence | Blocks A1? | Blocks full MVP? |
|---|---|---|---|---|---|
| Issue #24 — overall coordination and authority-register assignment | PENDING-PM | CH-1 / PM | Review and decide the governance PR carrying this register update; separately decide A1 implementation/QA gates | YES for authorization | YES for controlled workstream baseline |
| Issue #25 / PR #30 — UX specification | PENDING-ENGINEERING | CH-2 | Resolve P2 menu-lifecycle thread on exact PR #30 revision; preserve UX-01..39 traceability; CH-1 re-review exact revised head | NO | YES for menu UX and full UX baseline |
| Issue #26 / PR #28 — technical design | CLOSED | CH-3 / CH-1 | CH-3 design/planning deliverable closed by comment 6765116930; PR #28 remains open/unmerged and accepted with conditions for design documentation only; outstanding PO/security/runtime gates tracked separately | NO | YES as design reference; not a release baseline |
| Issue #27 — independent CH-4 review | PENDING-QA | CH-4 | Independent review of exact PR #28 v0.2 and Phase A1 package; return ACCEPT / ACCEPT WITH CONDITIONS / NEEDS REVISION / REJECT with severity, evidence, owner and closure action | YES before A1 implementation | YES before full MVP acceptance |
| Issue #29 — CH-4 review of PR #28 v0.1 | CLOSED | CH-4 / CH-1 | v0.1 review report and REJECT disposition recorded at comment 6763798273; closure comment 6765081410 | NO | No; v0.1 is preserved historical review evidence |
| Issue #31 — PO decision closure | PENDING-PO | PO | Explicit APPROVE / MODIFY / DEFER and exact wording for each of PO-02, PO-04, PO-05, PO-06, PO-11, PO-12, PO-I11 and PO-I06A | NO | YES for affected invoice/menu/public-verification capabilities |
| PR #28 — technical design v0.2 | ACCEPTED | CH-1 / PM | Accepted with conditions for design documentation only; PM separately decides whether/when to merge after all required review; never treat as implementation authorization | NO | YES as controlled design input |
| PR #30 — UX v0.1 | PENDING-ENGINEERING | CH-2 / CH-1 | Resolve outstanding P2 inline thread and obtain CH-1 disposition on exact corrected head; remains open/unmerged until separately approved | NO | YES for UX/menu design baseline |
| Governance PR from this assignment | PENDING-PM | CH-1 / PM | CH-1 review and PM merge decision; the register update is not active on main until merged | YES for active authority-register correction | YES for controlled workstream authority |

### 12.11 Current authorization matrix

| Activity | Invoice-First / Phase A1 status |
|---|---|
| Repository/source inspection for this assignment | COMPLETED |
| Documentation reconciliation and A1 package preparation | COMPLETED IN THIS GOVERNANCE SUBMISSION |
| Governance-only branch/PR submission | AUTHORIZED; pending PR review/PM merge decision |
| Application implementation | NOT AUTHORIZED |
| SQL/schema/RPC/migration or database mutation | NOT AUTHORIZED |
| Live DB inspection | NOT AUTHORIZED |
| Dependency/configuration changes | NOT AUTHORIZED |
| Build/lint/typecheck/test execution | NOT AUTHORIZED |
| Browser/manual QA or Supabase integration QA | NOT AUTHORIZED |
| CH-4 independent review of v0.2/A1 | PENDING |
| PR #28 / PR #30 merge | NOT AUTHORIZED |
| Deployment / production release | NOT AUTHORIZED |
| Customer pilot | NOT AUTHORIZED |

**CH-1 final recommendation:** The Invoice-First technical design v0.2 is accepted with conditions for documentation only. The UX v0.1 remains accepted with conditions, with one unresolved P2 thread. The eight requested PO decisions remain PENDING-PO. Phase A1 is technically separable from those PO decisions and can use the existing web architecture and shops table, but its current dashboard creation side effect, missing edit flow, incomplete required-field validation and unverified live RLS state must be addressed. Do not authorize A1 implementation until CH-4 independently reviews this exact package and PM grants the explicit A1 implementation and separate QA permissions. No implementation, database operation, build, test, merge, deployment or pilot is authorized by this register update.


### 12.12 Final PM decisions required for Phase A1

Only the following decisions require PM disposition before the relevant gate:

| PM decision | CH-1 recommendation | Why PM action is required | Gate |
|---|---|---|---|
| A1-PM-01 — confirm four profile fields as required | Accept the CH-2 O-01 proposal: shop name, address, mobile and Google Maps URL are all required | The PO mockup confirms the four fields appear on the invoice; the UX specification makes them required, but the mockup does not independently state requiredness | Before implementation scope freeze |
| A1-PM-02 — accept the proposed validation enforcement boundary | For A1, permit client-side validation for user experience and retain existing RLS for tenant ownership; explicitly accept that direct authenticated Supabase API writes can bypass client-side format validation. Before public exposure, require safe URL validation at the server/database or public-render boundary | Existing authenticated grants permit direct writes to the owner's own shops row. RLS prevents cross-tenant access but does not enforce the proposed phone/Maps format | Before implementation; public exposure remains separately gated |
| A1-PM-03 — authorize Phase A1 implementation | If CH-4 review is ACCEPT or ACCEPT WITH CONDITIONS with no unresolved A1 blocker, authorize only branch feat/phase-a1-shop-profile from baseline 9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1 and the code paths/scope in §12.8 | This is a separate implementation authorization; the current assignment only prepared the package | Before any application source change |
| A1-PM-04 — authorize read-only DB inspection and QA execution | Grant separate, explicit permissions for (a) read-only staging schema/RLS/grant inspection and (b) named unit/integration/browser test execution with an identified environment and test accounts | Neither activity is authorized by this governance assignment; repository SQL cannot prove deployed state | Before DB inspection or any test/QA execution |
| A1-PM-05 — shop cardinality | Retain current earliest-shop primary-profile behavior for A1; do not add a unique user_id index or multi-shop UI | Repository code selects the earliest shop; schema has no uniqueness constraint and live duplicate data is unknown | No immediate action if recommendation accepted; any uniqueness change requires separate data audit and approval |

**Validation enforcement limitation:** client-side validation is not a database integrity control. A user authenticated to Supabase can call the public client API directly and write to their own row, subject to existing grants/RLS. The current A1 proposal does not authorize a database constraint or write RPC. This is acceptable only as a bounded A1 UI-validation approach; it must not be represented as server-enforced validation. If PM requires strict phone/Maps format enforcement for all write paths, CH-3 must propose the exact constraint/RPC and data-preflight plan, then obtain separate DB/schema authorization before implementation. The public shop page currently renders the stored map_link; before relying on the link as a customer-safe URL, the allow-list must also be enforced at a trusted boundary. This customer-facing hardening is not silently included in A1.
