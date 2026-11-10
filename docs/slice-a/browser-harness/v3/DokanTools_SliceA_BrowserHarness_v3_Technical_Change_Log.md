# DokanTools Slice A Browser Harness v3 — Technical Change Log

**Task ID:** DT-CH3-SLICE-A-BROWSER-HARNESS-FIX-003  
**Authority:** CH-1 — Limited QA-F01 remediation authorization  
**Baseline:** `DokanTools_SliceA_BrowserHarness_v2.html` from `DokanTools_SliceA_BrowserHarness_v2_Submission(2).zip`  
**Output:** `DokanTools_SliceA_BrowserHarness_v3.html`  
**Date:** 10 November 2026  
**Scope:** Standalone Browser Harness only  
**Status:** CH-3 remediation and isolated verification completed; CH-1 review pending

## 1. Defect addressed

**QA-F01:** A save-time storage read failure preserves an unsaved draft. If a subsequent Retry finds an existing valid profile, v2 executes `pendingDraftAfterReadFailure = null` and renders the saved profile. The unsaved draft is silently discarded.

The v2 source archive and embedded HTML were inspected. The embedded v2 HTML SHA-256 is `6072d8d16b3e3c534774a040c1ad108049db456d99733303b7cf325c93ae476c`.

## 2. Changes implemented

| Area | v3 change | Safety property |
|---|---|---|
| Retry → valid profile | If a pending draft exists, show a dedicated recovery-conflict view instead of clearing the draft or immediately returning to the saved-profile view. | Neither version is written or discarded by Retry. |
| Conflict presentation | Display the existing saved profile and preserved unsaved draft in separate labelled panels. | User can distinguish saved data from unsaved data. |
| Review Draft | Load the preserved draft into the form, label it as review, and change the form action to `Continue to Update Confirmation`. | Review itself performs no storage write. |
| Discard Draft | Explicit action clears only the pending in-memory draft and returns to the unchanged saved profile. | Discard is user-initiated; no saved profile write/delete. |
| Update confirmation | Submitting a reviewed draft stages values and opens a separate confirmation dialog. Only `Confirm Update` can write the update. `Keep Draft — Do Not Save` closes the dialog without writing. | Explicit second confirmation required. |
| Saved-profile concurrency guard | Before confirmed update, re-read storage and compare the raw saved-profile snapshot with the snapshot shown to the user. | A changed or missing saved profile blocks stale overwrite. |
| Read failure during review/confirmation | Capture the latest form values into the pending draft before entering the load-failure state. | Latest user edits survive subsequent Retry/failure cycles. |
| Retry → empty storage | Restore the preserved draft into the create form without saving. A later explicit Save creates the profile. | Retry remains read-only; no silent data loss. |
| Repeated Retry/read failures | Keep the pending draft in memory through each failure and Retry result. | No automatic pending-draft cleanup on a read failure. |

## 3. State-transition summary

| Current state | Storage read result | Pending draft | v3 transition | Storage write |
|---|---|---|---|---|
| Save form | Failure | Captured from current form | Load-failure view | None |
| Load failure | Failure on Retry | Present | Remain in load-failure view; preserve draft | None |
| Load failure | Valid profile on Retry | Present | Recovery-conflict view; show saved and draft separately | None |
| Recovery conflict | User selects Review Draft | Present | Review form; no write | None |
| Review form | Submit; saved snapshot unchanged | Present | Update-confirmation dialog | None |
| Update-confirmation dialog | User selects Keep Draft | Present | Return to review form | None |
| Update-confirmation dialog | User selects Confirm Update; snapshot unchanged | Present | Re-read and write updated profile; clear draft only after successful write | One explicit update write |
| Update-confirmation dialog | Read failure / empty / changed snapshot | Present | Failure/recovery view; retain draft; block update | None |
| Load failure | Empty storage on Retry | Present | Restore draft in create form | None |
| Recovery conflict | User selects Discard Draft | Explicitly discarded | Return to existing saved profile | None |

The pending draft is cleared only after an explicit Discard action or a successful explicit Save/confirmed Update. No Retry branch clears it.

## 4. Baseline and invariant preservation

- Existing localStorage key retained: `dokantools.sliceA.browserHarness.shopProfile.v1`.
- Singleton profile ID retained: `primary`.
- No `localStorage.removeItem()` or `localStorage.clear()` introduced.
- No `maxlength` attributes or new field-length limits introduced.
- Existing mobile validation allow-list and Create/Edit discard behavior retained from v2.
- No change to approved Slice A UX requirements; recovery controls are limited to handling the QA-F01 failure/recovery path.

## 5. Verification

- Actual v3 inline JavaScript syntax check: PASS (`node --check`).
- HTML parser check: PASS; 44 IDs, no duplicate IDs; one inline script.
- Targeted QA-F01 state-transition tests: 9/9 PASS in Node.js VM with controlled DOM/localStorage test doubles. See `DokanTools_SliceA_BrowserHarness_v3_Static_Check_Report.md`.
- Chrome/browser runtime: NOT EXECUTED. No browser runtime PASS is claimed.
- CH-4 BH-R01–BH-R30 browser regression: NOT EXECUTED by CH-3; independent retesting is not yet authorized pending CH-1 review.

## 6. Output integrity

**HTML size:** 27,936 bytes  
**SHA-256:** `62b2bbe7b051314b0612458dd4dc4640234b84a42a9c336a686931f8b640b734`

## 7. Scope and governance

Only the standalone Browser Harness was modified. No GitHub, Android/Kotlin/Jetpack Compose, APK, database, deployment, pilot, or Slice B work was performed. This is a CH-3 remediation submission for CH-1 review, not final acceptance. The Browser Harness acceptance gate remains OPEN pending CH-1 review and subsequent CH-4 independent browser regression authorization.