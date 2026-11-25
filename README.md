# DokanTools — V1 shop management and Draft Memo

DokanTools is a mobile-first shop-management application for small businesses in Bangladesh.

> **V1 delivery baseline:** PR [#47](https://github.com/Hasnat26/DokanTools/pull/47) and documentation PRs [#50](https://github.com/Hasnat26/DokanTools/pull/50) and [#52](https://github.com/Hasnat26/DokanTools/pull/52) are merged into `delivery/dokantools-v1-2026-11-19`. Delivery candidate SHA at PR #52 merge: `81cf30a3feb9779e0b0ef7f43c88302298be84ed`. Post-merge CI [Run #205](https://github.com/Hasnat26/DokanTools/actions/runs/45321068072) completed with all five required jobs PASS. This is software/CI verification, not production authorization or external acceptance.

See the [V1 release readiness tracker](./docs/V1-RELEASE-READINESS-TRACKER.md) and [release runbook](./docs/V1-RELEASE-READINESS-RUNBOOK.md) for the current gate status.

## PO-approved browser-first local invoice workspace

The approved migration is tracked in [Draft PR #55](https://github.com/Hasnat26/DokanTools/pull/55). Open `/local-invoice/` for the standalone browser-only invoice workspace.

- Invoice calculation, IndexedDB draft persistence, A6 PDF generation, download and device sharing run in the browser.
- The local invoice path does not require Supabase Auth, PostgreSQL or an invoice API.
- Google Drive backup/restore is manual and uses the customer's OAuth authorization with the Drive appDataFolder scope. Configure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` with a public OAuth Web client ID only; never add a client secret.
- Next.js is configured for static export to `out/`; Cloudflare Pages build output is `out`.
- The local invoice workflow is draft-only. Invoice issuance remains OFF.
- Legacy shop administration, catalogue, stock, memo, baki and public-shop features still use Supabase and are not yet local-first.

See [architecture audit](./docs/ARCHITECTURE-AUDIT-BROWSER-FIRST-LOCAL-FIRST.md), [architecture diagram](./docs/ARCHITECTURE-BROWSER-FIRST-LOCAL-FIRST.md), [Cloudflare Pages setup](./docs/CLOUDFLARE-PAGES-STATIC-DEPLOYMENT.md), and [Google Drive backup setup](./docs/GOOGLE-DRIVE-BACKUP-SETUP.md).

## Verified V1 scope

- Authenticated Shop Profile create/edit, logo lifecycle and reload persistence.
- Google Maps link validation; opt-in public shop profile and QR destination.
- Shop-owned product categories and configurable catalogue CRUD.
- Inventory-linked catalogue identity protection and PostgreSQL tenant-integrity controls.
- Draft Memo creation/editing with multiple catalogue lines, quantity/unit-price validation and total calculation.
- Optional Draft Memo discount, VAT/tax, paid and due calculations. These remain Draft Memo-only; Invoice-First is total-only under PO-10.
- Local IndexedDB draft save, reload, edit and delete.
- Print handler, A6 PDF generation/download, PDF lifecycle invalidation and browser-simulated share fallback.
- Authenticated two-user category isolation against disposable local Supabase Auth/PostgREST/RLS.

See [PR #47 post-merge closeout](./docs/PR47-POST-MERGE-CLOSEOUT.md) for the functional matrix, A6 artifact hashes, security evidence and accepted software scope.

## Run locally

1. Use Node.js 20 or newer.
2. Install dependencies: `npm ci`.
3. Configure Supabase Auth and the public environment variables in `.env.local` using `.env.local.example`.
4. Apply the repository's forward migrations to an isolated development database following the current migration documentation.
5. Start the app: `npm run dev`.

Do not expose the Supabase service-role key to the browser. Tenant access depends on authenticated requests and database RLS.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run verify:sql
npm run perf
npm run build
```

The CI workflow additionally runs PostgreSQL 17 integrity tests, disposable local Supabase migration/RLS checks, authenticated Chromium E2E, and A6 PDF verification.

## Public shop privacy

- Shop profile publication is explicit opt-in.
- Product publication is separately controlled.
- Public product view is limited to product name, unit, sale price and stock-availability indicator.
- Customer names/phones, dues, memo records and exact inventory quantities are not exposed through the public shop page.

## Release boundary and remaining work

PR #47 software integration and PR #52 release-readiness documentation are merged. Invoice issuance remains OFF. The API returns HTTP 423 with `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL` for a valid issue request; the database runtime control is seeded disabled and inaccessible to the authenticated role, and the transaction RPC fails closed while disabled.

Still outstanding: approved DokanTools hosting target identification, target-matched migration and backup/restore/rollback drills, physical Android Chrome native share, WhatsApp delivery to a real consenting recipient, and physical A6 printer/driver acceptance. These are tracked in the [release readiness tracker](./docs/V1-RELEASE-READINESS-TRACKER.md) and [Issue #51](https://github.com/Hasnat26/DokanTools/issues/51). Production deployment, hosted production migration, customer pilot and invoice activation require separate PO authorization; invoice issuance must remain OFF.

Full offline transaction outbox/sync, conflict resolution, and linked invoice-settlement workflows remain outside the verified V1 scope.

The separate browser-local demo at `/draft-memo-demo.html` is not the authenticated Supabase workflow. See [Draft Memo demo notes](./docs/DRAFT_MEMO_MVP_DEMO.md).
