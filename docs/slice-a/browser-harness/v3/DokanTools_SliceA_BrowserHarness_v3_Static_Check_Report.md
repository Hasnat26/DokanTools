# DokanTools Slice A Browser Harness v3 — Static Verification Report

**Task ID:** DT-CH3-SLICE-A-BROWSER-HARNESS-FIX-003  
**Target:** `DokanTools_SliceA_BrowserHarness_v3.html`  
**Date:** 10 November 2026  
**Verification owner:** CH-3  
**Verification boundary:** Static source checks and isolated Node.js VM state-transition tests; no browser runtime execution

## 1. Artifact integrity

| Item | Result |
|---|---|
| HTML size | 27,936 bytes |
| HTML SHA-256 | `62b2bbe7b051314b0612458dd4dc4640234b84a42a9c336a686931f8b640b734` |
| Baseline v2 HTML SHA-256 | `6072d8d16b3e3c534774a040c1ad108049db456d99733303b7cf325c93ae476c` |
| Submitted v2 ZIP SHA-256 | `4d31aa5ec9bbdfd7769c68066f845755519bf78e22311e5158473301e78e6ce4` |
| ZIP embedded HTML hash matches inspected v2 HTML | PASS |

## 2. Static source checks

| Check | Result | Evidence |
|---|---|---|
| HTML parser accepts document | PASS | Python `html.parser.HTMLParser` completed without error |
| Unique element IDs | PASS | 44 IDs; zero duplicates |
| Inline script count | PASS | Exactly one inline script |
| JavaScript syntax | PASS | `node --check /mnt/data/v3_actual_inline.js`, exit code 0, empty stderr |
| Existing localStorage key retained | PASS | `dokantools.sliceA.browserHarness.shopProfile.v1` |
| Singleton profile ID retained | PASS | `primary` |
| Automatic `localStorage.removeItem()` / `clear()` | NONE | No such call in v3 source |
| New `maxlength` attributes | NONE | No `maxlength` attribute in v3 source |
| Explicit Review Draft action | PASS | `reviewPendingDraftButton` |
| Explicit Discard Draft action | PASS | `discardPendingDraftButton` |
| Separate update confirmation | PASS | `confirmUpdateButton` and `keepDraftButton` |
| Retry valid-profile branch preserves pending draft | PASS | Branch renders recovery conflict when pending draft exists |
| Saved-profile snapshot checked before update | PASS | Raw snapshot comparison before confirmed `setItem()` |

## 3. QA-F01 targeted execution results

**Execution method:** Actual v3 inline application JavaScript evaluated in Node.js VM using controlled DOM and localStorage test doubles. The test cases invoke the application event handlers and inspect UI state, pending draft display, localStorage contents and write count.

**Result: 9/9 PASS.**

| Test | Verification | Result |
|---|---|---|
| T01 | Retry finds valid profile; saved profile and draft shown separately; no write | PASS |
| T02 | Review Draft is read-only; explicit update confirmation required; confirmed update writes once | PASS |
| T03 | Explicit Discard Draft returns to saved profile without storage mutation | PASS |
| T04 | Retry finds empty storage; draft restored; explicit Save creates profile | PASS |
| T05 | Repeated read failures and Retry attempts preserve draft | PASS |
| T06 | Read failure during draft review captures latest edited values and recovers | PASS |
| T07 | Read failure at final confirmation preserves draft and saved profile | PASS |
| T08 | Taking neither recovery action leaves both versions unchanged | PASS |
| T09 | Changed saved-profile snapshot blocks stale confirmation and overwrite | PASS |

The test harness is supplied as `DokanTools_SliceA_BrowserHarness_v3_QA-F01_Test_Harness.cjs`; its output is supplied as `DokanTools_SliceA_BrowserHarness_v3_QA-F01_Test_Output.json`.

## 4. Commands and reproducibility

```bash
node --check /mnt/data/v3_actual_inline.js
node /mnt/data/DokanTools_SliceA_BrowserHarness_v3_QA-F01_Test_Harness.cjs
python /mnt/data/static_v3.py
sha256sum /mnt/data/DokanTools_SliceA_BrowserHarness_v3.html
```

The test harness uses deterministic in-memory storage outcomes (valid profile, empty storage and injected read exceptions). It does not launch a browser.

## 5. Verification boundary / limitations

- Chrome/Edge/Firefox runtime: NOT EXECUTED.
- Full BH-R01–BH-R30 browser regression: NOT EXECUTED by CH-3.
- QA-F01-T01–T09 actual browser regression: NOT EXECUTED; only the isolated Node.js VM scenarios passed.
- Real browser localStorage quota/security behavior, DOM rendering, keyboard/focus/accessibility, refresh behavior and cross-tab races remain for CH-4 to verify.
- Pending draft is held in JavaScript memory; a page reload or tab/process termination while a draft is pending can lose that in-memory draft. Persistent draft storage was not part of the authorized QA-F01 scope.
- No native Android, Kotlin, Jetpack Compose, Room/SQLite, APK, database, GitHub, deployment, pilot or Slice B verification was performed.

**Conclusion:** Static checks PASS and targeted QA-F01 state-transition tests PASS 9/9. Browser runtime remains unverified. Submit v3 to CH-1 for review; do not begin CH-4 retesting until CH-1 authorizes it.