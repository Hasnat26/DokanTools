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
