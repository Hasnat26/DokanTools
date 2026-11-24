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
2. Select the migration branch for preview validation first.
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
