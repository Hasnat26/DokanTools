# Independent QA execution package — DokanTools Draft Memo

## Authorization and target

- Repository: `Hasnat26/DokanTools` (PRIVATE).
- Branch: `corrective/a6-a4-print-controlled-2026-11-17`.
- Application-under-test baseline: `437e76c1c0261d43c5b419a80aa3bed890331aff`.
- Branch head at package preparation: `c5516e7c6d02dc86f10ad99765df58534d7b7b76`.
- Route: `/dashboard/draft-memo`.
- QA owner: independent reviewer nominated by the PO; not the PM or candidate author.
- Environment: local developer workstation or PO-authorized isolated staging environment only. No production URL, credentials or records.
- Status: execution BLOCKED until PO nominates an independent reviewer and authorizes private-repository read access plus test environment/accounts. See [Issue #46](https://github.com/Hasnat26/DokanTools/issues/46).

The baseline application commit is the code-under-test. The branch head may contain later evidence/workflow/documentation commits; do not silently substitute a newer application revision. Record the exact checkout SHA in the report.

## Prerequisites and access

1. PO supplies the independent tester's GitHub username and authorizes read access to the private repository.
2. PO provides a non-production Supabase project / isolated environment and authorizes creation of two disposable users, or provides two disposable accounts.
3. Create Owner A and Owner B using email/password auth. Each must own a separate shop with distinct active catalogue items and at least one inactive catalogue item.
4. Never request or use production credentials, production data, a service-role key in the browser, or a production URL.
5. Use a clean browser profile per owner. Keep credentials out of screenshots, logs and the signed report.

## Local setup

Prerequisites: Node.js 20 or newer, npm, Git, and a current Chromium-based browser.

```bash
git clone https://github.com/Hasnat26/DokanTools.git
cd DokanTools
git fetch origin
git checkout corrective/a6-a4-print-controlled-2026-11-17
git checkout 437e76c1c0261d43c5b419a80aa3bed890331aff
npm ci
cp .env.example .env.local
```

Edit `.env.local` locally with the PO-authorized disposable Supabase project values only:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ISOLATED-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_DISPOSABLE_PROJECT_ANON_KEY
```

Do not put a Supabase service-role key in `.env.local` or browser-visible variables. Do not commit `.env.local`.

```bash
npm run dev
```

Open `http://localhost:3000/login`, authenticate Owner A, then navigate to `/dashboard/draft-memo`. Repeat in a separate clean browser profile for Owner B.

Record `git rev-parse HEAD`, `node --version`, `npm --version`, browser name/version, OS, environment identifier (non-secret), and test account labels (A/B only).

## Test cases and expected outcomes

| ID | Test procedure | Expected result |
|---|---|---|
| QA-01 | Unauthenticated direct navigation to `/dashboard/draft-memo` | Redirect to login; no shop/catalogue/draft data displayed. |
| QA-02 | Sign in as A; load route | Only A's shop and active catalogue initialize. |
| QA-03 | Add at least three A catalogue products with varied quantities; edit quantity and unit price | Each line total and grand total match independent arithmetic to two decimal places; no discount/tax/payment fields. |
| QA-04 | Save draft, refresh, reload saved draft | Draft remains in A's browser IndexedDB and values persist. |
| QA-05 | Edit saved draft, save update, reload | Same draft identity updates; snapshots remain the saved product name/unit/price, not silently rewritten from catalogue. |
| QA-06 | Delete draft, refresh/list again | Deleted draft no longer appears. |
| QA-07 | Add inactive catalogue item in test fixture | Inactive item is not offered in selector. |
| QA-08 | In A session, attempt cross-owner shop/catalogue/draft read and write using UI/API and direct requests | No B data disclosed or modified; access denied/empty result as appropriate. Repeat symmetrically for B. |
| QA-09 | Inspect IndexedDB in A and B browser profiles | A/B draft keys and rows are distinct by owner/shop; no cross-profile draft leakage. |
| QA-10 | Create draft with Bangla and English product/shop names | Both scripts render legibly; inspect glyph shaping visually. |
| QA-11 | Attempt a long memo that exceeds A6 content area | UI rejects overflow; no shrink-to-fit, rotation, pagination or alternate page size. |
| QA-12 | Inspect browser-generated PDF and Ghostscript-finalized PDF separately | Browser output and final output are recorded as separate artifacts; final PDF boxes are A6; no content scaling; note clipping risks. |
| QA-13 | Review route network/API calls and database writes | No invoice issuance/RPC, sales, stock deduction, customer ledger, payment, VAT, discount, public QR or verification coupling. |
| QA-14 | Sign out A and sign in B in a clean profile | B sees only B's shop/catalogue/drafts. |

For arithmetic, record each input quantity, unit rate, line amount and total; calculate independently rather than accepting the UI total as its own oracle. Use synthetic names and values only.

## Evidence capture

For every test capture:
- Screenshot with test ID, browser visible, and sensitive account data redacted.
- Browser console output and relevant network request/response evidence (HAR with tokens/cookies removed).
- Test data table with synthetic product IDs/names and expected/actual values.
- Exact checkout SHA and environment versions.
- Defect ID, severity, reproducible steps, expected/actual behavior and sanitized logs.

Store evidence in the authorized private repository issue/artifact or PO-designated secure location. Do not attach access tokens, passwords, cookies, authorization headers, service-role keys or real customer data.

## Defect report template

```text
Defect ID:
Test ID:
Tester / date (UTC):
Commit SHA:
Environment / browser:
Severity: Critical / High / Medium / Low
Preconditions:
Steps to reproduce:
Expected result:
Actual result:
Frequency:
Screenshot / sanitized log reference:
Security or data-isolation impact:
Workaround:
Disposition: Open / Fixed / Retest / Accepted by PO
Retest commit and result:
```

## Signed QA report template

```text
I, [reviewer full name], confirm I independently executed the listed tests against
Hasnat26/DokanTools, branch [branch], commit [full SHA], in [non-production
environment] on [date/time UTC]. I did not rely on PM self-testing as test
execution. The attached evidence and defects accurately represent my observations.

Executed test IDs:
Passed:
Failed:
Blocked:
Defects:
Evidence index:
Reviewer signature / GitHub identity:
Review date:
```

## Important boundaries

This is a test package, not evidence that tests have been executed. GitHub Actions CI and PM source inspection are not independent QA. The separate browser-local demo is not a substitute for the authenticated route. No merge, deployment, pilot, production DB access or product-scope expansion is authorized.

## Independent reviewer qualification and secure onboarding — Phase 4B

### Minimum reviewer profile

The PO-nominated reviewer must be independent of the PM, candidate author and implementation decision-makers. The reviewer must be able to demonstrate hands-on competence in:

- Functional and negative testing of authenticated web applications.
- Browser DevTools use, including Network, Console, storage and IndexedDB inspection.
- REST API testing with bearer-token authentication and safe request/response evidence handling.
- Tenant-isolation testing, including JWT identity context, PostgREST/RLS expectations and tampered identifiers.
- Reproducible defect writing and signed, evidence-indexed test reporting.

A specific certification is not mandatory. The PO must approve the named reviewer and confirm independence and relevant experience before access is granted.

### Repository access request

1. PO supplies the exact GitHub username and explicitly approves access in Issue #46.
2. Grant **read-only** access to the PRIVATE repository, limited to the time required for QA.
3. Do not grant write, maintain, administrator or branch-protection bypass permissions.
4. Do not grant access before the PO-approved username is recorded.
5. Record the reviewer identity, approval comment, granted permission, date and eventual access removal.

### Isolated Supabase access requirements

- Use only project `kidrysdtgmhmpogwxzzx` (`dokantools-phase4-isolated-qa`); never production.
- Grant only the minimum project-level visibility and test capability required by the PO-approved test plan. Do not grant organization ownership or broad administrative access.
- Reviewer must not receive the service-role key, database superuser password or other bypass-RLS credentials.
- Supply only the disposable Owner A/B login credentials through the approved secure handover described below.
- Any additional dashboard/SQL permissions must be explicitly approved by the PO and removed after testing.

### Disposable credential handover

1. Create or reset test-only passwords using the supported Supabase Auth flow. Never create password hashes by direct SQL.
2. Use synthetic addresses under a controlled test domain and strong random, unique passwords.
3. Deliver each account separately using a PO-approved password manager's time-limited/one-time secret-sharing facility. Do not send passwords, recovery codes, access tokens or cookies through GitHub issues, repository files, ordinary email, screenshots or the acceptance report.
4. Keep Owner A and Owner B credentials separate. The reviewer must use separate clean browser profiles or an equivalent verified session-isolation method.
5. Do not include bearer tokens or cookies in HAR files. Redact Authorization headers, refresh tokens, passwords, Set-Cookie values and recovery links before retaining evidence.
6. After review, rotate/reset or disable the disposable accounts and remove temporary project/repository access as directed by the PO. Record only non-secret account UUIDs and the cleanup result.

### Execution and evidence handover

The reviewer receives this package, the Phase 4B evidence report, the exact application baseline SHA, isolated project reference, two disposable account labels (A/B), and the PO-approved secure credential-sharing instructions. The reviewer independently executes QA-01–QA-14 and signs the report template above. PM-generated SQL evidence is supporting context only; it must not be presented as the independent reviewer's own observation.

### Current access status

As of 2026-11-19 UTC, the PO has not nominated an independent GitHub username. No repository access has been granted to a reviewer. The connected Supabase integration does not expose Auth user administration, signup/signin or access-token issuance, and the connected browser interface is read-only. Accordingly, sign-in-capable account creation and reviewer credential handover remain blocked; do not substitute the existing SQL-only fixtures.
