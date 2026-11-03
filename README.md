# DokanTools — reliability-foundation pilot build

DokanTools is a mobile-first starter for small shops in Bangladesh. This revision focuses on the current planning milestone: safer transaction writes, shop-level privacy, inventory movement history, idempotent retries, and repeatable domain tests.

> **Pilot status:** not production-ready. The SQL migration must be applied to a configured Supabase project, the application must be built in an environment with dependencies installed, and staging/authenticated tests must pass before real business records are used.

## What changed in this revision

- Memo creation and stock deduction now use one database RPC transaction. A failed stock check rolls back the memo and stock movements together.
- Memo sales, stock creation, stock-count corrections, and customer ledger entries have stable request IDs to prevent a retry in the same draft/session from posting the same operation twice.
- Stock quantity changes go through an audited adjustment RPC; opening stock and sales create stock-movement records.
- Memo due is written to the customer due ledger in the same database transaction; a due-bearing memo requires a selected or newly identified customer. Customer payments cannot exceed the currently recorded ledger balance, and idempotent retries are resolved before that balance check.
- Audit events record memo creation, customer due/payment entries, inventory creation, stock adjustment and inventory metadata changes. Customer/shop deletion is blocked from the ordinary app so a casual delete cannot cascade away financial history.
- A stock item’s base unit cannot be changed in this pilot build and sale units must match the stock unit; implicit kg/pack/piece conversion is deliberately blocked until explicit conversion rules are implemented.
- Public sharing is opt-in at the shop level. Only explicitly published products appear in a narrow public view. Raw shop profiles, inventory rows, memo summaries, item catalog rows and customer due balances are not exposed anonymously.
- Fixed Free/Pro quotas and an unverified subscription price are removed from user-facing screens pending real infrastructure-cost measurement.
- A dependency-free deterministic domain test suite and CPU-only microbenchmark are included.

## Run locally

1. Use Node.js 20 or newer.
2. Install dependencies when network access is available:

   ```bash
   npm install
   ```

3. Create a Supabase project and configure email/password authentication.
4. For a **new** database, run `supabase/schema.sql` in the Supabase SQL Editor.
5. For an **existing** database that already uses the previous starter schema, ensure the inventory catalog migration has been applied, then run `supabase/migrations/20261019_reliability_foundation.sql`.
6. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
7. Start the app:

   ```bash
   npm run dev
   ```

Do not put the Supabase service-role key in a browser environment. The web app uses the public anon key and relies on RLS plus narrowly scoped SQL functions.

## Verification commands

These commands do not require npm package downloads:

```bash
npm test
npm run verify:sql
npm run perf
```

The domain tests exercise money rounding, line validation, stock movement simulation, fail-closed stock checks and duplicate-request behavior. The SQL verification script is a **static source check**, not a database execution test. The microbenchmark is an in-process helper benchmark, not a network or Postgres load test.

When dependencies are installed, also run:

```bash
npm run lint
npm run build
```

Then test the SQL functions against staging with at least two separate shop accounts and verify RLS/public views before inviting pilot users.


## Windows PowerShell quick start

On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the execution policy. From this project's folder, run:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run verify:sql
npm.cmd run perf
npm.cmd run build
```

Run one command at a time when diagnosing failures. See [`START_HERE_BN.md`](./START_HERE_BN.md) for the full Bangla restart guide. Do not use `npm audit fix --force` without reviewing the proposed changes. The current package targets Next.js `15.5.28` and React `19.3.x`; package audit results still need checking after installation.

## Public shop page privacy

- The shop owner must explicitly publish the shop page from the dashboard.
- Individual products are hidden from the public page until the owner checks “পাবলিক দোকান পেজে পণ্যের নাম ও বিক্রয়মূল্য দেখান”.
- The public product view exposes only product name, unit, sale price, and a boolean stock-availability indicator. It does not expose purchase price, exact quantity or expiry.
- Customer names, phone numbers, dues, memos and memo summaries are not available on the public page. The previous phone-number-only public due lookup has been removed because it could reveal personal financial information.

## Known limitations before real pilot use

- A complete offline transaction queue / PWA service-worker implementation is **not yet included**. The app should not yet be represented as capable of creating and reliably syncing all transaction types without internet.
- The new SQL migration has not been executed against a live PostgreSQL/Supabase instance in this environment. Apply it in staging and validate the functions and grants before using this build with business data.
- The full Next.js lint/build and browser end-to-end tests could not be run in this environment because dependency installation could not reach the npm registry.
- Customer creation remains a separate call before a memo/ledger RPC. If the network response is lost during customer creation, refresh and verify the customer record before retrying.
- Memo sale and due are linked by the database RPC, but the separate manual customer-ledger form can still be used to enter the same sale’s due a second time. Pilot instructions must prohibit duplicating a memo’s already-recorded due; a linked invoice-settlement workflow remains future work.
- Payment gateways, SMS/WhatsApp APIs, OCR bill capture, automatic purchase orders and full multi-branch UI are not included in this stage.
- Backups and restore require configured infrastructure and an actual restore drill; this archive does not prove a deployed backup exists.

## Working principles

1. Preserve existing financial history; use adjustment/reversal records rather than silent edits.
2. Treat the database as the authority for transaction totals and inventory constraints.
3. Do not repeat a payment or sale until the previous operation status is checked.
4. Keep tenant isolation and basic data protection independent of future paid plans.
5. Expand pilot access only after critical data isolation, idempotency, stock/accounting, sync/recovery and usability acceptance tests pass.
