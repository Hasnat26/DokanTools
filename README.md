# DokanTools — V1 shop management and Draft Memo

DokanTools is a mobile-first shop-management application for small businesses in Bangladesh.

> **V1 software integration:** PR [#47](https://github.com/Hasnat26/DokanTools/pull/47) is merged into `delivery/dokantools-v1-2026-11-19` at `2f257211e5f296d49b7ccf30e50fedcb2530a9f5`. Post-merge CI [Run #199](https://github.com/Hasnat26/DokanTools/actions/runs/45166285135) completed with all five required jobs PASS. This is a software validation result, not production authorization.

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

See [PR #47 post-merge closeout](./docs/PR47-POST-MERGE-CLOSEOUT.md) for the job IDs, functional matrix, A6 artifact hashes, security evidence and remaining acceptance items.

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

PR #47 does not authorize deployment, hosted migration, production data changes, invoice issuance activation or customer pilot. Invoice issuance remains OFF. The API returns HTTP 423 with `INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL` for a valid issue request; the database runtime control is seeded disabled and inaccessible to the authenticated role, and the transaction RPC fails closed while disabled.

Not yet accepted: Android Chrome native share, WhatsApp delivery to a real recipient, physical A6 printer/driver acceptance, hosted migration, backup/restore drill, deployment/rollback readiness and live pilot. Full offline transaction outbox/sync, conflict resolution, and linked invoice-settlement workflows remain outside the verified PR #47 scope.

The separate browser-local demo at `/draft-memo-demo.html` is not the authenticated Supabase workflow. See [Draft Memo demo notes](./docs/DRAFT_MEMO_MVP_DEMO.md).
