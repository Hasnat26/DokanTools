# DokanTools — Session Continuity / Project Handoff

**Record type:** Working handoff / coordination snapshot  
**Last consolidated:** 2026-11-09  
**Status:** SUBMITTED / WORKING RECORD — not a gate approval  
**Purpose:** Preserve accepted decisions, current work, blockers, and authorization boundaries so a new ChatGPT/CH session can resume without relying on chat history.

> This file is a continuity record, not a substitute for formal PO/PM approval, evidence, or review. A status written here must not be upgraded without supporting evidence and explicit authority.

## 1. Project identity and scope

- Repository: [Hasnat26/DokanTools](https://github.com/Hasnat26/DokanTools)
- Default branch: `main`
- Product slice: native Android Slice A — Shop Profile only.
- Stack baseline reported: Kotlin, Jetpack Compose, Room, MVVM; offline/local create-read-update.
- One shop profile per local installation.
- Out of scope for Slice A: cloud/Supabase/Firebase, invoices, inventory, sales, tax, QR/PDF/print/share, and other unapproved features.

## 2. Confirmed product/UX decisions

- **UX Specification v0.4:** PO-approved (approval limited to UX requirements).
- Required fields: Shop Name, Address, Mobile Number.
- Mobile validation: 7–20 digits; accepted formatting characters are digits, `+`, spaces, hyphens, and parentheses.
- Create/Edit discard confirmation: Keep Editing / Discard.
- UX approval does **not** authorize implementation, source changes, builds, QA execution, APK distribution, or pilot.

## 3. Current governance structure

- **CH-1:** Project Lead / Chief Reviewer; coordination, consolidated status, acceptance/rejection of deliverables, gate recommendation.
- **CH-2:** Product & UX Lead; UX requirements, PO decision tracking, UX-to-QA traceability.
- **CH-3:** Implementation / provenance; source/toolchain/repository evidence and implementation tasks only within explicit authorization.
- **CH-4:** QA; QA planning, readiness, execution only when separately authorized.
- PM/PO approval remains the controlling authority for scope, decisions, and phase/gate transitions.

## 4. Gate / readiness snapshot (as of 2026-11-09)

| Gate | Status | Notes |
|---|---|---|
| G-01 UX v0.4 | PO-APPROVED | UX scope only; no implementation authorization |
| G-02 Provenance | OPEN — BLOCKER | Source ZIP exists; source commit identity and source-to-APK relationship unresolved |
| G-03 Toolchain freeze | OPEN — BLOCKER | Reported configuration exists; reproducibility/freeze not verified |
| G-04 Environment readiness | OPEN — NOT VERIFIED | Evidence not yet sufficient |
| G-05 QA Plan v1.2 | CH-1-approved planning baseline | Planning only; QA cases NOT EXECUTED |
| G-06 Repository governance | OPEN — NOT VERIFIED | Repository control/process not yet independently verified |
| G-07 PO decisions | PARTIAL / OPEN | UX decisions approved; API 26 requirement vs source minSdk 24 conflict unresolved |

**Overall readiness: NOT READY.**

## 5. Source and toolchain evidence currently reported

- Colab source path: `/content/dokantools_export/DokanTools`.
- Source folder reportedly has no `.git`; Git commands return “not a git repository”.
- Reported source config: minSdk 24, compileSdk 35, targetSdk 35, Java 17, AGP 9.1.1, Gradle 9.3.1, KSP 2.2.10-2.0.2, Compose/Kotlin plugin 2.2.10, Room 2.8.5.
- Reported Gradle workaround: `android.disallowKotlinSourceSets=false`.
- **API 26 is the governing PM requirement.** Reported source `minSdk=24` conflicts with it; do not silently change or treat as resolved.
- Reported APK SHA-256: `6ee606ce8c510174ba0f700ce9e7124c11af24ee4f9e824b1dc5b0461afe64c6` — not independently verified here.
- Reported evidence ZIP: `/content/DokanTools_source_evidence_20261105T081251Z.zip`; SHA-256 `86200ba0fbff5282405c2786273a535888c76199387c337c4451dabb6f8a0ebe`; manifest `/content/DokanTools_source_evidence_20261105T081251Z_manifest.json`.
- ZIP hash and source-to-APK correspondence have not been independently verified. Do not claim reproducibility or provenance closure.

## 6. Worker deliverables / progress

### CH-2 — UX-to-QA Traceability Matrix and PO Decision Register
- Reported submitted; CH-1 formal acceptance pending inspection of the actual artifacts.
- Summary identifies coverage gaps UXQA-G01–G12, including discard behavior, Back/keyboard handling, mobile boundary/format validation, inline validation, retry/write failure, reboot persistence, saved profile read-only/edit prefill.
- QA Plan v1.2 reportedly unchanged; no QA execution.

### CH-4 — QA Plan v1.2 Planning-Baseline Maintenance Note + QA Readiness Checklist
- Reported submitted; CH-1 formal acceptance pending.
- Reportedly maps UXQA-G01–G12 and readiness dependencies R-01–R-27.
- QA cases remain PLANNED / NOT EXECUTED.
- No browser regression, APK distribution, or pilot.

### CH-3 — Provenance / toolchain closure addendum
- Last recorded status: awaiting receipt.
- On receipt, review source repo/commit identity, ZIP integrity, APK/source correspondence, toolchain reproducibility, and minSdk/API 26 conflict.

## 7. Authorization boundaries — mandatory

Unless PM gives explicit separate authorization, do **not**:
- modify or reconcile source code;
- create or alter repository implementation branches/PRs/commits beyond explicitly approved documentation-only work;
- build or test the app / execute QA;
- distribute APKs, conduct browser regression, or run a pilot;
- change API/minSdk or any approved baseline.

Read-only evidence inspection and documentation-only coordination may proceed only within the currently approved scope.

## 8. Status vocabulary (do not conflate)

- `SUBMITTED` ≠ `ACCEPTED`
- `ACCEPTED` ≠ `AUTHORIZED`
- `AUTHORIZED` ≠ `EXECUTED`
- `EXECUTED` ≠ `PASS`
- `PASS` ≠ PO/PM approval or gate closure

Use explicit labels: `DRAFT`, `SUBMITTED`, `ACCEPTED`, `ACCEPTED WITH CONDITIONS`, `REVISE`, `REJECTED`, `AUTHORIZED`, `NOT AUTHORIZED`, `PLANNED / NOT EXECUTED`, `EXECUTED`, `PASS`, `FAIL`, `BLOCKED`.

## 9. Chat-to-GitHub continuity rule

- ChatGPT/CH conversations do **not** automatically sync to GitHub.
- GitHub is the durable project record for approved decisions, accepted artifacts, current status, blockers, evidence pointers, and handoff snapshots.
- Each CH should submit its deliverable/status in the coordination thread; CH-1 consolidates it into the project record.
- At each meaningful milestone or before switching chat sessions, update this handoff (or a dated handoff entry) with:
  1. latest accepted decisions and source references;
  2. deliverables submitted/accepted/rejected and by whom;
  3. active work and owner;
  4. blockers/open questions;
  5. current gates and whether work is authorized;
  6. next action and its authorization status;
  7. latest relevant repository commit/PR/evidence links.
- A new chat should start by reading this file and the linked authoritative artifacts, then confirm its baseline before taking action.
- Never rely on an uncommitted chat-only statement as a final project decision.

## 10. Immediate next actions

1. CH-1 review actual CH-2 and CH-4 artifacts and record formal disposition.
2. Receive and review CH-3 provenance/toolchain closure addendum.
3. Resolve API 26 vs source minSdk 24 through explicit PM decision; do not implement the change yet.
4. Keep readiness **NOT READY** until blockers are evidence-closed and PM authorizes the next phase.
5. Establish/update the Project Operating Model, Master Coordination & Gate Register, and Phase/Gate Transition Protocol as documentation-only governance artifacts, subject to PM review.

## 11. Record limitations

This snapshot is compiled from project coordination context available on 2026-11-09. Items described as “reported” or “awaiting review” are not independently verified or formally accepted. When newer evidence is available, update the record with date, source link, author/owner, and disposition; retain historical status rather than silently rewriting it.
