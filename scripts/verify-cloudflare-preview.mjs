#!/usr/bin/env node
/**
 * Smoke-check a deployed DokanTools static preview.
 * Usage: npm run verify:preview -- https://<preview-host>
 */
const target = process.argv[2];
if (!target) {
  console.error("Usage: npm run verify:preview -- <preview-origin-or-base-url>");
  process.exit(2);
}

let base;
try {
  base = new URL(target);
} catch {
  console.error("Invalid URL:", target);
  process.exit(2);
}
if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname)) {
  console.error("Preview must use HTTPS (HTTP is permitted only for localhost).");
  process.exit(2);
}
base.pathname = base.pathname.replace(/\/+$/, "") + "/";
base.search = "";
base.hash = "";

const checks = [
  { path: "/", label: "home page", type: /text\/html/i },
  { path: "local-invoice/", label: "local invoice route", type: /text\/html/i },
  { path: "manifest.webmanifest", label: "PWA manifest", type: /application\/(manifest\+json|json)/i },
  { path: "sw.js", label: "service worker", type: /(javascript|ecmascript)/i },
  { path: "offline.html", label: "offline fallback", type: /text\/html/i },
];

let failed = false;
for (const check of checks) {
  const url = new URL(check.path, base);
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const ok = response.ok && check.type.test(contentType) && body.length > 0;
    console.log(`${ok ? "PASS" : "FAIL"} ${check.label}: HTTP ${response.status}; content-type=${contentType}; bytes=${Buffer.byteLength(body)}`);
    if (!ok) failed = true;
    if (check.path === "manifest.webmanifest" && ok) {
      try {
        const manifest = JSON.parse(body);
        if (manifest.start_url !== "/local-invoice/" || manifest.scope !== "/") {
          console.error("FAIL manifest start_url/scope mismatch:", manifest.start_url, manifest.scope);
          failed = true;
        } else console.log("PASS manifest start_url=/local-invoice/; scope=/");
      } catch {
        console.error("FAIL manifest is not valid JSON");
        failed = true;
      }
    }
    if (check.path === "sw.js" && ok && (!body.includes("dokantools-shell-v1") || !body.includes("/local-invoice/"))) {
      console.error("FAIL service worker does not contain expected local invoice shell cache");
      failed = true;
    }
  } catch (error) {
    console.error(`FAIL ${check.label}: ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}
if (failed) {
  console.error("Preview smoke check failed. This does not replace interactive browser acceptance.");
  process.exit(1);
}
console.log("PASS static preview smoke checks. Continue with the controlled browser checklist.");
