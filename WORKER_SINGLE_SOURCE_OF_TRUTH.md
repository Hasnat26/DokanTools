# DokanTools — Mandatory Worker Instructions

**Repository:** `Hasnat26/DokanTools`  
**First-read file:** `WORKER_SINGLE_SOURCE_OF_TRUTH.md` (this file)  
**Authority register:** `PROJECT_SOURCE_OF_TRUTH.md`  
**Governance status:** SUBMITTED — NOT ACTIVE UNTIL MERGED INTO `main` WITH PM APPROVAL

## 1. Mandatory start-of-work protocol

Every worker, including CH-1, CH-2, CH-3, CH-4 and any external/AI support worker, MUST:

1. Open this file from the exact GitHub branch/commit assigned to the task.
2. Read `PROJECT_SOURCE_OF_TRUTH.md` from that same commit.
3. Identify the workstream's exact authoritative baseline path, version, Git commit SHA and document/blob SHA from the register.
4. Confirm that the baseline status permits the requested activity. A SUBMITTED, PENDING, REJECTED, SUPERSEDED or NOT ESTABLISHED artifact is not an approved baseline.
5. Record in the task/PR description: repository, source branch/ref, source commit SHA, exact files and blob SHAs, task ID, authorized scope and exclusions.
6. If any required baseline is missing, contradictory, stale, or not approved, STOP and report the gap to CH-1. Do not choose a convenient alternative.

**Never start from a chat attachment, local download, ZIP, email, personal copy, worker-generated export, or unreferenced branch.** GitHub is the only project record. Local clones may be used as working copies only when their exact source commit is recorded; they are never independent authorities.

## 2. Single source and precedence

`PROJECT_SOURCE_OF_TRUTH.md` is the project-level authority index. It identifies exact workstream sources and their governance status. The linked source document at its stated commit is authoritative only within the scope and status explicitly recorded.

Precedence:
1. PM's explicit written authorization and decisions.
2. PO-approved product decisions, as recorded in an accepted GitHub decision record.
3. CH-1 accepted project baseline/authority register and approved scope-specific baselines.
4. Approved technical/design/QA documents within their defined scope.
5. Submitted PRs and draft documents are proposals only.
6. Worker notes, chat summaries, local files and undocumented assumptions have no authority to change the baseline.

If sources conflict, do not resolve by silently taking the newest timestamp, branch, or version number. Stop; identify the exact conflict and ask CH-1/PM for a recorded disposition.

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

- **PM / Product Owner:** Owns product/business decisions and grants or withholds implementation, testing, deployment and pilot authorization.
- **CH-1 — Project Lead & Chief Reviewer:** Maintains the authority index, resolves source conflicts, accepts/rejects project baselines, controls gates, reviews scope and evidence, and recommends decisions to PM. CH-1 acceptance does not replace PM authorization.
- **CH-2 — Product & UX Lead:** Produces product/UX requirements from PO decisions; cannot invent or change PO policy. Submits versioned documents through PR for CH-1 review.
- **CH-3 — Engineering / Implementation:** Performs only explicitly authorized engineering tasks. Must preserve provenance, scope and approved architecture; cannot self-approve designs or tests.
- **CH-4 — Independent QA Reviewer:** Independently reviews exact immutable candidate commits and reports evidence-based results. QA planning, source review, browser tests, native Android tests and production/pilot acceptance are distinct activities. CH-4 cannot authorize implementation or change the baseline.

## 5. Approval and execution gates

- PO decision approval, CH-1 document review, architecture approval, implementation authorization, QA execution authorization, QA acceptance, merge approval, deployment approval and pilot GO are separate gates.
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

**If the required project authority documents are not present on `main`, this governance baseline remains SUBMITTED and must not be represented as globally active until PM approval and merge.**
