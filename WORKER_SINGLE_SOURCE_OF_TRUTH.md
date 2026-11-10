# DokanTools — Mandatory Worker Instructions

**Repository:** `Hasnat26/DokanTools`  
**First-read file:** `WORKER_SINGLE_SOURCE_OF_TRUTH.md` (this file)  
**Authority register:** `PROJECT_SOURCE_OF_TRUTH.md`  
**Governance status:** ACTIVE ON MAIN — PR #21 MERGED WITH PM APPROVAL

## 1. Mandatory start-of-work protocol

Every worker, including CH-1, CH-2, CH-3, CH-4 and any external/AI support worker, MUST:

1. Open this file from the exact GitHub branch/commit assigned to the task.
2. Read `PROJECT_SOURCE_OF_TRUTH.md` from that same commit.
3. Identify the workstream's exact authoritative baseline path, version, Git commit SHA and document/blob SHA from the register.
4. Confirm that the baseline status permits the requested activity. A SUBMITTED, PENDING, REJECTED, SUPERSEDED or NOT ESTABLISHED artifact is not an approved baseline.
5. Record in the task/PR description: repository, source branch/ref, source commit SHA, exact files and blob SHAs, task ID, authorized scope and exclusions.
6. If any required baseline is missing, contradictory, stale, or not approved, STOP and report the gap to CH-1. Do not choose a convenient alternative.

**Missing-baseline hard stop:** Where the register states `NOT ESTABLISHED AS GITHUB BASELINE`, or where an approved decision is known to exist but its exact approved artifact/decision record cannot be located and pinned by commit and blob SHA, workers MUST NOT act on that decision as a repository-controlled baseline. Stop before drafting implementation/design/QA work that relies on it and request a recorded CH-1/PM disposition. Do not recreate, reinterpret, expand, normalize, or modify PO decisions to fill a documentation gap. This stop does not prevent a worker from reporting the gap or performing explicitly authorized source-recovery work that does not rely on the missing baseline.

**Never start from a chat attachment, local download, ZIP, email, personal copy, worker-generated export, or unreferenced branch.** GitHub is the only project record. Local clones may be used as working copies only when their exact source commit is recorded; they are never independent authorities.

## 2. Single source, evidence and precedence

Historical chat messages, meeting notes, approval messages, prior governance discussions and conversation summaries may be retained or cited as traceability evidence to explain history, context or why an unresolved status was recorded. They do **not** independently establish, recreate, amend or activate a repository-controlled baseline when the exact approved artifact or decision record is missing. A known historical approval without an exact canonical GitHub source remains `NOT ESTABLISHED AS GITHUB BASELINE` until recovered or dispositioned through a controlled, explicit process. A worker must not transform traceability evidence into a new PO decision or technical approval.

A workstream-local instruction file exists on the unmerged PR #20 branch at `docs/slice-a/browser-harness/v3/WORKER_SINGLE_SOURCE_OF_TRUTH.md`. It is limited to the Slice A Browser Harness v3 artifact package. It is not a second project-wide authority. The root file and `PROJECT_SOURCE_OF_TRUTH.md` are the active project-wide authority on `main`; the nested v3 file is subordinate and may be used only as a v3 artifact index. PR #20 must remain unchanged unless separately authorized.

`PROJECT_SOURCE_OF_TRUTH.md` is the project-level authority index. It identifies exact workstream sources and their governance status. A linked source document at its stated commit is authoritative only within the scope and status explicitly recorded.

Precedence and decision authority:
1. **PM's explicit written decisions and task-specific authorizations** govern matters reserved to PM. A historical message may evidence what was said, but it does not waive this document's exact-source requirement for a repository-controlled baseline or substitute for an authorization that must cover a specific activity.
2. **PO-approved business/product decisions** govern product policy only when the exact approved decision record is available and accepted/pinned in GitHub. If that canonical record is missing, retain `NOT ESTABLISHED AS GITHUB BASELINE`; do not infer its wording from chat history.
3. **CH-1-accepted project authority register and scope-specific baselines** govern project control only within their expressly accepted scope and exact reviewed revision.
4. **Approved technical/design/QA documents** govern only their stated discipline, revision and scope.
5. Submitted PRs and draft documents are proposals only.
6. Worker notes, chat summaries, local files and undocumented assumptions are traceability/context only and cannot change a baseline.

Business/PO approval, CH-1 document review, architecture approval, implementation authorization, QA planning approval, QA execution authorization, QA acceptance, merge approval, deployment approval and pilot GO are separate gates. No one gate implies another. A PR comment is not a formal GitHub review object unless explicitly identified as such. If sources conflict, do not resolve by silently taking the newest timestamp, branch, or version number. Stop; identify the exact conflict and request CH-1/PM disposition.

## 3. Change and PR workflow

- Do all project artifact changes in GitHub.
- Create a task-specific branch from the exact approved base commit. Use prefixes: `governance/`, `docs/`, `feat/`, `fix/`, `qa/`, or `ch1/`.
- One coherent task/scope per branch and PR. Do not mix unrelated workstreams.
- Commit changes with traceable messages. Never rewrite or force-push an accepted/approved baseline.
- Open a PR with: task ID, purpose, exact base SHA, changed paths, evidence, tests actually run, results, limitations, approvals required and explicit non-claims.
- Default PR target is `main`. A stacked PR is allowed only when CH-1 records the dependency, parent PR and exact base SHA in the PR description and authority register.
- No direct commits to `main`. No merge, squash, rebase, deployment or pilot without the required review and explicit PM authorization.
- Preserve superseded artifacts and history. Never delete, rename, overwrite, or mark obsolete without a recorded CH-1/PM disposition.

## 4. Roles

- **PM / Product Owner:** Owns business/product decisions and grants or withholds implementation, testing, deployment and pilot authorization.
- **CH-1 — Project Lead & Chief Reviewer:** Maintains the authority index, resolves source conflicts, accepts/rejects project baselines, controls gates, reviews scope and evidence, and recommends decisions to PM. CH-1 acceptance does not replace PM authorization.
- **CH-2 — Product & UX Lead:** Produces product/UX requirements from PO decisions; cannot invent or change PO policy. Submits versioned documents through PR for CH-1 review.
- **CH-3 — Engineering / Implementation:** Performs only explicitly authorized engineering tasks. Must preserve provenance, scope and approved architecture; cannot self-approve designs or tests.
- **CH-4 — Independent QA Reviewer:** Independently reviews exact immutable candidate commits and reports evidence-based results. QA planning, source review, browser tests, native Android tests and production/pilot acceptance are distinct activities. CH-4 cannot authorize implementation or change the baseline.

## 5. Approval and execution gates

- PO decision approval, CH-1 document review, architecture approval, implementation authorization, QA planning approval, QA execution authorization, QA acceptance, merge approval, deployment approval and pilot GO are separate gates.
- A document's presence in GitHub, a worker's completion claim, a green static check, or a draft PR is not approval.
- Never run code, SQL, migrations, database writes, builds, tests, browser regression, native runtime QA, deployment or pilot unless the PM's explicit authorization covers that exact activity and scope.
- Existing task-specific restrictions remain in force. This governance document does not widen them.

## 6. Versioning and evidence

- Every reviewed artifact is identified by repository path, Git commit SHA and blob SHA. For binary/HTML artifacts, record a cryptographic file hash (e.g. SHA-256) in addition to Git identity when required.
- Approved baselines are immutable. Any correction creates a new version/path and a new commit; it must not silently replace an accepted artifact.
- Evidence must identify environment, exact command/action, date/time, source commit, output, limitations and whether the result is static, simulated, browser-runtime, native-runtime, database-runtime or production evidence.
- Use only PASS, FAIL, BLOCKED, NOT EXECUTED, NOT VERIFIED, or other explicitly defined dispositions. Do not convert BLOCKED/NOT EXECUTED into PASS.

## 7. Current project authority

Read `PROJECT_SOURCE_OF_TRUTH.md` for the audited repository state, current workstream map, exact refs and unresolved gaps. This worker instruction is mandatory but is not itself approval of any project design, implementation or test.

**Governance activation record:** PR #21 was approved and merged into `main`. Merge commit / main HEAD at activation: `3abd0455a7755208049da310f85aab930e9f4200`. The active governance documents at that merge commit were `/WORKER_SINGLE_SOURCE_OF_TRUTH.md` (blob `ee6588a85af954128c0b1d0ce2ddd7417ce0b6e9`) and `/PROJECT_SOURCE_OF_TRUTH.md` (blob `d94b368a42ebe87e6787c7fd62c1256294e611e4`). This activation record does not authorize implementation, QA execution, database operations, builds, deployment, APK distribution or pilot activity.
