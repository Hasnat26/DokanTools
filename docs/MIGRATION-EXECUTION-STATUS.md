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