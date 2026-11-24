# Browser-first / local-first migration — execution status

**PO approval:** 2026-11-24  
**Branch:** feature/browser-first-local-first-pwa-2026-11-24  
**Baseline:** 357a69690d43f640b2850f900bb871c79e8eda0a

## Implemented in this migration branch

- Added dependency audit and identified Node/dynamic invoice API routes and dynamic public-shop route as static-export blockers.
- Added a separate local invoice workspace route that does not import Supabase or call invoice API endpoints.
- Added browser-side integer-minor-unit invoice calculation; total-only fields are retained.
- Added IndexedDB workspace, invoice, product and customer storage with workspace-bound record operations.
- Added local JSON backup/export and merge restore.
- Added Google Drive appDataFolder backup/restore client, bounded retry/backoff, OAuth token acquisition and explicit disconnect.
- Added local A6 PDF generation/download and browser Web Share API path.
- Added PWA manifest, service-worker shell caching and static export configuration.
- Removed the Supabase invoice API route handlers from the migration branch; no static invoice issuance endpoint remains.
- Converted public shop profile routing to /shop?shopId=... for static hosting.
- Kept invoice issuance explicitly disabled through a fail-closed client guard and draft-only UI.

## Validation status

This branch has not yet completed its own CI run at the time of this status file. Do not infer acceptance from the previous delivery branch's Run #210.

## Remaining migration work

- Validate static export build and repair any Next.js static compatibility failures.
- Add automated IndexedDB transaction/recovery tests and browser workflow tests.
- Complete UI integration tests for local save/reopen, stale PDF invalidation, offline calculation and Drive backup/restore.
- Verify OAuth with an authorized Google Cloud Web client and Cloudflare preview origin.
- Verify the actual Cloudflare Pages preview deployment; no deployment has been performed.
- Review legacy Supabase-backed dashboard features. They remain cloud-dependent and are outside the standalone local invoice route's current implementation.
- Update final architecture diagram, exact-head CI evidence and release tracker after tests.
- Keep invoice issuance OFF and do not merge to main or promote production without separate PO approval.

## Required environment configuration

- NEXT_PUBLIC_GOOGLE_CLIENT_ID: optional public OAuth Web client ID for Drive backup. Never set a client secret.
- Existing Supabase public URL/anon key: still needed by legacy cloud-backed dashboard features; not required by /local-invoice/.

## PO directive execution update — 2026-11-24

### Exact-head CI history
- Run #228 (`45328575927`) was superseded/cancelled by PR concurrency after branch updates. Four completed jobs passed; Chromium job did not finish. It is not final acceptance.
- Run #230 (`45329181519`) targeted code candidate `1b6dcccf95452ad1203b1b0510fc4fb269b30305`. PostgreSQL category integrity passed; remaining jobs were in progress at the time of this tracker update.
- Drive restore, quota/rate-limit retry and service-unavailable tests were added in commit `655f6044bf8e6b421ca806842f3574ea4ecd58df`.
- Browser test coverage for local PDF invalidation/regeneration and device share invocation was added in commit `1b6dcccf95452ad1203b1b0510fc4fb269b30305`.
- Legacy migration sequence was documented in `docs/LEGACY-SUPABASE-MIGRATION-SEQUENCE.md` (commit `407fedef24a7e12b83269b4aa85d9e9801230931`).
- This tracker revision must itself pass exact-head CI before the migration code stage is accepted. Record the final run and validated HEAD in the PR discussion after the run completes.

### Local invoice browser coverage added
The Chromium test suite now covers local calculation, IndexedDB save/reload/edit/reopen, local A6 PDF generation/download, offline reload/calculation/PDF, request monitoring for Supabase and invoice API calls, and PDF invalidation/regeneration plus device-share invocation. The test has not yet been accepted until the exact current-head Chromium job passes.

### Cloudflare Pages preview — blocked on account/project authorization
Required:
1. A Cloudflare account and Pages project connected to the DokanTools Git repository, or authorized deployment access for the project.
2. Project name/account context and a non-production preview branch/deployment.
3. For CLI/GitHub Actions deployment only: account ID and a Pages-scoped API token stored as GitHub Actions secrets, never committed or pasted into chat.
4. Build command `npm ci && npm run build`, output directory `out`, Node 20+; preview must use the migration branch.
5. Record the actual preview URL and deployed commit SHA, then validate offline reload, IndexedDB and PDF from that hosted origin.

No Cloudflare account/project connection or deployment tool is available in this execution. No preview deployment has occurred.

### Google Drive acceptance — blocked on OAuth configuration and hosted origin
- Required configuration: public Google OAuth Web client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; it is an identifier, not a client secret.
- Add the exact authorized Cloudflare preview origin to Google OAuth JavaScript origins.
- Live acceptance must cover OAuth consent/token flow, backup, restore/merge, expired/revoked authorization, Drive unavailable, quota/rate-limit and token non-persistence.
- Automated client tests now cover latest backup restore, 401 expired-token classification, quota/rate-limit retry and service-unavailable classification.
- Live account acceptance remains NOT RUN because no client ID or preview origin is configured. Never place a client secret in the browser.

### Remaining scope / acceptance boundary
- Supabase remains required for legacy Auth/dashboard, cloud shop administration, catalogue/customer data, stock, memo, baki and public storefront data.
- Standalone `/local-invoice/` is the only route currently claimed local-first. Static query-string shop routing does not independently publish customer-owned IndexedDB data.
- Controlled migration stages M1–M5 are documented in `docs/LEGACY-SUPABASE-MIGRATION-SEQUENCE.md`.
- Invoice issuance OFF. PR #55 remains Draft. No merge, production deploy, paid infrastructure, production data migration or issuance activation.
## Run #232 Chromium failure investigation and correction

### Evidence reviewed
- Run #232 (`45329416066`) exact checkout: `f2af032c1af654bd20f525edad0533b4695a1b6a`.
- Chromium artifact `dokantools-v1-chromium-a6-45329416066` (artifact ID `14891826593`): Playwright error-context snapshots, failure screenshots, retained videos and trace ZIPs were inspected.
- Offline test screenshot/context showed `/local-invoice/` rendered normally and the test was still filling shop-profile fields. Trace recorded strict-mode failure on `getByLabel("Phone")` before service-worker/offline assertions began. Therefore Run #232 did not establish an offline runtime defect.
- Shop Profile screenshot/context showed the rendered dashboard public-shop link was present at `/shop/?shopId=<uuid>`. The test locator expected `/shop?shopId=` and timed out; the static route's trailing slash was the mismatch.
- PDF/share trace recorded strict-mode failure on `getByLabel("Unit")`, which matched both the Unit textbox and Unit price input before PDF generation/share began.

### Corrections
- Commit `111e675cd893ad2762d0b5b83f31009ee746a572`: exact role/name locator for shop Phone; exact Unit textbox locators; public shop link selector updated to `/shop/?shopId=`.
- Offline assertions were not removed or skipped: the test still waits for service-worker readiness/control, reloads offline, verifies persisted draft and calculation, regenerates A6 PDF and verifies downloaded PDF signature, then checks browser-context isolation and forbidden network calls.
- Public profile/QR behavior remains asserted by comparing decoded QR payload with the actual rendered public-shop href.
- PDF/share test still must generate a fresh PDF, invoke Web Share with a PDF File, verify PDF invalidation after editing, and regenerate.

### Exact-head CI
- Run #233 (`45331330320`) was launched against correction commit `111e675cd893ad2762d0b5b83f31009ee746a572`. At tracker update time: application build, A6 artifact verification and PostgreSQL tenant-integrity jobs passed; unit tests and Chromium were still in progress. Do not treat 3/5 as final acceptance.
- If this tracker update advances the branch, the next run must be used for final exact-head evidence; prior-run results are diagnostic only.

### Cloudflare authorization status
- No Cloudflare dashboard session/account/project authorization or Cloudflare deployment connector is available in this execution. Existing browser tabs were checked; no Cloudflare dashboard was open.
- Required action: Cloudflare account owner/authorized project maintainer connects the GitHub Pages integration to `Hasnat26/DokanTools` and enables a preview deployment for `feature/browser-first-local-first-pwa-2026-11-24`. Keep production branch unchanged.
- Project settings: build command `npm ci && npm run build`; output directory `out`; Node 20+; preview branch control includes the migration branch. Do not use this branch as production.
- Git integration automatically creates/updates PR preview URLs for repository-origin PRs; official guide: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/ . Build settings: https://developers.cloudflare.com/pages/configuration/build-configuration/ .
- Deployment remains NOT PERFORMED until the account/project authorization is available. No paid resource or production deployment is authorized.

### Current release gate
- Local invoice route remains draft-only; invoice issuance OFF.
- Legacy Supabase-dependent modules remain listed in `docs/LEGACY-SUPABASE-MIGRATION-SEQUENCE.md`; whole-app local-first is not claimed.
- PR #55 remains Draft and unmerged. Hosted offline/IndexedDB/PDF validation and live Google Drive acceptance require the authorized preview origin; Drive is optional and not a prerequisite for local invoice use.

## Run #236 failure analysis and final Chromium corrections — 2026-11-24

### Complete artifact review
- Run #236: https://github.com/Hasnat26/DokanTools/actions/runs/45332050415
- Exact checkout SHA: `f3b2585fb65bda2c0e21e5dad65ef9ab07178edb`.
- Artifact: `dokantools-v1-chromium-a6-45332050415`, ID `14892223297`. The Chromium job log and all three Playwright error-context snapshots, screenshots, videos and trace ZIPs were reviewed.
- Result: 4/5 CI jobs passed; Chromium failed. Unit tests, PostgreSQL tenant-integrity, application build/startup and A6 artifact verification passed. The Chromium job failed before the fresh application-generated PDF verification steps, which were skipped.

### Confirmed causes (not service-worker failure)
1. Offline test failed at the Unit input locator: strict mode matched the local catalogue Unit field and invoice-line Unit field. The test had not yet reached service-worker readiness, cache inspection, offline reload or offline calculations. Run #236 therefore provides no evidence of a service-worker defect.
2. Authenticated shop-profile test decoded QR destination `/shop/<id>`, while dashboard link was `/shop/?shopId=<id>`. Static public-shop page reads `shopId` from the query string. This was an application route-generation mismatch; the QR destination was corrected to the supported static query route.
3. PDF/share test failed at the same ambiguous Unit selector before generating or sharing a PDF.

### Corrections committed to PR branch
- `9cd2c13c7418ba3b82d28cc98e7e5e377212b22e`: scope offline test Unit locator to the invoice-line container.
- `84375182411d32586f853f8fff9e3d4a1edc78f8`: add stable `data-testid="local-invoice-line"` to local invoice line markup.
- `7498168d58ccee07e56593fca015cef9fd905568`: align public-shop QR destination with `/shop/?shopId=<id>` used by static export and dashboard.

### Acceptance sequence preserved
No acceptance step was removed, skipped or weakened in the test source. The suite still requires online load, service-worker control, local invoice shell and static asset cache assertions, offline reload, IndexedDB draft reopen, offline edit/calculation, offline A6 PDF generation/download, no Supabase/invoice API requests, PDF invalidation/regeneration and device-share invocation.

### Exact-head CI after correction
- Run #238: https://github.com/Hasnat26/DokanTools/actions/runs/45332893169 was created for corrected code HEAD `7498168d58ccee07e56593fca015cef9fd905568`; it was pending/queued at this tracker revision and is not acceptance evidence.
- Tracker update commit and its triggered run supersede Run #238 if the concurrency policy cancels it. Record the new exact-head run after it completes. Code-stage acceptance requires all five jobs PASS on the final branch HEAD.

### Governance / external preview gate
- PR #55 remains Draft and unmerged; invoice issuance OFF; no production promotion or paid infrastructure.
- Cloudflare preview remains blocked on authorized repository/project integration. Deploy only as a non-production preview, keep production branch unchanged, then record actual preview URL and deployed SHA and validate hosted offline reload, IndexedDB and A6 PDF.
- Google OAuth/Drive is optional and must not delay preview. No frontend client secret.


### Tracker revision CI record
- Run #239: https://github.com/Hasnat26/DokanTools/actions/runs/45332999741 was triggered for tracker/code HEAD `2fa87ccedc7963ed03e9656e0371a52c11191ddf`; it was pending at this update. Run #238 is superseded by the tracker commit and must not be used as final acceptance.
- The next run must validate the new tracker HEAD, including the selector and QR route fixes. Final acceptance remains 5/5 PASS on the exact current PR HEAD.


## Run #240 unit-test root cause and correction — 2026-11-24

- Exact tested SHA: `9e240d761662fefb9bd6185608e07b1fd0aeace5`.
- Run #240: https://github.com/Hasnat26/DokanTools/actions/runs/45333044615. Verified PASS: Application build/startup, PostgreSQL 17 tenant-integrity, and retained A6 PDF artifact verification (3/5). Chromium was still executing when this tracker update was prepared.
- Unit test job failed: 129 passed, 1 failed, 2 skipped (existing suite totals). Root cause is the QR destination unit test retained the old dynamic route expectation `/shop/qa-shop` after the application was correctly changed to static export route `/shop/?shopId=qa-shop`. The failing assertion is `tests/shop-branding.test.mjs` test “QR destination prioritizes configured Maps and only uses explicitly public profile fallback”. Actual output matches the static route used by dashboard/public shop.
- Correction: update the unit test expected destination to `https://dokantools.example/shop/?shopId=qa-shop`. No production logic was reverted and no test was skipped or weakened.
- This correction creates a new exact HEAD and a new full CI run. Run #240 remains useful for the Chromium result but cannot satisfy exact-head acceptance after this commit. Require all five jobs PASS on the new exact HEAD.


## Run #240 Chromium root cause and offline reopen correction — 2026-11-24

- Run #240: https://github.com/Hasnat26/DokanTools/actions/runs/45333044615, exact SHA `9e240d761662fefb9bd6185608e07b1fd0aeace5`, concluded 3/5 PASS and 2/5 FAIL. PASS: application build/startup, PostgreSQL tenant-integrity, retained A6 PDF artifact. FAIL: unit test (stale QR route expectation, corrected in commit `b4dc53effa85245e12938c67cbf3c2669fdeef3c`) and Chromium.
- Chromium failure artifact #14893260601 (`dokantools-v1-chromium-a6-45333044615`) was downloaded and inspected, including screenshot, error-context snapshot and trace.
- Exact Chromium failure: after offline reload, test expected the active editor to auto-populate the previous draft. The screenshot/snapshot shows the local draft still persisted in IndexedDB and appears under “Saved drafts (1)” with the Edit action; the editor is a fresh empty draft until the user explicitly selects Edit. The trace proves the earlier online reload + Edit successfully restored “Offline QA Product” and quantity 2, then the later offline reload opened a blank editor. Therefore this is an acceptance-test assumption mismatch, not evidence of IndexedDB data loss or a service-worker defect.
- Correction in this commit: after offline reload, assert the saved customer/draft is present, click the saved draft’s exact Edit button, assert status “Draft loaded from IndexedDB”, then verify line data and perform offline quantity edit/calculation and A6 PDF generation/download. This strengthens explicit offline draft reopening and preserves the complete cache/offline/no-network/PDF sequence; no step is skipped or weakened.
- Run #241 was triggered for unit-test correction HEAD `b4dc53effa85245e12938c67cbf3c2669fdeef3`; it is superseded by this browser-test correction. New exact-head full CI is required; all five jobs must PASS.


## Code-stage acceptance — Run #242 — 2026-11-24

- **Result: 5/5 PASS** on exact code/test SHA `d52b33cc0824e5103ba00e0deff5f1a5af1df73d`.
- Run: https://github.com/Hasnat26/DokanTools/actions/runs/45334126944
- Jobs PASS: Application build and startup; Unit tests (including A6 PDF assertions); Chromium authenticated V1 workflow and fresh A6 PDF; PostgreSQL 17 category tenant-integrity regression; A6 PDF artifact verification.
- Chromium artifact: `dokantools-v1-chromium-a6-45334126944`, ID `14893795975` (retained). The corrected browser test explicitly reopened the IndexedDB draft after offline reload and passed the offline calculation, PDF download and no-Supabase/no-invoice-API checks.
- Corrections validated: static shop QR route, matching unit test expectation, precise invoice-line selectors, explicit offline saved-draft reopening. No acceptance steps were removed or skipped.
- This tracker update creates a documentation-only commit and triggers a new CI run against the resulting tracker HEAD. Do not claim final exact-head acceptance until that follow-up run also passes 5/5.
- Governance: PR #55 remains Draft/unmerged; invoice issuance OFF; no production promotion or paid infrastructure. Cloudflare preview remains external authorization-gated.
