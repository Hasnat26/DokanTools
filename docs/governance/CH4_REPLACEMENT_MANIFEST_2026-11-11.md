# Immutable manifest-freeze addendum

- Manifest ID: `DT-MVP-CH4-REPLACEMENT-2026-11-11-01`
- Freeze timestamp: `2026-11-11T03:51:47.281Z`
- Exact manifest body encoding: UTF-8
- Exact manifest body byte count: 5228
- SHA-256 over the exact manifest body bytes below (including its final LF): `cdf50db4f095ce30735368a311248ed7de722419722263e3d741806dfce3356c`
- Prior manifest: `DT-MVP-CH4-FROZEN-2026-11-10-01`, Issue #27 comment `6766702882`; invalidated and superseded, not altered.
- Evidence locator: this file's Git commit/blob are recorded in the Issue #27 publication envelope outside the hashed body to avoid a self-referential Git-object identity.

---

# CH-4 REPLACEMENT STATIC REVIEW MANIFEST — DokanTools Invoice-First MVP

Manifest ID: DT-MVP-CH4-REPLACEMENT-2026-11-11-01
Freeze timestamp: 2026-11-11T03:51:47.281Z
Freeze authority: CH-1 Project Lead & Chief Reviewer
Status: FROZEN — STATIC DESIGN / DOCUMENTATION REVIEW ONLY
Supersedes: DT-MVP-CH4-FROZEN-2026-11-10-01 (Issue #27 comment 6766702882), INVALIDATED because PR #30 and PR #33 moved after that freeze.
Repository: Hasnat26/DokanTools

## 1. Scope and authority

CH-4 is authorized only to perform the focused static verification listed in the companion CH-1 commissioning comment on Issue #27. This manifest pins the exact source artifacts for that verification. It does not authorize code execution, builds, lint, tests, database access, browser/PDF/runtime/security QA, merge, deployment, release or pilot.

## 2. Immutable source identities

| Artifact | Exact identity |
|---|---|
| Main baseline | `9edc10e0a5e8f2e8c9e9a043870b13cd7ecb7bc1` |
| Main Worker SSOT | `WORKER_SINGLE_SOURCE_OF_TRUTH.md` — blob `5714e127aad7a81d3e26da2ac2d77fe875927fdc` |
| Main Project SSOT | `PROJECT_SOURCE_OF_TRUTH.md` — blob `0a2534fd67ebf5d1c3094faf147cdfa4b2cb73a5` |
| PO-confirmed invoice mockup | `docs/decisions/PO_CONFIRMED_INVOICE_MOCKUP.md` — blob `efe0d261c50a4cfc706e82c832a6f052c676127c` |
| PR #30 UX v0.3 | HEAD `ae2746b8b35cb369fdd4d6b31e792fa9b9281b3f`; file `docs/ux/INVOICE_FIRST_WEB_MVP_OWNER_CUSTOMER_UX_v0.1.md`; blob `b5c176de5badf5ec7d85bdb1b530e8aa3c083b97` |
| PR #33 technical v0.4.2 | HEAD `5b1d94df904d65e25cca77d4119f5632891a0d9c`; file `docs/design/INVOICE_FIRST_WEB_MVP_TECHNICAL_DESIGN_v0.2.md`; blob `57538180766ecbccf8d8232ccca4448cf6a42591` |
| PR #32 governance / Phase A1 | HEAD `f89d630025dc98a3b09b5a6401fe990edd74b560`; file `PROJECT_SOURCE_OF_TRUTH.md`; blob `9d151e679cbccff46531c217f095f2d18e11ec09` |
| PR #34 final CH-4 report | HEAD `de39c00432ac1267e37601c01b2d9b83eda2f670`; file `docs/qa/INVOICE_FIRST_MVP_STATIC_DESIGN_ASSURANCE_2026-11-10.md`; blob `1667d9fb084b6ba60fc18eef3fb746e0f5b8cfb7` |

## 3. Review status and authority qualifications

- PR #34 is the completed full CH-4 static report for the earlier 10 November freeze. Its dispositions apply to those exact earlier candidates: PR #30 ACCEPT WITH CONDITIONS, PR #33 NEEDS REVISION, PR #32 NEEDS REVISION. This replacement manifest does not silently convert those dispositions into acceptance of later revisions.
- PR #30 v0.3 corrects UX-42 and UXAT-42: Generated preview is informational; acknowledgement/confirmation is not required; normal invoice use is not blocked if preview is not inspected.
- PR #30 menu-lifecycle P2 comment `4523203685`, thread `PRRT_kwDOVhBFWs61okrS`, was resolved by CH-1 after review of v0.3. GitHub state at freeze: resolved=true, outdated=true. PO-06 remains pending; menu lifecycle is not PO-approved.
- PR #33 v0.4.2 re-pins the operative UX source to PR #30 v0.3 and maps UX-40..UX-71. It is submitted for CH-1 / focused CH-4 verification; it is not yet accepted by CH-1 or CH-4.
- PR #32 §12.13 is the controlling authority register. It records the A1-01 phone grammar correction and A1-02 field-level validation/save/acceptance traceability. A1 remains separate from Invoice-First and implementation is not authorized.
- PR #28 technical v0.2 (HEAD `2b1e0be89e2487bedf841dbc8247d646529ae7cc`, blob `348ec933a2798ba2c790707397d723e8377a8442`) is preserved as historical/superseded for current technical review only.
- Issue #31 has no PO-authored approval response in the reviewed history. PO-02, PO-04, PO-05, PO-06, PO-11, PO-12, PO-I11, PO-I06A, PO-L01, PO-L02, PO-L03 and PO-L04 remain PENDING-PO.

## 4. Focused CH-4 verification scope

Verify only the following against the exact identities in §2:
1. UX-42 and UXAT-42 wording and traceability.
2. CH4-DES-01 Generated default / informational preview consistency.
3. CH4-DES-02 profile/header concurrency protocol.
4. CH4-DES-03 public QR release gating.
5. CH4-DES-04 PDF font / renderer reproducibility gate.
6. CH4-DES-05 historical versus current CH-1 acceptance/status wording.
7. CH4-UX-01 preview semantics.
8. CH4-GOV-01 current governance source references.
9. CH4-A1-01 mobile validation grammar.
10. CH4-A1-02 profile field-level acceptance traceability.
11. CH4-OBS-01 IndexedDB outbox privacy lifecycle.
12. PR #34 manifest-hash P2 correction and exact content digest evidence.

CH-4 must report each item as CLOSED (with exact evidence), OPEN (with exact remaining work), PO-GATED, RUNTIME-GATED or SUPERSEDED (with exact authority/evidence). This is a focused closure verification, not a repeat of the full design review.

## 5. Strict non-authorization

NOT AUTHORIZED: application source changes; SQL/schema/RPC/migrations; live/staging/production DB access or mutation; storage/KMS/secret configuration; dependency/environment changes; builds/lint/tests; browser/PDF/runtime/security QA; merge; deployment; release; APK; financial or customer pilot.

No PO decision is approved by this manifest. All PRs #30, #32, #33 and #34 remain open/unmerged. Exact artifact identities are immutable for this review; any movement invalidates this manifest and requires CH-1 to publish a new manifest.

---

The SHA-256 above covers only the exact manifest body between the separators, not this addendum metadata or separators. The body is reproduced verbatim in the immutable Issue #27 freeze comment; the comment also records this file's commit/blob as an evidence locator.
