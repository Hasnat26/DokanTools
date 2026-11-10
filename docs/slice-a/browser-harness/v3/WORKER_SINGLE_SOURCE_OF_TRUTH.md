# Slice A Browser Harness v3 — Worker Single Source of Truth

**Status:** SUBMITTED FOR CH-1 FINAL SOURCE REVIEW  
**Implementation status:** FROZEN — NO CHANGE AUTHORIZED  
**CH-4 regression status:** NOT AUTHORIZED / NOT EXECUTED  
**Repository:** `Hasnat26/DokanTools`  
**Submission branch:** `ch1/slice-a-browser-harness-v3-submission`  
**Canonical directory:** `docs/slice-a/browser-harness/v3/`

## 1. Mandatory worker instruction

This file is the single coordination and authority entry point for every worker (CH-1, CH-2, CH-3, CH-4, and any supporting agent) working on Slice A Browser Harness v3.

Before doing any work, each worker MUST read this file from the submission branch and use only the exact artifacts listed below. Do not use downloaded copies, chat attachments, local exports, prior v1/v2 files, duplicated filenames, or worker-created variants as the source of truth.

If any discrepancy is found, STOP and report it against the canonical repository path. Do not silently reconcile, edit, regenerate, rename, or replace an artifact. CH-1 must decide the disposition first.

## 2. Canonical v3 deliverables

All six submission deliverables are stored in this repository directory:

1. [v3 HTML](DokanTools_SliceA_BrowserHarness_v3.html)
2. [Technical Change Log](DokanTools_SliceA_BrowserHarness_v3_Technical_Change_Log.md)
3. [CH-4 Test Mapping](DokanTools_SliceA_BrowserHarness_v3_CH4_Test_Mapping.md)
4. [Static Check Report](DokanTools_SliceA_BrowserHarness_v3_Static_Check_Report.md)
5. [QA-F01 Test Harness](DokanTools_SliceA_BrowserHarness_v3_QA-F01_Test_Harness.cjs)
6. [QA-F01 JSON Output](DokanTools_SliceA_BrowserHarness_v3_QA-F01_Test_Output.json)

No other copy or version is authoritative for this submission.

## 3. HTML identity

- Canonical file: `DokanTools_SliceA_BrowserHarness_v3.html`
- SHA-256: `62b2bbe7b051314b0612458dd4dc4640234b84a42a9c336a686931f8b640b734`
- File size: 27,936 bytes

Any change to the HTML, including whitespace or line-ending changes, creates a different artifact and requires a new SHA-256, updated evidence, and CH-1 review. Never overwrite the submitted v3 HTML in place.

## 4. Authority and change control

- CH-1 final source review is PENDING.
- CH-4 retest authorization is PENDING.
- The QA-F01 harness and JSON output are submitted test evidence only; they do not authorize browser regression execution.
- No implementation changes are authorized by this submission.
- No worker may modify the HTML or other v3 deliverables unless CH-1 identifies a discrepancy and the PM explicitly authorizes a bounded correction.
- If a correction is authorized, create a new versioned submission (v4); preserve v3 unchanged. Update all dependent documentation and hashes, then obtain CH-1 review and separate CH-4 retest authorization.
- Do not merge this submission branch or deploy/pilot anything without explicit PM authorization.

## 5. Worker workflow

1. Read this file first from the canonical branch.
2. Read the six linked artifacts from the same directory and branch.
3. Record findings with exact repository paths, line references, and evidence.
4. Do not create competing baselines, parallel copies, or informal "latest" files.
5. Submit findings to CH-1. Only CH-1 may update this authority document after a recorded decision.

## 6. Current gate state

| Gate | Status |
|---|---|
| v3 package presence in GitHub | SUBMITTED |
| HTML SHA-256 identity | RECORDED |
| CH-1 final source review | PENDING |
| CH-4 retest authorization | PENDING |
| CH-4 browser regression | NOT EXECUTED |
| Browser Harness acceptance | OPEN |
| Native Android / Room QA | OUT OF SCOPE; NOT ESTABLISHED |

**This document controls coordination and artifact selection. It does not constitute source acceptance, QA approval, implementation authorization, or release approval.**
