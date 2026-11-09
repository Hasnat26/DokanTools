# DokanTools — Session Continuity / Project Handoff

**Record type:** Working project handoff  
**Date:** 2026-11-09  
**Status:** DRAFT / SUBMITTED FOR PM REVIEW — not merged or gate-approved  
**Purpose:** Make a new ChatGPT/CH session able to resume from GitHub without depending on previous chats.

> This is a coordination snapshot, not proof that an item is approved, implemented, tested, or released. “Reported” means not independently verified in this record.

## 1. Project and repository

- Repository: [Hasnat26/DokanTools](https://github.com/Hasnat26/DokanTools) (private)
- Default branch: `main`
- GitHub is the durable source of project status, approved decisions, artifacts, evidence pointers, and work tracking.
- ChatGPT/CH sessions do **not** automatically sync to GitHub.
- Current recorded project stream includes invoice-first MVP planning and M0-01 reliability remediation. Do not substitute the separate Android-only Shop Profile context for this repository's active scope.

## 2. Product direction / authorized scope

**Recorded product direction (as of 2026-11-04):** invoice-first local MVP, including:
- Shop setup
- Menu/items
- Offline sale
- Bangla invoice
- Bill QR
- Local stock/sales
- Cancellation and stock restoration
- Printing/sharing

**Architecture direction previously recorded:** React Native + Expo + TypeScript + SQLite; retain Next.js web client and Supabase backend/shared domain logic; offline-first sync is future work. Verify current approved architecture/spec artifacts before implementation; this is a historical context summary, not a substitute for the exact decision record.

**Limited PO approval previously recorded:** local MVP development may proceed in parallel with M0-01 under the approved scope. No production deployment, production/pilot use, real customer data, or production DB changes. M0-01 gate remains mandatory.

## 3. Current high-priority stream — M0-01 remediation

GitHub PR history is the current repository evidence:
- PR #12: CH-3 M0-01 Remediation Design R2.6, documentation-only; CH-1/CH-4 review required.
- PR #11: CH-4 QA review of R2.5, **NEEDS REVISION — HIGH**.
- PR #10: M0-01 R2.5 design candidate.
- PR #2–#9: prior design revisions/reviews.
- PR #13: this session-continuity handoff draft.

**M0-01 status:** design remediation/review not yet accepted; implementation approval NOT GRANTED; financial pilot NO-GO; runtime/database verification NOT EXECUTED. PR #12 does not imply design closure or implementation authorization.

## 4. Governance roles

- **CH-1 — Project Lead / Chief Reviewer:** backlog prioritization, coordination, cross-CH dependency management, review/disposition, master register/handoff.
- **CH-2 — Product & UX Lead:** product requirements, UX/specification, PO decisions, acceptance criteria, product backlog.
- **CH-3 — Implementation / Engineering:** source, architecture, implementation and provenance tasks only within explicit authorization.
- **CH-4 — QA Lead:** independent review, test strategy, acceptance coverage, QA execution only when authorized.
- **PM/PO (user):** scope, priority, product decisions, implementation/pilot/release authorization, gate approval.

## 5. Current known statuses

| Work item | Current recorded status | Next action |
|---|---|---|
| M0-01 R2.6 design | PR #12 open / review required | CH-1 and CH-4 review exact head |
| CH-4 R2.5 QA | PR #11 NEEDS REVISION — HIGH | Ensure all high findings addressed and independently verified |
| Local MVP product specs | Partial / needs consolidated backlog | CH-2 create stories and acceptance criteria |
| Local MVP implementation | Limited parallel approval was recorded; confirm exact scope/task authorization before code work | CH-1 map approved specs to implementation stories |
| QA/runtime/database | Not executed unless exact test evidence says otherwise | Do not claim PASS; obtain explicit test authorization |
| Production/pilot | NO-GO / NOT AUTHORIZED | M0-01 gate and PM approval required |

## 6. Safety and authorization boundaries

- No production deployment, real customer data, production DB mutation, or live financial pilot.
- M0-01 implementation approval remains NOT GRANTED until explicit PM gate approval.
- Do not claim tests passed if they are planned, simulated, or not executed.
- Do not merge PRs, close gates, or upgrade statuses without review/evidence and PM approval where required.
- Scope/architecture conflict must be surfaced, not silently reconciled.

## 7. Status vocabulary

`DRAFT` → `SUBMITTED` → `ACCEPTED` (or `REVISE` / `REJECTED`)  
`ACCEPTED` ≠ `AUTHORIZED`; `AUTHORIZED` ≠ `EXECUTED`; `EXECUTED` ≠ `PASS`; `PASS` ≠ release approval.

Use story statuses: `BACKLOG`, `READY`, `IN PROGRESS`, `BLOCKED`, `IN REVIEW`, `DONE` (Done requires defined acceptance criteria/evidence).

## 8. Chat-to-GitHub session continuity

At every meaningful milestone and before switching ChatGPT chats:
1. Record accepted decisions with decision source/date.
2. Record completed work, current status, owner/CH, and PR/commit links.
3. Record work in progress, blockers, dependencies, and next action.
4. Record story points, sprint assignment, and acceptance evidence where applicable.
5. Record authorizations and explicit “not authorized” boundaries.
6. Update this handoff and the sprint/backlog register.

New chat startup:
1. Read this handoff.
2. Read current Sprint/Backlog and relevant PRs/issues.
3. Verify latest main SHA and open PRs.
4. State the baseline and blockers before doing work.
5. Do not rely on chat-only history for approval or status.

## 9. Immediate actions

1. Review PR #12 R2.6 and PR #11 high findings; determine whether R2.6 actually closes them.
2. CH-2 create a prioritized product backlog with acceptance criteria.
3. CH-1 split backlog into sprint-ready stories with dependencies and story points.
4. CH-4 map test strategy to story acceptance criteria; execution remains separately authorized.
5. Keep M0-01 and production/pilot gates fail-closed.

## 10. Evidence limitations

This record consolidates available project memory and GitHub PR metadata as of 2026-11-09. Verify exact product/architecture decisions and current PR states from linked GitHub artifacts. No gate or implementation authorization is changed by this handoff.
