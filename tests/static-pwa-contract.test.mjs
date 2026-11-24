import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Next.js is configured for static export and Cloudflare Pages output", () => {
  const config = readFileSync("next.config.mjs", "utf8");
  const wrangler = readFileSync("wrangler.toml", "utf8");
  assert.match(config, /output:\s*"export"/);
  assert.match(config, /trailingSlash:\s*true/);
  assert.match(wrangler, /pages_build_output_dir\s*=\s*"\.\/out"/);
});

test("static app has no invoice API route handlers or dynamic public shop route", () => {
  assert.equal(existsSync("src/app/api/invoices/route.ts"), false);
  assert.equal(existsSync("src/app/api/invoices/[invoiceId]/route.ts"), false);
  assert.equal(existsSync("src/app/shop/[shopId]/page.tsx"), false);
  assert.equal(existsSync("src/app/shop/page.tsx"), true);
});

test("local invoice route is browser-only and keeps issuance disabled", () => {
  const page = readFileSync("src/app/local-invoice/page.tsx", "utf8");
  const guard = readFileSync("src/lib/invoice-issuance-guard.mjs", "utf8");
  assert.doesNotMatch(page, /@\/lib\/supabase|\/api\/invoices/);
  assert.match(page, /localFirstStore\.saveInvoice/);
  assert.match(page, /createDraftMemoPdf/);
  assert.match(page, /sharePdfFile/);
  assert.match(guard, /INVOICE_ISSUANCE_ENABLED = false/);
});

test("PWA manifest and service worker are present", () => {
  assert.equal(existsSync("public/manifest.webmanifest"), true);
  assert.equal(existsSync("public/sw.js"), true);
  assert.equal(existsSync("public/offline.html"), true);
  const worker = readFileSync("public/sw.js", "utf8");
  assert.match(worker, /dokantools-shell-v1/);
  assert.match(worker, /\/local-invoice\//);
});
