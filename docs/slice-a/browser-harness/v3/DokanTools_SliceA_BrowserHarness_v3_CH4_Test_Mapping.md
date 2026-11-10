# DokanTools Slice A Browser Harness v3 — CH-4 Regression Test Mapping

**Task ID:** DT-CH3-SLICE-A-BROWSER-HARNESS-FIX-003  
**Target:** `DokanTools_SliceA_BrowserHarness_v3.html`  
**Baseline:** Submitted v2 HTML from `DokanTools_SliceA_BrowserHarness_v2_Submission(2).zip`  
**Purpose:** CH-4 independent browser regression mapping after CH-1 review  
**CH-3 status:** QA-F01 targeted VM tests 9/9 PASS; browser tests NOT EXECUTED  
**CH-4 status:** NOT EXECUTED — pending CH-1 review/authorization

## A. Existing BH-R01–BH-R30 regression set

The v2 baseline BH-R01–BH-R30 cases remain applicable. CH-4 must execute them against the exact v3 HTML and record browser/OS, date/time, actual result and evidence. The v3 recovery additions do not replace the baseline suite.

| Test ID | Test case | Expected result | CH-4 status |
|---|---|---|---|
| BH-R01 | Create with all three valid fields | One profile saved and displayed | NOT EXECUTED |
| BH-R02 | Empty Shop Name | Rejected | NOT EXECUTED |
| BH-R03 | Whitespace-only Shop Name | Rejected | NOT EXECUTED |
| BH-R04 | Empty Address | Rejected | NOT EXECUTED |
| BH-R05 | Whitespace-only Address | Rejected | NOT EXECUTED |
| BH-R06 | Empty Mobile Number | Rejected | NOT EXECUTED |
| BH-R07 | Valid 7-digit mobile number | Accepted | NOT EXECUTED |
| BH-R08 | Valid 20-digit mobile number | Accepted | NOT EXECUTED |
| BH-R09 | Six-digit mobile number | Rejected | NOT EXECUTED |
| BH-R10 | Twenty-one-digit mobile number | Rejected | NOT EXECUTED |
| BH-R11 | Mobile number containing period | Rejected | NOT EXECUTED |
| BH-R12 | Mobile number containing tab | Rejected | NOT EXECUTED |
| BH-R13 | Mobile number containing line break | Rejected | NOT EXECUTED |
| BH-R14 | Mobile number containing letters | Rejected | NOT EXECUTED |
| BH-R15 | Valid plus, ordinary spaces, hyphens and parentheses | Accepted | NOT EXECUTED |
| BH-R16 | Read previously saved profile | Correct values displayed | NOT EXECUTED |
| BH-R17 | Edit form prefill | All saved values prefilled | NOT EXECUTED |
| BH-R18 | Edit without changes, then Cancel | Return directly to saved profile | NOT EXECUTED |
| BH-R19 | Edit with changes, then Cancel | Discard confirmation displayed | NOT EXECUTED |
| BH-R20 | Select Keep Editing | Changes remain in form | NOT EXECUTED |
| BH-R21 | Select Discard | Original saved profile remains unchanged | NOT EXECUTED |
| BH-R22 | Update valid profile through ordinary Edit flow | Existing profile updated | NOT EXECUTED |
| BH-R23 | Update invalid profile | Existing saved profile unchanged | NOT EXECUTED |
| BH-R24 | Refresh browser after save | Saved profile remains available | NOT EXECUTED |
| BH-R25 | Simulate localStorage write failure | Error shown; entered values retained | NOT EXECUTED |
| BH-R26 | Simulate localStorage read failure | Load-failure state, not Empty State | NOT EXECUTED |
| BH-R27 | Malformed stored JSON | Not silently treated as a new empty profile | NOT EXECUTED |
| BH-R28 | Repeated Save or update | One profile remains represented under fixed key/ID | NOT EXECUTED |
| BH-R29 | Create form Cancel without input | Return directly to Empty State | NOT EXECUTED |
| BH-R30 | Create form Cancel with unsaved input | Discard confirmation displayed | NOT EXECUTED |

## B. QA-F01 targeted recovery regression

The following nine tests are required for CH-4 browser execution. The `CH-3 isolated test` column records the implementation-level test result only; it is not a browser result.

| Test ID | Scenario / steps | Expected result | CH-3 isolated test | CH-4 browser status |
|---|---|---|---|---|
| QA-F01-T01 | Save-time read failure preserves draft; Retry then returns valid existing profile | Recovery-conflict view shows saved profile and draft separately; no write or draft clear | PASS | NOT EXECUTED |
| QA-F01-T02 | Select Review Draft | Draft appears in review form; storage and saved profile remain unchanged | PASS | NOT EXECUTED |
| QA-F01-T03 | Review, modify draft, submit | Separate update-confirmation dialog appears; submit alone does not update storage | PASS | NOT EXECUTED |
| QA-F01-T04 | Select Keep Draft / do not confirm | Dialog closes; current draft remains in review form; no write | PASS | NOT EXECUTED |
| QA-F01-T05 | Select Confirm Update after unchanged-snapshot re-read | Existing profile updates once using reviewed values; pending draft clears only after successful write | PASS | NOT EXECUTED |
| QA-F01-T06 | Select Discard Draft from conflict | Pending draft is discarded only after explicit action; unchanged saved profile is displayed | PASS | NOT EXECUTED |
| QA-F01-T07 | Save-time read failure; Retry returns empty storage | Draft restored in create form; Retry does not save; explicit Save creates profile | PASS | NOT EXECUTED |
| QA-F01-T08 | Repeated Retry failures; failure during draft review or final confirmation | Latest draft values remain available through all failure/retry transitions; saved profile unchanged | PASS | NOT EXECUTED |
| QA-F01-T09 | Change saved profile after conflict but before confirmation | Snapshot mismatch blocks stale update; refreshed saved profile and pending draft are shown separately | PASS | NOT EXECUTED |

## C. CH-3 isolated test evidence

The v3 inline application script was executed in a Node.js VM with a controlled DOM and localStorage test double. Nine targeted scenarios passed. This verifies the exercised application state transitions under the test double, but does not establish actual browser rendering, focus behavior, accessibility, browser storage semantics or cross-tab concurrency.

## D. CH-4 execution evidence to record

- Exact v3 HTML filename and SHA-256.
- Browser name/version and operating system/version.
- Test date/time and execution method (local file or local HTTP server).
- Actual result for BH-R01–BH-R30 and QA-F01-T01–T09.
- Screenshots/logs for QA-F01 conflict, review, discard, update confirmation, empty-storage recovery and repeated failure flows.
- Confirm the saved profile remains byte-for-byte unchanged until the explicit update confirmation action.
- Record any defect ID, severity, reproduction steps and retest result.
- Do not infer native Android/Room/SQLite behavior from browser results.