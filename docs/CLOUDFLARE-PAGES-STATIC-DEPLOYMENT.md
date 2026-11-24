# Cloudflare Pages — DokanTools Static PWA

## Build configuration

- Framework: Next.js static export
- Build command: npm ci && npm run build
- Output directory: out
- Node.js: 20 or newer
- No application server or per-invoice backend is required for the local invoice workspace.

The application uses Next.js output export. API routes and dynamic server routes are removed from the static invoice/public-profile path. Local invoice calculation, IndexedDB persistence and jsPDF generation run in the browser.

## Cloudflare Pages project

1. Create a Pages project from the DokanTools Git repository.
2. Keep the existing production branch unchanged (normally `main`). Do NOT select the migration branch as production; configure it only as a preview branch.
3. Configure the build command and output directory above.
4. Set the environment variable NEXT_PUBLIC_GOOGLE_CLIENT_ID to the OAuth Web client ID only if Drive backup is being enabled. This is a public OAuth client identifier, not a client secret.
5. Add the exact Pages preview/production origin to Google OAuth authorized JavaScript origins.
6. Build and test the preview URL, offline reload, IndexedDB draft recovery, PDF generation and Drive backup/restore.
7. Do not promote to production until the PO release gate and acceptance record are separately approved.

## Cost and deployment boundary

Cloudflare Pages is the approved preferred static hosting target. No Cloudflare deployment has been performed by this migration branch. Production deployment and promotion remain separate approval gates. Static asset delivery is not billed per invoice; Cloudflare account limits and current plan terms still apply.

## Static-export constraints

The core local invoice route does not require Supabase or a server endpoint. Legacy dashboard features still call Supabase for Auth, catalogue, stock, memo, baki and shop management; they are not yet converted to local-first and require the existing cloud environment if used. A static build can distribute their client code, but it does not make those features offline or remove their Supabase dependency.

The public shop profile has been changed to a query-string route: /shop?shopId=SHOP_ID. QR/WhatsApp links must use this form because static hosting cannot pre-render arbitrary shop IDs.


## Authorized preview setup (2026-11-24)

Cloudflare account/project authorization is not available in this execution. The owner or authorized Pages maintainer must confirm the existing project and connect the Cloudflare GitHub App to `Hasnat26/DokanTools` (repository access only). Do not send account passwords, session cookies or API tokens in chat.

In Workers & Pages → existing Pages project → Settings → Builds → Branch control, keep the current production branch unchanged and include `feature/browser-first-local-first-pwa-2026-11-24` in Preview branches. Use repository root, `npm ci && npm run build`, output directory `out`, Node 20+. Git integration should create/update the PR preview URL. Record the actual URL and deployment commit SHA from Cloudflare's deployment details.

Cloudflare official guides: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/ ; https://developers.cloudflare.com/pages/configuration/build-configuration/ ; https://developers.cloudflare.com/pages/configuration/preview-deployments/.

Hosted acceptance must verify app load, service-worker-controlled offline reload, IndexedDB save/reopen, local calculation, fresh A6 PDF download, and absence of Supabase/invoice API requests from local invoice actions. Google Drive OAuth is optional and can be configured after the preview exists; it is not a prerequisite for preview or local invoice operation.
