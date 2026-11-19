# DokanTools — Phase 4B Auth, PostgREST and Source Reconciliation Report

Date: 2026-11-19 (UTC)  
Execution owner: PM / repository owner (not independent QA)  
Repository: Hasnat26/DokanTools (PRIVATE)  
Application-under-test baseline: 437e76c1c0261d43c5b419a80aa3bed890331aff  
Corrective branch: corrective/a6-a4-print-controlled-2026-11-17  
Branch HEAD at pre-report audit: 7861c5488bbc37ed38752435d11fa7d669b5ed55  
Main SHA: b07d47bef332d641ec10ce7a96a9ab30a1ea5eab  
Supabase project: kidrysdtgmhmpogwxzzx

## 1. Executive disposition

**AG-02 remains BLOCKED — partial database-layer RLS evidence only.**

The GitHub source-diff discrepancy has been reconciled. The live corrective branch is a descendant of the approved application baseline. GitHub compare reports the baseline itself as the merge-base, 25 commits ahead, zero behind. The baseline-to-current-HEAD changed-file list contains package manifests, GitHub workflows and acceptance documentation only; it contains no application-source paths. Selected Draft Memo, Supabase adapter, invoices and dashboard files have identical Git blob SHAs at the baseline and audited HEAD.

The Supabase project remains healthy and restricted to two public application tables. The connected integration does not expose supported Auth user creation, signup/sign-in, token issuance or a generic HTTP/PostgREST request action. Consequently, this execution could not create sign-in-capable owners or run direct PostgREST, application-browser or IndexedDB acceptance tests. Existing SQL fixture rows remain database-only fixtures, not Auth accounts. No credentials or password hashes were fabricated.

No acceptance gate is promoted to PASS by this report. No main merge, deployment, production database operation, pilot, public release or repository visibility change occurred.

## 2. GitHub mandatory discrepancy audit

### 2.1 Live ref and ancestry

At the pre-report audit time, GitHub resolved the actual corrective branch ref to:

- Corrective branch HEAD: 7861c5488bbc37ed38752435d11fa7d669b5ed55
- Approved baseline: 437e76c1c0261d43c5b419a80aa3bed890331aff
- Merge-base reported by GitHub compare: 437e76c1c0261d43c5b419a80aa3bed890331aff
- Ahead / behind: 25 ahead, 0 behind.
- Main: b07d47bef332d641ec10ce7a96a9ab30a1ea5eab, unchanged.
- Repository visibility: private.

The baseline is an ancestor of the current corrective branch. The reported Phase 4 documentation commit d5082bf1b30944b8dd235ce4002106a7d3e49230 is a real commit and is now an ancestor of the branch HEAD; it is not the live branch HEAD after the subsequent QA-onboarding documentation commit.

### 2.2 Complete baseline-to-HEAD changed-file list

GitHub compare from the approved baseline to the live branch ref returned these 11 paths:

1. .github/workflows/acceptance-postgres.yml
2. .github/workflows/acceptance-security-audit.yml
3. .github/workflows/audit-targeted-postcss-patch.yml
4. docs/acceptance/ACCEPTANCE_REGISTER_2026-11-19.md
5. docs/acceptance/AG06_SECRET_SCAN_SCOPE.md
6. docs/acceptance/AG07_DEPENDENCY_TRIAGE.md
7. docs/acceptance/INDEPENDENT_QA_PACKAGE.md
8. docs/acceptance/OFFLINE_BEHAVIOR_TEST_PROTOCOL.md
9. docs/acceptance/PHYSICAL_A6_PRINTER_PROTOCOL.md
10. package-lock.json
11. package.json

Classification:
- Application source under src/: 0 changed paths after the approved baseline.
- Dependency/package files: package.json and package-lock.json.
- Acceptance documentation: the six docs/acceptance paths listed above.
- GitHub workflows: the three .github/workflows paths listed above.

### 2.3 Why source paths appeared in a cumulative output

The approved baseline commit itself, 437e76c1c0261d43c5b419a80aa3bed890331aff, has a one-file source diff against its parent:

- src/app/dashboard/draft-memo/page.tsx

The exact one-line correction in that commit changes malformed React state destructuring from the invalid owner state declaration to the valid useState tuple declaration. This is the approved baseline commit itself. It is not a later corrective-branch change.

The other source paths cited in the discrepancy were checked at both the baseline and audited HEAD. Their Git blob SHAs are identical:

| Application path | Baseline blob SHA | Audited HEAD blob SHA | Result |
|---|---|---|---|
| src/app/dashboard/draft-memo/page.tsx | 1477b017dd2a4343bf1b8f352ed9b82fb95d7c40 | 1477b017dd2a4343bf1b8f352ed9b82fb95d7c40 | IDENTICAL |
| src/lib/supabase.ts | 2aea19421303be909a2be1a8a0cd85dea63db15d | 2aea19421303be909a2be1a8a0cd85dea63db15d | IDENTICAL |
| src/app/dashboard/invoices/page.tsx | 88d7d3595c09463845cfacee9a3c4dc06393f8e7 | 88d7d3595c09463845cfacee9a3c4dc06393f8e7 | IDENTICAL |
| src/app/dashboard/page.tsx | fe4f69430badce0b0a1068a8ec13a1231f4f9333 | fe4f69430badce0b0a1068a8ec13a1231f4f9333 | IDENTICAL |
| src/lib/draft-memo-store.mjs | ed689c30252f5479fc79feadcb01fa081e852645 | ed689c30252f5479fc79feadcb01fa081e852645 | IDENTICAL |
| src/lib/draft-memo-domain.mjs | d50d7706af85ff7aace87d137e110d901b944834 | d50d7706af85ff7aace87d137e110d901b944834 | IDENTICAL |

**Conclusion:** no unapproved application-source modification newer than the approved baseline was found. The prior register statement that no application source changed after the baseline is supported by the live GitHub compare and blob-SHA verification. No source file was reverted, edited or merged during this audit.

## 3. Supabase project and schema re-audit

### 3.1 Environment

| Field | Verified value |
|---|---|
| Organization | hasece26@gmail.com's Org |
| Organization ID | eqigcdjmasfqmumlpqiy |
| Plan | Free |
| Project name | dokantools-phase4-isolated-qa |
| Project reference | kidrysdtgmhmpogwxzzx |
| Region | ap-southeast-1 (Singapore) |
| Status | ACTIVE_HEALTHY |
| PostgreSQL | 17.12.0.000 / engine 17 |
| Project cost confirmed at creation | $0/month |

No new Supabase project was created for Phase 4B.

### 3.2 Applied migration ledger

| Version | Migration name |
|---|---|
| 20261119062535 | 20261119_phase4_draft_memo_scope |
| 20261119063019 | 20261119_phase4_catalog_index_alignment |

### 3.3 Exact public object inventory

Public base tables:
- public.shops — RLS enabled.
- public.item_catalog — RLS enabled.

Other public objects:
- Views: none.
- Routines/functions: none.
- Triggers: none.
- Additional public tables: none.

Foreign keys:
- shops.user_id → auth.users.id ON DELETE CASCADE.
- item_catalog.shop_id → shops.id ON DELETE CASCADE.

Indexes:
- shops_pkey
- shops_user_id_idx
- item_catalog_pkey
- item_catalog_shop_id_name_key (unique on shop_id, name)

### 3.4 RLS policies and grants

Policies currently present:

- shops / owner reads own shops: SELECT for authenticated, predicate auth.uid() = user_id.
- shops / owner creates own shop: INSERT for authenticated, WITH CHECK auth.uid() = user_id.
- shops / owner updates own shop: UPDATE for authenticated, both USING and WITH CHECK require auth.uid() = user_id.
- item_catalog / owner manages item catalog: ALL for authenticated, USING and WITH CHECK require an existing shops row with matching shops.id = item_catalog.shop_id and shops.user_id = auth.uid().

Privileges:
- anon: no table or column SELECT/INSERT/UPDATE/DELETE grants on either table.
- authenticated: shop SELECT; column-limited shop INSERT and UPDATE; no shop DELETE. Catalogue SELECT/INSERT/UPDATE/DELETE grants are present and are row-filtered by the owner RLS policy.
- Column-level shop INSERT permits the required ownership value and shop profile fields. Column-level shop UPDATE omits user_id, so an owner cannot change the owner identity through the client grant.

No RLS policy or grant was weakened during Phase 4B.

### 3.5 Advisor findings

- Security Advisor: no table/RLS security lint findings. Warning auth_leaked_password_protection remains: leaked-password protection is disabled. No setting was changed.
- Performance Advisor: four existing auth_rls_initplan warnings remain on the three shops owner policies and the item_catalog owner policy. No policy expression was rewritten. The unindexed owner FK finding is absent after shops_user_id_idx was added in the prior Phase 4 index migration.
- Health Advisor: no findings.

## 4. Auth user provisioning capability and disposition

The connected Supabase integration was inspected for available account/project operations. It exposes project/organization inspection, project creation, SQL/migration operations, table/schema inspection, advisors, keys and Edge Function operations. It does **not** expose any supported action for:
- Supabase Auth Admin API user creation;
- signup or sign-in;
- password reset or sign-in link delivery;
- access/refresh token issuance or retrieval;
- a generic authenticated HTTP request to the Supabase Auth/PostgREST endpoints.

The connected browser integration exposes tab listing and tab-content reading only; it does not provide browser control for form submission or navigation.

Consequently:
- No sign-in-capable Owner A/B accounts were created.
- No passwords, access tokens, refresh tokens or cookies were generated or handled.
- No passwords were inserted or hashed directly into auth.users.
- The existing synthetic fixture rows remain database-only fixtures, not Auth users. Their UUIDs are:
  - Owner A fixture: 11111111-1111-4111-8111-111111111111
  - Owner B fixture: 22222222-2222-4222-8222-222222222222
- Those fixture rows have no password hashes and must not be treated as credentials or sign-in identities.

This is a connector-capability blocker, not an Auth test failure. Per the execution mandate, no workaround using direct password-hash insertion or service-role credentials was attempted.

## 5. Direct PostgREST acceptance test matrix

No real Auth access token was available, and no direct HTTP request operation is exposed. Therefore the direct PostgREST cases below were NOT RUN, rather than passed or failed.

| Test | Status | Reason |
|---|---|---|
| Owner A GET own shop | NOT RUN | No sign-in-capable Owner A or access token |
| Owner B GET own shop | NOT RUN | No sign-in-capable Owner B or access token |
| A GET B shop by ID | NOT RUN | No Auth/PostgREST request capability |
| B GET A shop by ID | NOT RUN | No Auth/PostgREST request capability |
| A GET B catalogue | NOT RUN | No Auth/PostgREST request capability |
| B GET A catalogue | NOT RUN | No Auth/PostgREST request capability |
| A INSERT under A shop | NOT RUN | No Auth/PostgREST request capability |
| A INSERT under B shop | NOT RUN | No Auth/PostgREST request capability |
| B UPDATE A catalogue item | NOT RUN | No Auth/PostgREST request capability |
| B DELETE A catalogue item | NOT RUN | No Auth/PostgREST request capability |
| Tampered owner ID | NOT RUN | No Auth/PostgREST request capability |
| Tampered shop ID | NOT RUN | No Auth/PostgREST request capability |
| Reassign A product to B shop | NOT RUN | No Auth/PostgREST request capability |
| Anonymous SELECT HTTP request | NOT RUN | No direct HTTP request capability |
| Missing/invalid JWT HTTP request | NOT RUN | No direct HTTP request capability |

Do not infer HTTP status codes or PostgREST error bodies from the earlier SQL claim-context tests.

## 6. Previously executed PostgreSQL RLS evidence — retain as partial only

These results are from the prior Phase 4 PM execution and are preserved as database-layer evidence, not Auth/PostgREST acceptance:

- With PostgreSQL role authenticated and simulated per-owner request JWT claims, A saw 1 own shop and 2 own catalogue rows; B saw 1 own shop and 1 own catalogue row.
- Each owner saw zero rows for the other owner's shop/catalogue identifiers.
- Cross-owner catalogue INSERT, tampered shop owner INSERT and product reassignment to the other owner's shop were rejected with SQLSTATE 42501.
- Cross-owner UPDATE/DELETE against the other owner's catalogue rows affected zero rows.
- Owner A's own catalogue/shop writes were accepted in test transactions that were rolled back.
- Anonymous role SELECT was denied by database privileges.

No new SQL acceptance tests were claimed in Phase 4B. Existing fixture totals remain 2 shop rows, 3 catalogue rows and 2 database-only Auth fixture rows.

## 7. Application and IndexedDB test status

The approved application files remain byte-for-byte the same Git blobs at the audited HEAD and baseline. However, the application runtime was not launched because no genuine Auth sessions could be provisioned in the available connected environment.

| Required application/IndexedDB evidence | Status |
|---|---|
| Owner A sign-in and /dashboard/draft-memo startup | BLOCKED |
| Owner B sign-in and /dashboard/draft-memo startup | BLOCKED |
| Own-shop and active-catalogue UI isolation | BLOCKED |
| Draft create/save/reload/edit/delete via UI | BLOCKED |
| Snapshot/price association | BLOCKED |
| Tampered draft identifiers | BLOCKED |
| Cross-owner draft retrieval/mutation | BLOCKED |
| A logout followed by B login isolation | BLOCKED |
| IndexedDB database/object-store inspection in browser | BLOCKED |
| Browser screenshots, sanitized HAR and console evidence | BLOCKED |

Source review remains limited to the approved source baseline:
- The Draft Memo route calls Supabase Auth getUser(), reads the owner shop and active catalogue, then calls IndexedDB-backed draft list/save functions.
- Draft storage keys include owner ID, shop ID and draft ID, and stored records are checked against owner/shop identity.
- These source facts do not prove browser runtime isolation. RLS does not automatically protect local IndexedDB contents.

No service worker, cache, offline queue, synchronization mechanism or other product feature was added.

## 8. Independent QA onboarding readiness

The existing INDEPENDENT_QA_PACKAGE.md contains QA-01–QA-14, local setup instructions, test procedures, evidence rules, defect template and signed report template. Phase 4B adds:
- Minimum independent reviewer competency profile.
- PO nomination and GitHub username approval requirement.
- Read-only private-repository access request.
- Isolated Supabase access constraints.
- Time-limited secure disposable-credential handover requirements.
- Token/cookie redaction and cleanup requirements.

No reviewer has been nominated. No private-repository access has been granted. The PM is the execution owner for this report and is not an independent reviewer.

## 9. Defect / blocker register

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| P4B-01 | Blocker | Connected Supabase integration has no supported Auth Admin/signup/sign-in/token operation | Escalate connector capability or use a PO-approved Auth-capable execution environment |
| P4B-02 | Blocker | No generic HTTP/PostgREST request capability is available in the connected execution tools | Provide a PO-approved authenticated HTTP runner or independent tester environment |
| P4B-03 | Blocker | No independent QA reviewer has been nominated by GitHub username | PO to nominate reviewer and approve read-only repo access |
| P4B-04 | Blocker | Without Auth sessions, authenticated application and IndexedDB runtime tests cannot be executed | Complete after P4B-01/P4B-02 prerequisites and secure test-account handover |

No application code defect was observed or asserted by the Phase 4B tool-capability checks. Absence of runtime evidence is not evidence that the application passes.

## 10. Gate disposition

| Gate | Phase 4B disposition |
|---|---|
| AG-01 Independent QA | BLOCKED — no PO-nominated reviewer or repo access |
| AG-02 Supabase RLS | BLOCKED — database-layer SQL tests remain partial; Auth, PostgREST, application and IndexedDB tests not run |
| AG-03 Physical A6 | BLOCKED — no physical printer execution in Phase 4B |
| AG-04 Offline behavior | BLOCKED — OFF-01–OFF-10 browser tests not run |
| AG-05 PostgreSQL concurrency | PASS — scope-limited, prior evidence unchanged |
| AG-06 Secret scan | PASS — scope-limited, prior evidence unchanged |
| AG-07 Dependency audit | PASS — prior tested-SHA limitation unchanged |
| AG-08 MIT attribution | BLOCKED — ownership/employer/contributor/third-party rights still unverified |

## 11. Required PO / execution actions

1. Nominate an independent reviewer by exact GitHub username and approve read-only access to this PRIVATE repository.
2. Provide/authorize a secure Auth-capable path for the isolated project that supports disposable account creation, sign-in, token use and direct PostgREST HTTP requests. Do not provide production credentials or a service-role key.
3. Approve the secure, time-limited credential handover process documented in the QA package.
4. Reviewer independently executes QA-01–QA-14 and signs/dates the report; PM's database-layer SQL evidence remains supporting evidence only.
5. Execute OFF-01–OFF-10 only after real test accounts and an authorized browser runner are available.

## 12. Governance confirmation

- Repository remains PRIVATE.
- Main remains b07d47bef332d641ec10ce7a96a9ab30a1ea5eab.
- No unapproved application-source modification after the approved baseline was found.
- No Auth password hashes were fabricated.
- No credentials or tokens were exposed or committed.
- No production project or database was accessed.
- No merge, deployment, pilot, release, public publication or visibility change occurred.
- No invoice, payment, tax, discount, stock, sales, ledger, public QR, verification or offline-sync functionality was activated.
