# DokanTools — Phase 4 Runtime Acceptance and Final Gate Register

Date: 2026-11-19 (UTC)

## Governing baseline, revision and release controls

- PO-approved application-under-test baseline: `437e76c1c0261d43c5b419a80aa3bed890331aff`.
- Corrective branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Corrective branch HEAD immediately before this Phase 4B register refresh: `d57acabb574ef16d4864c979b50644aa7741d30e`; this refresh creates the next documentation-only HEAD.
- Dependency remediation commit: `01e82e767eca29ccd986e5443fc6c455ae0c4296`; it is an ancestor of the branch; GitHub compare confirms the current branch is a descendant of the remediation commit (0 commits behind).
- Phase 4B source reconciliation at branch HEAD `7861c5488bbc37ed38752435d11fa7d669b5ed55`: merge-base is exactly the application baseline, 25 commits ahead / 0 behind. The complete baseline-to-HEAD file list is 11 paths: three GitHub workflows, six acceptance docs, `package.json` and `package-lock.json`; no `src/` paths. Six representative application files were independently checked by blob SHA and are identical at baseline and audited HEAD. The approved baseline commit itself contains a one-line fix in `src/app/dashboard/draft-memo/page.tsx`; it is part of the approved baseline, not a later change. See [Phase 4B source reconciliation report](PHASE4B_AUTH_POSTGREST_ISOLATION_2026-11-19.md).
- Latest full CI and security-audit workflows ran against `cb18e5fbffd241ee8c76b31ce3f0a1bce8b6a240`. Subsequent commits through the Phase 4B source audit changed acceptance documentation only; package manifest, lockfile and application source remain unchanged from the tested dependency tree.
- `main`: `b07d47bef332d641ec10ce7a96a9ab30a1ea5eab`; unchanged.
- Repository visibility: PRIVATE.
- No merge, deployment, pilot, production database operation, public release or public visibility change. No invoice issuance, payment, VAT, discount, stock, sales, ledger or public verification activation. No offline sync, service worker or new product feature was introduced.

Status values: NOT STARTED / IN PROGRESS / PASS / FAIL / BLOCKED. PASS is restricted to the exact scope and evidence stated below.

## Consolidated acceptance register

| ID / gate | Status | Exact tested SHA and environment | Procedure / expected result | Actual result and evidence | Owner / reviewer / review date | Defects, corrective action and remaining dependency |
|---|---|---|---|---|---|---|
| AG-01 — Independent authenticated workflow QA | **BLOCKED** | Application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`; repository PRIVATE; isolated QA project now provisioned (ref `kidrysdtgmhmpogwxzzx`). | Independent tester (not PM or candidate author) checks out exact app baseline, receives PO-approved private-repo read access, executes QA-01–QA-14 on authenticated `/dashboard/draft-memo`, captures screenshots, sanitized HAR/console logs and defects, then signs and dates report. | [INDEPENDENT_QA_PACKAGE.md](INDEPENDENT_QA_PACKAGE.md) defines 14 cases and evidence templates. No independent tester nomination, private-repo access grant, authenticated browser execution or signed report exists. SQL-layer Owner A/B RLS checks do not constitute independent application QA. [Issue #46](https://github.com/Hasnat26/DokanTools/issues/46) remains open. | Execution owner: PO-nominated independent tester. Coordination: PM. Reviewer: not assigned. Reviewed 2026-11-19 UTC. | PO must provide tester GitHub username and approve private-repo read access; no access is to be granted until that username is approved. Independent tester must execute and sign/date the report. |
| AG-02 — Authenticated two-owner Supabase RLS/isolation | **BLOCKED — database RLS tests partially passed** | Application-under-test baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`; isolated Supabase project `kidrysdtgmhmpogwxzzx`, Singapore `ap-southeast-1`, PostgreSQL 17.12, `ACTIVE_HEALTHY`, Free-plan quoted cost $0/month. | Verify real application Auth sessions for Owner A/B; own/cross-owner UI and PostgREST reads/writes; RLS denial; tampered owner/shop/product IDs; FK ownership; IndexedDB draft owner/shop isolation and snapshots. | Project created 2026-11-19 04:50:16 UTC. Applied migration `20261119062535 / 20261119_phase4_draft_memo_scope` and index migration `20261119063019 / 20261119_phase4_catalog_index_alignment`. Only `public.shops` and `public.item_catalog` are present in public schema; RLS enabled on both. No category table exists in the baseline; product presets are static, grouped by shop type. Created synthetic Owner A/B rows in `auth.users` without password hashes (not sign-in-capable), shops A/B and 3 catalogue products. With database role `authenticated` and test JWT claim context, A sees 1 own shop/2 own products and 0 B rows; B sees 1 own shop/1 own product and 0 A rows. Cross-owner catalogue inserts, shop-owner tampering and moving A's product to B's shop were rejected with SQLSTATE `42501`. Cross-owner update/delete affected 0 rows. Own catalogue and shop inserts/updates passed in rolled-back transactions. Anon read privileges are absent. These are PostgreSQL RLS runtime results, not actual Auth sign-ins or PostgREST HTTP evidence. No browser/IndexedDB tests. SQL fixtures are synthetic; no production data/credentials used. Security Advisor: no RLS security lints, but warns `auth_leaked_password_protection` is disabled. Performance Advisor reports four `auth_rls_initplan` warnings for baseline-style `auth.uid()` policy expressions; `shops.user_id` FK index was added, and the redundant catalogue index removed. Health Advisor: no findings. | Execution owner: PM / isolated project owner. Independent reviewer: not assigned. Reviewed 2026-11-19 UTC. | AG-02 remains blocked until test owners can authenticate through Supabase Auth and end-to-end PostgREST tests, including tampering/bypass cases, are executed against the app baseline; IndexedDB owner/shop isolation is exercised; sanitized requests/responses and browser evidence are retained; and results are independently reviewed. Do not represent SQL claim simulation as live Auth/PostgREST acceptance. |
| AG-03 — Physical A6 printer acceptance | **BLOCKED** | Application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`; no physical printer environment available. | Print browser-generated PDF and Ghostscript-finalized PDF separately, A6 portrait 105×148 mm, actual size/100%, no scaling/fit/rotation. Measure paper and all four safe margins (≥3 mm); verify ≥8 pt text, Bengali/English glyphs, one-page output and no clipping. | [PHYSICAL_A6_PRINTER_PROTOCOL.md](PHYSICAL_A6_PRINTER_PROTOCOL.md) prepared. Digital PDF geometry is not physical acceptance. No printer output, settings screenshot, dated photographs, measurements or operator sign-off. | Execution owner: PO-provided printer operator. Reviewer: independent QA. Reviewed 2026-11-19 UTC. | Requires A6-capable printer/driver, A6 paper stock, operator and ruler/caliper with 0.5 mm or better graduations. Retain both PDFs, pdfinfo/pdffonts outputs, print settings, photos and measurements. |
| AG-04 — Browser offline behavior | **BLOCKED** | Application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`; isolated QA DB exists, but no sign-in-capable test accounts or authorized independent browser operator. | Execute OFF-01–OFF-10: first offline startup, online bootstrap then offline refresh, catalogue availability, draft create/save/reload/edit/delete, close/reopen, reconnect/consistency, conflict behavior if applicable, Owner A/B isolation. | [OFFLINE_BEHAVIOR_TEST_PROTOCOL.md](OFFLINE_BEHAVIOR_TEST_PROTOCOL.md) prepared. Source inspection confirms authenticated startup calls Supabase Auth/shop/catalogue reads; draft CRUD uses IndexedDB keyed by owner/shop. No browser/IndexedDB runtime results. README states full offline transaction queue/PWA service worker is not included. | Execution owner: independent QA. Reviewer: not assigned. Reviewed 2026-11-19 UTC. | Requires sign-in-capable disposable accounts and independent browser operator; execute OFF-01–OFF-10 and retain browser/network/IndexedDB evidence. No caching, service worker or synchronization changes without separate PO approval. |
| AG-05 — PostgreSQL concurrency/rollback | **PASS — scope-limited** | Test commit `5afd8c81ab549e77ede9615cb471ac3d51818272`; GitHub Actions [run 44460397553](https://github.com/Hasnat26/DokanTools/actions/runs/44460397553); ephemeral PostgreSQL 16.16 (`postgres:16-alpine`). | `bash scripts/test-invoice-postgres.sh`; disposable DB, multiple connections, distinct/duplicate concurrent requests, fault injection, rollback and down migration. | 20 distinct concurrent requests generated bill numbers 2–21; concurrent duplicate requests reused one invoice; injected SQLSTATE `P0001` rolled back header, idempotency claim, lines, status/audit events and counter allocation; down migration removed invoice objects while preserving baseline tables/memo RPC. | Owner: PM/CI. Independent reviewer: none. Reviewed 2026-11-19 UTC. | PASS applies only to legacy Invoice-First transaction foundation on ephemeral PostgreSQL 16.16. It is not Draft Memo runtime acceptance, Supabase Auth/PostgREST RLS or PostgreSQL 18 validation. Render PG18 remains unused; no insecure network access was opened. |
| AG-06 — Repository working-tree and Git-history secret scan | **PASS — scanner scope-limited** | Security workflow [run 44463975599](https://github.com/Hasnat26/DokanTools/actions/runs/44463975599), head SHA `cb18e5fbffd241ee8c76b31ce3f0a1bce8b6a240`; full-history checkout. | Gitleaks scan of working tree and full Git history with redaction; npm audit in same workflow. | Gitleaks reported 125 commits scanned and no leaks. Redacted artifact [14501815303](https://github.com/Hasnat26/DokanTools/actions/runs/44463975599/artifacts/14501815303). This scan used mutable `zricethezav/gitleaks:latest`. It is not evidence about external secret stores. | Owner: PM/CI. Independent security reviewer: none. Reviewed 2026-11-19 UTC. | Scope excludes GitHub Actions secret-store values, Supabase secrets, Render credentials and developer workstations/external stores. No external secret-store verification claimed. Future repeat should pin Gitleaks version/image digest and preserve redacted output. |
| AG-07 — Dependency vulnerability remediation and verification | **PASS** | Remediation commit `01e82e767eca29ccd986e5443fc6c455ae0c4296` is an ancestor of current HEAD. Exact full CI and security workflow head SHA: `cb18e5fbffd241ee8c76b31ce3f0a1bce8b6a240`. Current HEAD `b95e8f212b1480da5aeb16120fc6a7a08c2772f2` differs from tested SHA only in AG-07 documentation. Environment: GitHub Actions Ubuntu 26.04. | Lockfile verification; `npm ci`; `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`; fresh `npm audit --json`. Expected: all checks pass and vulnerability counts zero. | Current committed lockfile v3 resolves TypeScript ESLint packages to 8.73.0, nested minimatch to 11.0.9 and postcss-selector-parser to 6.1.5. CI [run 44463975550](https://github.com/Hasnat26/DokanTools/actions/runs/44463975550) passed `npm ci`, tests, lint, typecheck and production build. Security [run 44463975599](https://github.com/Hasnat26/DokanTools/actions/runs/44463975599) passed; fresh `npm audit --json` reported info/low/moderate/high/critical all zero, total 0, exit code 0. Package manifest and lockfile are unchanged between tested SHA and current HEAD. | Owner: PM/CI. Independent package/security reviewer: none. Reviewed 2026-11-19 UTC. | No further dependency changes required. PASS covers committed dependency tree and these CI/audit checks; it is not an independent third-party package review. |
| AG-08 — MIT copyright-holder authorization | **BLOCKED** | Application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`; LICENSE unchanged with placeholder `Copyright (c) 2026 DokanTools contributors`. | Verify the PO-intended attribution `Copyright (c) 2026 Md. Abul Hasnat`, ownership basis, contributor and third-party licenses, and employer IP rights before replacing LICENSE or treating AG-08 as PASS. | PO supplied intended individual attribution in Issue #46 comment 7001262755. The attribution is not independent evidence of copyright ownership or licensing authority. No LICENSE change or publication. | Owner/reviewer: PO. Reviewed 2026-11-19 UTC. | Obtain documented rights provenance for all relevant code, including employer-owned and third-party/contributor contributions, and legal authority to license under MIT. |

## PostgreSQL 18 environment

The Render disposable PostgreSQL 18 instance previously identified as `dokantools-acceptance-disposable` remains unused. The hosted SQL connector did not have an allowlistable fixed source IP and was read-only. No broad IP allowlist or insecure access path was introduced. AG-05 remains based only on the ephemeral PostgreSQL 16.16 test evidence above. Do not use PG18 unless a secure, authorized writable path and specific test requirement are established.

## PO decisions and external resources required to close remaining gates

1. **AG-01:** PO must nominate an independent tester by GitHub username and approve read access to the PRIVATE repository; require a signed/date-stamped QA report.
2. **AG-02:** project and restricted schema are provisioned; database-level RLS claim simulations passed for the recorded cases. Create sign-in-capable disposable users through the supported Auth flow, complete direct PostgREST and application/browser acceptance, capture sanitized evidence, and obtain independent review before AG-02 can pass.
3. **AG-03:** PO to provide the A6 printer/driver, A6 paper and operator; obtain a ruler/caliper with 0.5 mm or better graduations and retain separate browser-PDF and Ghostscript-PDF physical evidence.
4. **AG-04:** independent browser operator and sign-in-capable accounts required; execute OFF-01–OFF-10 without adding product features.
5. **AG-08:** verify ownership provenance, employer IP, and contributor/third-party rights before changing LICENSE or granting PASS.

Issue [#46](https://github.com/Hasnat26/DokanTools/issues/46) remains the coordination record for independent QA nomination and access. Final product acceptance, merge, deployment, pilot and public-release authorization remain exclusively subject to a separate PO decision.


## Phase 4 execution addendum — Supabase AG-02 environment and database-layer testing

Execution date: 2026-11-19 (UTC). This addendum records test-environment operations only; it does not grant release approval.

### Repository preflight

- Corrective branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Branch HEAD immediately before this addendum: `8930060caf69a4bdeefc07faa760ea0bf13e7ae4`.
- Main HEAD: `b07d47bef332d641ec10ce7a96a9ab30a1ea5eab`; unchanged.
- Repository visibility: PRIVATE.
- Application-under-test baseline: `437e76c1c0261d43c5b419a80aa3bed890331aff`.
- GitHub compare reports the corrective branch is 23 commits ahead and 0 behind the application baseline. The diff contains only package manifests/lockfile, acceptance documentation and GitHub workflows; no application source path is changed.
- No merge, deployment, production DB operation, pilot, release or visibility change.

### Supabase environment

- Organization: `hasece26@gmail.com's Org` (`eqigcdjmasfqmumlpqiy`), Free plan.
- Project: `dokantools-phase4-isolated-qa`.
- Project reference: `kidrysdtgmhmpogwxzzx`.
- Region: `ap-southeast-1` (Singapore).
- Created: `2026-11-19T04:50:16.04584Z`.
- Status: `ACTIVE_HEALTHY`; PostgreSQL 17.12.0.000.
- Project creation quote and final creation: $0/month. No paid add-on or upgrade accepted.

### Schema-scope decision

The approved application baseline's Draft Memo route reads the authenticated owner's shop from `public.shops` and active products from `public.item_catalog`. Draft records are stored in browser IndexedDB through `src/lib/draft-memo-store.mjs`; they are not persisted to Postgres. The baseline contains no database-backed category table; its product presets are static in `src/lib/product-presets.ts`, grouped by shop type. No category table was invented.

Applied only the production-equivalent Draft Memo schema dependencies:
- `public.shops`: baseline columns plus the `is_public` column present in the reliability-foundation baseline.
- `public.item_catalog`: baseline columns, unique `(shop_id,name)`, and FK to `shops`.
- RLS enabled on both tables. Owner shop policies preserve authenticated `auth.uid() = user_id` predicates. Catalogue policy preserves the baseline `EXISTS shops WHERE id = shop_id AND user_id = auth.uid()` predicate.
- Shop client privileges are restricted to baseline effective grants: SELECT; INSERT on permitted shop profile columns; UPDATE on permitted profile fields and `is_public`. No client DELETE. Authenticated owners receive catalogue CRUD, constrained by RLS. Anon receives no SELECT privileges.
- Added `shops_user_id_idx` for the owner FK/query path; removed a redundant catalogue index because the unique composite index already covers `shop_id`.

Migration ledger:
1. `20261119062535` — `20261119_phase4_draft_memo_scope`: creates the two tables, constraints, RLS policies and limited grants.
2. `20261119063019` — `20261119_phase4_catalog_index_alignment`: creates `shops_user_id_idx` and removes the redundant index.

Excluded: customers, baki_entries, memos, stock_items, shop_offers, transaction_requests, stock_movements, audit_events, invoice tables/RPCs, payment/ledger functions, public views, public QR/verification, sales and stock workflows, service workers and offline sync. Post-application public table inventory contains only `shops` and `item_catalog`.

### Synthetic two-owner fixtures

These are synthetic database fixture identities, not production accounts and not sign-in-capable credentials. The rows were inserted as isolated test identity records with no password hash; no password or access token was generated or stored.

- Owner A identity: `11111111-1111-4111-8111-111111111111`; shop: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`; catalogue products: `11111111-aaaa-4aaa-8aaa-111111111111` (active) and `11111112-aaaa-4aaa-8aaa-111111111111` (inactive).
- Owner B identity: `22222222-2222-4222-8222-222222222222`; shop: `bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`; catalogue product: `22222221-bbbb-4bbb-8bbb-222222222222` (active).
- Post-test snapshot: 2 shop rows, 3 catalogue rows, 2 synthetic auth identity rows; rollback test record count 0.

### AG-02 database RLS test results

All tests below ran against project `kidrysdtgmhmpogwxzzx` using PostgreSQL role `authenticated` and per-owner request JWT claim context. This exercises database RLS and grants directly. It is not evidence of a successful Supabase Auth sign-in or HTTP request through PostgREST.

| Test | Result | Evidence / outcome |
|---|---|---|
| Owner A own shop/catalogue | PASS | Sees 1 own shop, 2 own catalogue rows, 1 active product. |
| Owner A cross-owner shop/catalogue/product-ID reads | PASS | Sees 0 Owner B shop rows, 0 Owner B catalogue rows and 0 rows for B product ID. |
| Owner B own shop/catalogue | PASS | Sees 1 own shop, 1 own catalogue row, 1 active product. |
| Owner B cross-owner shop/catalogue/product-ID reads | PASS | Sees 0 Owner A shop rows, 0 Owner A catalogue rows and 0 rows for A product ID. |
| Cross-owner catalogue INSERT (A→B and B→A) | PASS | Both rejected by RLS `WITH CHECK`, SQLSTATE `42501`. |
| Tampered shop owner on INSERT (A creates shop with B user_id) | PASS | Rejected by shops RLS `WITH CHECK`, SQLSTATE `42501`. |
| Tampered catalogue shop_id / move A product to B shop | PASS | Rejected by item_catalog RLS `WITH CHECK`, SQLSTATE `42501`. |
| Tampered shops.user_id UPDATE by owner A | PASS | Denied by column-level grant; SQLSTATE `42501`. |
| Cross-owner catalogue UPDATE/DELETE by A against B product | PASS | Both affected 0 rows; no cross-owner mutation. |
| Own catalogue insert/update and own shop insert | PASS — rollback | All allowed under owner scope; transaction rolled back; no extra rows persisted. |
| Anonymous shop/catalogue SELECT | PASS | Anon role denied by table privileges (SQLSTATE `42501`). |
| Auth sign-in and HTTP PostgREST behavior | NOT RUN | Synthetic fixture identities have no passwords; direct REST/UI execution not completed. |
| IndexedDB Owner A/B draft partitioning | NOT RUN | Requires actual browser sessions and saved drafts under each authenticated owner. |

### Supabase advisor findings

- Security Advisor: no table/RLS security lint findings. It reports `auth_leaked_password_protection` — leaked-password protection is disabled (WARN). This setting was not changed.
- Performance Advisor: no remaining unindexed-FK finding after `shops_user_id_idx` was added; four `auth_rls_initplan` warnings remain for baseline-style `auth.uid()` calls in owner policies. Policy semantics were not rewritten during this acceptance setup.
- Health Advisor: no findings.
- The project is intentionally a test environment; these advisor results are not production certification.

### AG-02 disposition

AG-02 remains **BLOCKED**. The database-level RLS isolation tests listed above passed, but required sign-in-capable Owner A/B sessions, direct PostgREST tests, authenticated application/browser route execution, IndexedDB owner/shop partitioning, sanitized HTTP/browser evidence and independent review are outstanding. No test is being represented as complete beyond its stated layer.

### Remaining cross-gate controls

- AG-01: no independent PO-nominated GitHub tester. No repository access granted.
- AG-03: PO-provided physical printer, A6 paper and operator remain outstanding.
- AG-04: browser OFF-01–OFF-10 not executed; no offline feature added.
- AG-05/AG-06/AG-07: retain prior scope-limited evidence and tested-SHA qualifications.
- AG-08: intended attribution recorded in Issue #46, but ownership/employer/contributor/third-party rights evidence outstanding; LICENSE unchanged.


## Phase 4B addendum — source reconciliation, Auth/PostgREST capability and reviewer readiness

Date: 2026-11-19 (UTC). Detailed evidence: [PHASE4B_AUTH_POSTGREST_ISOLATION_2026-11-19.md](PHASE4B_AUTH_POSTGREST_ISOLATION_2026-11-19.md).

### Repository discrepancy audit

- Live corrective branch HEAD at the pre-report audit: `7861c5488bbc37ed38752435d11fa7d669b5ed55`.
- GitHub compare merge-base: approved application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`.
- Ahead / behind: 25 / 0.
- Baseline-to-HEAD changed-file list: 11 files — three workflows, six acceptance documents, package.json and package-lock.json. No application-source path is present.
- The only source patch in the approved baseline commit itself is one line in `src/app/dashboard/draft-memo/page.tsx`; this is already part of the PO-approved baseline.
- Blob SHA comparisons for the Draft Memo route, Supabase adapter, invoices page, dashboard page, draft memo store and draft memo domain match exactly between baseline and audited HEAD.
- Conclusion: no unapproved application-source change after the approved baseline was found. No source file was reverted or changed during Phase 4B.

### Supabase scope re-audit

- Project `kidrysdtgmhmpogwxzzx` remains `ACTIVE_HEALTHY`, PostgreSQL 17.12, Singapore region, Free plan, $0/month quoted creation cost.
- Applied migrations remain `20261119062535 / 20261119_phase4_draft_memo_scope` and `20261119063019 / 20261119_phase4_catalog_index_alignment`.
- Public base tables remain only `shops` and `item_catalog`, both with RLS enabled.
- Public views, functions/routines and triggers: none.
- Owner policies and grants remain unchanged. Anonymous SELECT remains unavailable. Shop owner identity cannot be changed by an authenticated client because the update grant omits `user_id`.
- Security Advisor: no table/RLS lint; `auth_leaked_password_protection` warning remains and was not changed.
- Performance Advisor: four `auth_rls_initplan` warnings remain; no policy rewrite performed.
- Health Advisor: no findings.
- No prohibited data model or public feature was added.

### Auth and PostgREST capability blocker

The connected Supabase integration does not expose supported Auth Admin user creation, signup/sign-in, token issuance/retrieval or generic HTTP/PostgREST request operations. The connected browser interface is read-only. Therefore no real Auth accounts were created and no direct HTTP request could be executed. The two previous synthetic auth.users rows remain database-only fixtures without password hashes; they are not sign-in-capable users. No password hash insertion or service-role workaround was attempted.

Direct PostgREST tests, real sign-in, application route execution and browser IndexedDB checks are NOT RUN / BLOCKED, not passed or failed. Previous SQL-layer tests using simulated authenticated JWT claims remain partial database RLS evidence only.

### Independent QA onboarding

The existing QA package now contains the minimum reviewer competency profile, PO nomination and username requirement, read-only repository access rules, isolated project access controls, secure disposable-credential handover, token redaction and cleanup instructions. QA-01–QA-14, evidence checklist, defect template and signed report template remain available.

No independent reviewer has been nominated. No repository access has been granted. PM execution is not independent QA.

### Phase 4B disposition

- AG-01: BLOCKED — no PO-nominated independent reviewer or approved username.
- AG-02: BLOCKED — prior SQL RLS evidence remains partial; Auth, direct PostgREST, authenticated browser and IndexedDB tests not run.
- AG-03: BLOCKED — no physical A6 print/measurement evidence.
- AG-04: BLOCKED — OFF-01–OFF-10 browser tests not run.
- AG-05, AG-06 and AG-07: prior scope-limited PASS evidence unchanged.
- AG-08: BLOCKED — ownership, employer IP and third-party/contributor rights remain unverified.

### Required next PO actions

1. Nominate an independent reviewer by exact GitHub username and approve read-only access to the PRIVATE repository.
2. Authorize an Auth-capable, secure test path for this isolated Supabase project that supports disposable user creation/sign-in and direct PostgREST HTTP requests.
3. Approve secure time-limited credential handover for disposable Owner A/B accounts. Do not send passwords, bearer tokens or service-role keys through GitHub or this report.
4. Have the independent reviewer execute QA-01–QA-14 and sign/date the evidence report.
5. Execute OFF-01–OFF-10 only when real test accounts and an authorized browser runner are available.

No acceptance status is upgraded by Phase 4B. All merge/deployment/pilot/production/public-release restrictions remain in force.
