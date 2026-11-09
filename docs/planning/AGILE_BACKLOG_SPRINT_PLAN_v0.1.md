# DokanTools — Agile Backlog & Sprint Plan v0.1

**Date:** 2026-11-09  
**Status:** **Sprint 0 APPROVED by PM (user confirmation in ChatGPT on 2026-11-09); Sprint 1+ remain PROPOSED.**  
**Planning basis:** Available project memory + GitHub PR #2–#13 metadata. Confirm requirements against authoritative PR/spec files before treating stories as READY.  
**Authorization boundary:** Approval applies to Sprint 0 planning/coordination and documentation activities only. It does not authorize M0-01 implementation, QA execution, merge, production/pilot, or gate closure.

## Agile rules

- Estimation: relative **Fibonacci story points** (1, 2, 3, 5, 8, 13).
- Points represent complexity, uncertainty, dependencies, and effort—not hours or days.
- Sprint length proposed: **2 weeks** for future execution sprints. Sprint 0 is a **1-week baseline/closure sprint**.
- Story assignment is a proposed CH owner, not a personal/individual developer assignment.
- Definition of Done (DoD): acceptance criteria satisfied; relevant docs/code in GitHub; review completed; test evidence linked; no unapproved scope change; status and next step updated.
- For documentation/design stories, DoD means approved/reviewed artifact—not implementation.
- `BLOCKED` stories do not count as Done. A story can be closed only with evidence and the required reviewer disposition.

## Epics

| Epic | Description | Priority |
|---|---|---|
| E0 | Project governance, continuity, and backlog control | P0 |
| E1 | M0-01 financial/data integrity remediation and gate closure | P0 / release blocker |
| E2 | Shop setup and item/menu foundation | P1 |
| E3 | Offline sales and Bangla invoice | P1 |
| E4 | Local inventory, cancellation, and stock restoration | P1 |
| E5 | QR, print/share, and invoice output | P1 |
| E6 | QA, security, release readiness, and pilot gate | P0 / release blocker |

## Sprint 0 — Baseline & unblock (1 week; PM-approved)

**Goal:** Establish reliable project record, review current M0-01 remediation, and make local MVP backlog sprint-ready. Do not begin unapproved implementation.

| ID | Story | Owner | SP | Priority | Acceptance / exit criteria | Status |
|---|---|---|---:|---|---|---|
| DT-001 | Review and approve/revise session handoff + governance rules | CH-1 | 2 | P0 | PM disposition recorded; handoff file linked; PR #13 reviewed | IN REVIEW |
| DT-002 | Review M0-01 R2.6 against CH-4 R2.5 high findings | CH-1 + CH-4 | 5 | P0 | Finding-by-finding traceability; each finding CLOSED/PENDING with evidence; no unsupported closure claims | READY |
| DT-003 | Produce product backlog with scope and story acceptance criteria | CH-2 | 5 | P0 | Epics, story IDs, acceptance criteria, dependencies, non-goals, PO decisions and open questions captured | IN PROGRESS |
| DT-004 | Map M0-01 requirements/PO decisions to QA coverage | CH-4 | 5 | P0 | Traceability to PO decisions, risks, and proposed tests; test execution explicitly NOT EXECUTED | READY |
| DT-005 | Validate repo baseline, PR inventory, and project architecture references | CH-1 + CH-3 | 3 | P0 | Latest main SHA, open PRs, authoritative spec links and architecture decisions recorded | READY |
| DT-006 | Establish Sprint/Story Register and session handoff update workflow | CH-1 | 2 | P0 | GitHub tracking file exists; statuses/owner/points/dependencies/next action defined | READY |

**Sprint 0 total: 22 SP — PM-approved.** This is an approved plan, not a promise that all 22 points will be completed. No historical velocity is available; review capacity and carryover at Sprint Review.

## Proposed Sprint 1 — M0-01 design closure + local MVP foundation

**Goal:** Close the design/review loop for M0-01 and complete approved MVP foundation requirements. No production/pilot work.

| ID | Story | Owner | SP | Priority | Dependency | Acceptance / exit criteria | Status |
|---|---|---|---:|---|---|---|---|
| DT-101 | Resolve CH-4 high findings in M0-01 design | CH-3 | 8 | P0 | DT-002 | Each high finding addressed in exact design revision; change log and evidence; no runtime PASS claim | BLOCKED pending DT-002 |
| DT-102 | Independent QA review of corrected M0-01 design | CH-4 | 5 | P0 | DT-101 | QA verdict ACCEPT/REVISE; finding dispositions and test requirements documented | BLOCKED |
| DT-103 | PM/PO gate decision: M0-01 design/implementation authorization | PM/PO + CH-1 | 2 | P0 | DT-102 | Explicit written decision: design accepted? implementation authorized? scope and restrictions recorded | BLOCKED |
| DT-104 | Finalize shop setup requirements and UX acceptance criteria | CH-2 | 3 | P1 | DT-003 | Required fields, validation, empty/error states, persistence, UX decisions and acceptance tests approved | READY |
| DT-105 | Finalize item/menu requirements and data model | CH-2 + CH-3 | 5 | P1 | DT-003 | Item fields, unit/price/availability, local persistence, constraints and acceptance criteria documented | READY |
| DT-106 | Define SQLite/local data model and migration strategy for approved MVP | CH-3 | 5 | P1 | DT-104, DT-105 | Schema, IDs, constraints, migration/recovery, data ownership and review documented | BLOCKED pending specs |
| DT-107 | CH-4 test design for shop setup + item/menu | CH-4 | 3 | P1 | DT-104, DT-105 | Positive/negative/boundary/persistence test cases linked to criteria; execution status clear | BLOCKED pending specs |

**Sprint 1 total: 31 SP.** Too large for a first 2-week commitment without known velocity. Treat as candidate backlog; pull only after Sprint 0 and split large stories.

## Candidate Sprint 2 — Core local sale / invoice (after Sprint 1 and approval)

| ID | Story | Owner | SP | Priority | Dependency | Acceptance / exit criteria |
|---|---|---|---:|---|---|---|
| DT-201 | Implement shop setup in local app | CH-3 | 5 | P1 | DT-104, DT-106; implementation authorization | Create/read/edit flows, validation, persistence and errors meet approved AC |
| DT-202 | Implement item/menu management | CH-3 | 8 | P1 | DT-105, DT-106; implementation authorization | Create/edit/list/archive or approved item lifecycle; data persists locally |
| DT-203 | Define and implement offline sale/cart flow | CH-2 + CH-3 | 8 | P1 | Shop/items accepted; approved implementation | Quantity/price/total calculation; no cloud dependency; exact AC and evidence |
| DT-204 | Generate Bangla invoice from completed sale | CH-3 | 8 | P1 | DT-203 | Bangla invoice fields and totals match sale record; invoice ID and persistence defined |
| DT-205 | QA core sale/invoice workflow | CH-4 | 5 | P1 | DT-201–204 | Independent test execution only when authorized; evidence and defects recorded |

## Candidate Sprint 3 — Stock, cancellation, and output

| ID | Story | Owner | SP | Priority | Dependency | Acceptance / exit criteria |
|---|---|---|---:|---|---|---|
| DT-301 | Local stock tracking and sale decrement | CH-3 | 8 | P1 | Item + sale flows | Stock change atomic with sale; no negative stock unless PO explicitly permits |
| DT-302 | Sale cancellation and stock restoration | CH-3 | 8 | P1 | DT-301 | Cancellation is idempotent; stock restored exactly once; audit/history rules approved |
| DT-303 | Bill QR generation | CH-3 | 3 | P1 | Invoice format decision | QR payload/version/encoding defined; generated QR verifies against invoice |
| DT-304 | Print/share invoice output | CH-3 | 5 | P1 | DT-204, DT-303 | Output format/device behavior approved and verified; failure handling defined |
| DT-305 | Independent stock/cancel/QR/print QA | CH-4 | 8 | P1 | DT-301–304 | Test cases executed with approved environment; defect dispositions recorded |

## Candidate Sprint 4 — Hardening and controlled release readiness

| ID | Story | Owner | SP | Priority | Dependency | Acceptance / exit criteria |
|---|---|---|---:|---|---|---|
| DT-401 | End-to-end regression and data-integrity verification | CH-4 | 8 | P0 | Prior sprint stories accepted | Traceable test evidence; no open critical/high defects |
| DT-402 | Offline/restart/recovery and migration checks | CH-3 + CH-4 | 5 | P0 | Local DB and transaction flows | Data survives app restart; recovery/migration behavior verified |
| DT-403 | Security/privacy review for local MVP | CH-4 | 5 | P0 | MVP feature-complete | Data exposure, permissions, logs, backup/export risks reviewed |
| DT-404 | Release candidate package and release notes | CH-3 | 3 | P1 | QA gate + PM authorization | Build provenance, version, hash, release notes, known issues |
| DT-405 | PM/PO release/pilot decision | PM/PO + CH-1 | 2 | P0 | M0-01 gate, QA, security, release evidence | Written GO/NO-GO; pilot remains prohibited until explicit GO |

## Current assignment board (Sprint 0)

| CH | Immediate responsibility | Output | State |
|---|---|---|---|
| CH-1 | Review PR #12 against PR #11 findings; maintain status and dependencies | Review/disposition + gate register | ACTION |
| CH-2 | Build prioritized MVP product backlog, acceptance criteria, PO decision list | Product Backlog v0.1 | IN PROGRESS |
| CH-3 | Do not start M0-01 implementation; respond to design findings after CH-1/CH-4 review. Prepare local MVP technical design only within approved scope | M0-01 revision plan / technical design | BLOCKED / DESIGN ONLY |
| CH-4 | Independently map PR #11 findings to R2.6; define test/acceptance coverage | QA finding closure matrix | ACTION |
| PM/PO | Confirm priority/scope, resolve decisions, approve next phase/gates | Written PO/PM decision | REQUIRED |

## Critical dependencies and release blockers

1. M0-01 design not accepted; PR #11 high finding closure is mandatory.
2. M0-01 implementation authorization is not granted in current recorded status.
3. Product requirements/acceptance criteria must be frozen before implementation stories are READY.
4. No production DB mutation, real customer data, live financial pilot, or deployment without separate explicit PM authorization.
5. QA plan/test design is not QA execution. No test is PASS without execution evidence.
6. Story points are initial estimates; refine after CH-2 specification and CH-4 risk review.

## Sprint review / tracking template

At sprint start: sprint goal, selected story IDs, points, owner, dependencies, authorization, expected evidence.  
At sprint end: each story `DONE / NOT DONE / BLOCKED`, PR/commit/evidence, accepted/rejected disposition, actual points completed, carryover reason, new blockers, next sprint recommendation.

## Approval / governance note

**PM approval recorded for Sprint 0 (22 SP) only.** Sprint 1+ remain proposed backlog and require planning/refinement and approval before commitment. This approval does not authorize implementation, QA execution, M0-01 gate closure, merge, production DB changes, real customer data, deployment, or live pilot.
