# Controlled Cloudflare Preview, Demo and M1–M5 Migration Plan

**Authority:** PO execution clarification, 2026-11-24  
**PR:** #55 — Draft/open/unmerged  
**Code-stage CI:** Run #258, 5/5 PASS on `2f180659df106c84f9c15c6dc0bbd8ec6cdace49`  
**Scope:** Preview and synthetic-data acceptance only. No production promotion, invoice issuance, paid service, destructive migration or live customer data.

## 1. Blocker register and required actions

| ID | Blocker / evidence | Classification | Exact PO / external action | Independent work |
|---|---|---|---|---|
| CF-1 | Existing Cloudflare Pages project and GitHub App installation cannot be inspected through the connected tools. Current connected browser tabs are ChatGPT and ABB; no Cloudflare tab/account connector is available. Repository docs specify Git integration but do not prove the account's project state. | External authorization / account access | In Cloudflare Dashboard, open **Workers & Pages → Pages → existing DokanTools project → Settings → Builds**. Confirm the connected GitHub repository is `Hasnat26/DokanTools`. If the repository is missing, use the Cloudflare GitHub App's **Configure/Install/Update access** flow and grant access to this repository only, then return to the existing Pages project. Do not create a second project. | Repository config, preview smoke script, browser checklist, roadmap and test evidence preparation. |
| CF-2 | Preview branch may not be enabled. Repository branch is `feature/browser-first-local-first-pwa-2026-11-24`; intended build is `npm ci && npm run build`, output `out`, Node 20+. | PO/authorized Pages maintainer action | In the existing project **Settings → Builds → Branch control**, add the migration branch under **Preview branches**. Leave production branch exactly as currently configured. Trigger/retry the branch preview after Git integration is authorized. | Confirm Wrangler/Next static export config in repository; add/run preview HTTP smoke checks. |
| CF-3 | Preview URL/deployment SHA are not available until Cloudflare completes the preview deployment. | External deployment result | Provide the generated preview URL and Cloudflare deployment ID/status/SHA, or authorize the maintainer to retrieve them. | Execute the script below against the URL; conduct interactive acceptance when reachable. |
| GD-1 | Google OAuth Web client is not configured; this is not required for initial local invoice acceptance. | PO-owned Google Cloud setup, optional for M0 demo | Only when enabling Drive backup: select/create PO-controlled Google Cloud project, enable **Google Drive API**, configure OAuth consent/test users as applicable, create OAuth Client ID → **Web application**, add exact preview origin under **Authorized JavaScript origins**, then set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Cloudflare **Preview** environment only. Client ID is public; never provide a client secret/service-account key. | Local JSON export/import and IndexedDB recovery acceptance proceed without OAuth. |
| DATA-1 | IndexedDB is browser-profile storage, not multi-device sync or a durable backup. | Engineering/product constraint | PO accepts synthetic-data, single-browser-profile pilot boundary for this demo. | Test local persistence and explicit export/restore. |
| LEG-1 | Legacy shop administration, catalogue, stock, memo, baki and public storefront data still depend on Supabase. | Engineering migration backlog | Approve each module's scope and acceptance gate before implementation; no live-data migration now. | Detailed dependency roadmap below. |

**Cloudflare account inspection finding:** Not verified. I cannot claim that the project exists, the GitHub App is installed, or the branch is enabled until the authorized Cloudflare dashboard state is visible. The required access action is repository-scoped GitHub App authorization for `Hasnat26/DokanTools`, followed by enabling the migration branch as a preview branch in the existing project.

## 2. Repository-side deployment preparation

Verified repository configuration at Run #258 SHA:

- Next.js static export: `output: "export"`, trailing slash enabled, images unoptimized.
- Pages output: `./out`; project name in `wrangler.toml` is `dokantools-local-first-pwa`.
- Build: `npm ci && npm run build`.
- Local invoice route: `/local-invoice/`.
- PWA resources: `/manifest.webmanifest`, `/sw.js`, `/offline.html`.
- Production branch remains unchanged; no Pages deployment is claimed.

Added `npm run verify:preview -- <preview-origin>`, a Node built-in fetch smoke test for home, local invoice route, manifest, service worker and offline fallback. It checks status/content-type, manifest start URL/scope, and expected shell-cache marker. It is a static HTTP preflight, **not** proof of IndexedDB, offline operation or browser network isolation.

## 3. Controlled synthetic-data browser acceptance

Use a fresh browser profile or clear the demo profile before starting. Do not use real customer data. Record preview URL, Cloudflare deployment ID, deployed SHA, browser/version, date, tester and evidence filenames.

| ID | Test | Pass criterion | Evidence |
|---|---|---|---|
| DEMO-01 | Load preview and `/local-invoice/` | Both load without console/runtime error | Screenshot + console |
| DEMO-02 | Create local shop profile | Profile saves and remains after reload | Screenshot before/after reload |
| DEMO-03 | Create synthetic products/customer | CRUD works; data survives reload | Sanitized record names / screenshot |
| DEMO-04 | Create multi-line invoice | Quantity × unit price and grand total are correct; total-only scope | Screenshot with synthetic values |
| DEMO-05 | Edit invoice after PDF preview | Prior PDF is invalidated; regenerated PDF reflects latest edit | Before/after PDF and SHA |
| DEMO-06 | Download A6 PDF | Opens, one portrait A6 page, `DRAFT ONLY`, no clipping | PDF + `pdfinfo`/visual check |
| DEMO-07 | Service worker first control | DevTools Application shows active worker controlling the page after reload | Screenshot of SW status |
| DEMO-08 | Offline shell | With worker controlling, set Network Offline and reload home/local invoice; cached shell opens | Screenshot + network log |
| DEMO-09 | Draft recovery | Close tab/browser, reopen same profile; draft/shop/products remain | Screenshot |
| DEMO-10 | Local-path network isolation | During create/edit/calc/save/PDF/share, Network panel shows no Supabase host, `/api/invoices`, or invoice issuance request | HAR or sanitized request list |
| DEMO-11 | Issuance guard | No issue/submit invoice action; issuance remains OFF | Screenshot + code/response evidence |
| DEMO-12 | Backup recovery | Local JSON export, clear only test workspace, import and reconcile counts; Drive test deferred | Export file + count reconciliation |
| DEMO-13 | Cross-profile boundary | Separate browser profile does not silently share IndexedDB records | Two-profile screenshots |
| DEMO-14 | Clean-up | Delete synthetic workspace/profile data and preserve test evidence only | Cleanup record |

### Demo execution order

1. Authorized maintainer enables the preview branch and Cloudflare produces a deployment.
2. Run `npm run verify:preview -- https://<actual-preview-host>`; attach console output.
3. Start fresh browser profile, open preview, then `/local-invoice/`.
4. Execute DEMO-02 through DEMO-14 in order. Capture sanitized evidence; do not capture OAuth tokens, personal data or browser cookies.
5. Record each test PASS/FAIL/BLOCKED with actual result. Any failed test creates a defect; do not infer PASS from CI.
6. Recheck PR state and deployed SHA before reporting. Keep PR Draft and unmerged.

## 4. Google Drive OAuth — exact optional setup

1. PO selects or creates a Google Cloud project.
2. Enable Google Drive API.
3. Configure OAuth consent screen and add PO/test account as test user if app remains in testing.
4. Create OAuth 2.0 Client ID of type **Web application**.
5. Add the exact preview origin (scheme + hostname, no path) to Authorized JavaScript origins.
6. Add the public `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Cloudflare Preview environment; rebuild preview after setting it.
7. Test connect, manual backup, restore, expired/revoked token, disconnect and quota/network failure.
8. Confirm token exists only in memory and is absent from IndexedDB/localStorage/export/logs.

Drive OAuth is optional for DEMO-01 through DEMO-11. Local JSON backup/import is sufficient for initial local invoice acceptance.

## 5. Legacy M1–M5 dependency-aware roadmap

Effort is an **engineering estimate in person-days (PD)** for implementation, automated tests, migration rehearsal and QA; it excludes PO decision latency, external access waiting and major UI redesign. Ranges are estimates, not commitments.

| Stage | Scope / deliverables | Dependencies | Effort estimate | Key risks | Acceptance criteria |
|---|---|---|---:|---|---|
| M1 — Shop profile, catalogue, customers | Canonical local shop/workspace IDs; cloud read-only export; versioned import mapping; duplicate/reference report; explicit user-confirmed IndexedDB import; backup before import | M0 preview/demo accepted; source schema and export permissions; local model IDs frozen | 5–8 PD | Duplicate names/phones; mismatched IDs; silent data loss; local profile isolation | Export/import row counts reconcile; sampled field audit; unresolved conflicts reported; repeat import idempotent; backup/restore drill PASS; old cloud path remains read-only during pilot |
| M2 — Inventory ledger | Event model for receipt/issue/adjust/reversal; atomic IndexedDB transaction; idempotency; stock policy; audit/reconciliation | M1 identity/catalogue mapping accepted | 8–13 PD | Concurrent tabs; double-submit; negative stock; partial transactions; browser crash | Invariants pass; duplicate operation idempotent; crash/reload recovery; ledger-to-balance reconciliation; explicit negative-stock policy; synthetic pilot acceptance |
| M3 — Memo + baki | Port documented transaction boundaries; memo/customer balance/stock movement as one atomic local transaction; correction/void/reversal; rounding and audit | M1 stable IDs + M2 ledger accepted; existing RPC behavior documented and fixture parity established | 12–18 PD | Accounting drift; rounding mismatch; partial write; reversals; restore conflict | Synthetic parity suite against existing behavior; rollback/atomicity tests; balance/stock reconciliation; audit history; independent QA; PO sign-off before pilot |
| M4 — Public storefront | Decide publishing architecture (retained cloud API, approved edge/backend, or explicit static customer publishing); public data projection; QR/link lifecycle; privacy/deletion | M1 shop/catalogue model; architecture and cost decision can begin in parallel, implementation requires stable public schema | 10–16 PD | Static Pages cannot serve a user's private IndexedDB to other devices; privacy leaks; stale listing; operating cost | Publish/update/delete test; public projection excludes private/customer/baki data; access/privacy test; QR route and cross-device freshness verified; cost/owner approval |
| M5 — Supabase retirement | Per-module cutover plan; freeze/write-disable old path; export/backup; rollback window; remove dependencies only for migrated modules | M1–M4 acceptance where applicable; all included module gates; explicit PO retirement approval | 4–7 PD | Premature removal; data loss; rollback gap; hidden legacy dependency | No unintended Supabase calls for retired modules; verified export and rollback rehearsal; migration reconciliation signed; PO approves each retirement step |

**Dependency graph:** M0 → M1 → M2 → M3 → M5. M4 architecture discovery may run in parallel with M1; M4 implementation depends on M1's stable shop/catalogue model and a PO-approved publishing architecture. M5 cannot start destructive retirement until each in-scope module is accepted.

**Total estimated effort:** 39–62 PD across M1–M5. M0 preview/demo is a separate acceptance workstream and is not included in this total. Parallelization can reduce elapsed calendar time but not the person-day estimate.

## 6. Governance and exit conditions

- PR #55 remains Draft/open/unmerged.
- Invoice issuance remains OFF; draft PDF only.
- No production deployment, paid infrastructure, production data import or destructive migration without explicit PO approval.
- Preview/demo exit: actual Cloudflare preview URL + deployment SHA; DEMO checklist with evidence and no unresolved critical defects; verified invoice issuance OFF; synthetic-data cleanup recorded.
- M1–M5 are proposed engineering gates. Scope changes, effort changes or data-model decisions require PO review.
