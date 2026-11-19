# Draft Memo offline behavior test protocol

## Scope and current implementation boundary

Target: authenticated `/dashboard/draft-memo`, application baseline `437e76c1c0261d43c5b419a80aa3bed890331aff`.

Source inspection shows that route initialization calls Supabase Auth `getUser()`, fetches the current owner's shop, fetches active catalogue items from Supabase, then loads the owner's/shop's drafts from IndexedDB. Draft save/list/load/delete use IndexedDB and validate owner/shop identity. The repository README explicitly states that a complete offline transaction queue / PWA service-worker implementation is not included. This protocol does not authorize implementing one.

Runtime execution is BLOCKED: no authorized isolated Supabase test project/accounts or browser QA operator is available. The following cases must be executed by the independent tester after PO authorization.

## Environment and data

Use isolated Supabase project, two disposable owners and synthetic catalogue entries. Use a clean Chromium profile. Record browser/OS versions and commit SHA. Use DevTools Network > Offline and Application > Storage/IndexedDB. Never use production credentials/data.

## Test matrix

| ID | Setup / action | Evidence and expected interpretation |
|---|---|---|
| OFF-01 | Fresh browser profile; enable Offline before first visit to route | Record whether login/auth, shop initialization and catalogue load work. Expected limitation: no prior local bootstrap means no locally cached authenticated shop/catalogue; do not assume first-time offline startup succeeds. |
| OFF-02 | Sign in and load shop/catalogue online; save a draft; then set Offline and refresh | Record whether Supabase `getUser()` and route initialization complete from cached session. Failure to initialize means local drafts may be present but route is not usable. |
| OFF-03 | With route initialized online, set Offline; inspect catalogue selector | Record whether in-memory catalogue remains available; refresh separately to distinguish memory from durable cache. No offline catalogue cache is claimed. |
| OFF-04 | With route initialized and page not refreshed, create and save draft offline | Expected candidate behavior: IndexedDB write can complete locally. Verify UI confirms save and inspect IndexedDB; report browser quota/storage errors. |
| OFF-05 | Reload offline after OFF-04 | Record whether authentication/shop bootstrap blocks route before draft listing; verify draft record remains in IndexedDB separately. |
| OFF-06 | If route remains usable offline, edit and save draft; then delete it | Record actual save/edit/delete result and IndexedDB before/after snapshots. If route cannot initialize, mark dependent actions blocked rather than pass. |
| OFF-07 | Reconnect and reload route | Verify whether local drafts remain; identify any overwrite, duplication, loss or unexpected server-side writes. The current design has no synchronization service, so do not expect cloud sync. |
| OFF-08 | Repeat OFF-04 to OFF-07 in Owner B profile | Verify Owner A local drafts do not appear in B profile; inspect owner/shop-scoped keys. |
| OFF-09 | Close browser completely while offline, reopen same profile, navigate to route | Record startup behavior, auth session status and IndexedDB persistence. |
| OFF-10 | Clear site data / IndexedDB after taking a backup copy of test data | Confirm local draft loss behavior and whether any server recovery exists. Do not use real data. |

## Expected current limitation

IndexedDB operations are local, but the authenticated route's startup is coupled to Supabase authentication, shop lookup and active catalogue lookup. The source does not establish a complete offline-first startup or catalogue cache, nor a reconnect synchronization/conflict-resolution mechanism. Drafts are browser-local; they are not automatically synced to a server. Browser profile/device changes or cleared site data may make local drafts unavailable.

These are source-derived limitations, not runtime test results. Do not claim offline acceptance until independent browser evidence exists. Do not add service workers, offline catalogue caching, sync queues, cache freshness rules or conflict resolution without separate PO authorization.

## Evidence record

For every test retain test ID, timestamp, commit SHA, browser/OS, offline toggle screenshot, sanitized console/network logs, IndexedDB before/after evidence, observed UI state, result and defect reference. Never capture auth tokens or passwords.
