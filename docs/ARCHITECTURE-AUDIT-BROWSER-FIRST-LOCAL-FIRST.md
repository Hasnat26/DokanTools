# DokanTools V1 — Browser-First / Local-First Dependency Audit

**PO decision:** Approved 2026-11-24  
**Audit baseline:** delivery branch at 357a69690d43f640b2850f900bb871c79e8eda0a  
**Migration branch:** feature/browser-first-local-first-pwa-2026-11-24

## 1. Current dependency map

| Area | Current implementation | Migration disposition |
||---|---|
| Supabase Auth | Login/signup, dashboard and shop ownership checks use browser Supabase Auth | Remove as a prerequisite for local invoice workspace; retain only in legacy cloud-backed modules until separately migrated |
| Supabase PostgreSQL | Shop profile, product catalogue, customers, stock, memos, baki and public shop data are read/written through Supabase | Not required for core local invoice workflow; preserve legacy modules during controlled migration |
| RLS | Tenant isolation for cloud-backed shop, catalogue, stock, memo and baki operations is enforced through Supabase policies/RPCs | Local workspace isolation is browser-origin/profile scoped; Drive backups are account-owned. RLS is not a control for local records |
| Invoice-First draft persistence | src/lib/invoice-draft-store.mjs uses IndexedDB; draft identity includes owner and shop IDs obtained from Supabase | Reuse browser storage, remove cloud-auth identity dependency from local workspace |
| Invoice calculation | src/lib/invoice-domain.mjs calculates line amounts and total in browser; server RPC remains authoritative for issuance | Browser-only calculation for drafts/PDF; use integer minor units and preserve PO-10 total-only scope |
| Invoice issuance | src/app/api/invoices/route.ts contains a hard-coded disabled guard and returns HTTP 423 for valid issue requests; UI also disables issuance | No issuance endpoint in static app; keep a tested explicit disabled guard and do not enable |
| Invoice history/detail | /api/invoices and /api/invoices/[invoiceId] authenticate with Supabase and read PostgreSQL | Remove from static core workflow; no central issued-invoice history until separately approved |
| Invoice PDF | Existing invoice UI and Draft Memo PDF generation use browser-side jsPDF; share helper uses Web Share API | Keep PDF entirely client-side; generate from current draft revision, then download/share |
| Draft Memo persistence | src/lib/draft-memo-store.mjs uses IndexedDB, but shop/catalogue are loaded from Supabase | Existing Draft Memo is a separate legacy workflow; migrate its data sources in a later controlled step |
| Legacy memo/baki | memo/page.tsx and baki/page.tsx use Supabase RPCs and PostgreSQL transactions; memo flow includes stock/customer/ledger semantics | Out of core invoice scope; do not silently replace transaction semantics with local-only operations |
| API/runtime | Two Node/dynamic invoice API routes exist under src/app/api/invoices/ | Incompatible with Next.js static export; remove only when replacement local workflow and issuance-off test are in place |
| Dynamic route | /shop/[shopId] fetches public shop data client-side but requires dynamic path generation for static export | Convert to query-string client route (/shop?shopId=...) or keep a separate Worker only with PO approval |
| Next.js deployment | next.config.mjs currently has no static export setting; default build uses Next runtime | Configure static export after eliminating API routes and unresolved dynamic routes |
| Existing local storage | IndexedDB invoice drafts, Draft Memo drafts, pending memo recovery; browser demo uses localStorage | IndexedDB remains primary store; no invoice content in hosting logs/analytics |

## 2. Static export blockers identified

1. src/app/api/invoices/route.ts uses runtime = nodejs and dynamic = force-dynamic.
2. src/app/api/invoices/[invoiceId]/route.ts is a dynamic Node API route.
3. src/app/shop/[shopId]/page.tsx is a dynamic route with customer-specific IDs and no finite static parameter list.
4. Dashboard and legacy features currently depend on Supabase Auth/PostgreSQL at runtime. Browser-side Supabase calls can technically exist in a static bundle, but they do not meet the local-first core workflow requirement and require cloud service configuration.

No server-side PDF renderer was found in the inspected invoice path. Invoice calculations already have a browser preview; issuance is currently disabled and depends on a server/database transaction.

## 3. Migration boundary

The first local-first workspace will own shop details, products, customers and draft invoices in IndexedDB. It will not call Supabase, /api/invoices, or any server action for create/edit/calculate/save/PDF/share.

Google Drive will use customer OAuth and the appDataFolder scope for manual backup/restore. Access tokens remain in memory only. Backup files contain invoice/workspace data, not OAuth credentials.

## 4. Required controls

- Invoice issuance is unavailable and remains OFF.
- Discount, VAT/tax, Paid and Due are excluded from Invoice-First PDF and calculation.
- A change to invoice data invalidates the in-memory PDF artifact; PDF is regenerated from the latest saved/current revision.
- Browser storage is best-effort, not permanent. Backup/export and restore are required.
- Separate browser profiles/contexts are the local isolation boundary. A shared browser profile is not a secure multi-user boundary.
- Cloudflare Pages deployment, OAuth client registration, Google API quota validation and real-device acceptance remain external verification items.

## 5. Execution sequence

1. Dependency audit and local-first domain/storage foundation.
2. Browser-only invoice workspace and local A6 PDF.
3. Google Drive manual backup/restore and recovery UI.
4. Static-export refactor: remove invoice API routes, convert dynamic public shop route, add PWA shell/offline assets.
5. Cloudflare Pages build/deployment validation.
6. Regression/security tests and updated release evidence.

This audit is an implementation baseline, not acceptance evidence.