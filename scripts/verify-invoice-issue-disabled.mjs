#!/usr/bin/env node
import assert from "node:assert/strict";
const origin = process.argv[2] || "http://127.0.0.1:3000";
const localRoute = await fetch(origin + "/local-invoice/");
assert.equal(localRoute.status, 200, "Local invoice workspace must be served from static output");
const apiProbe = await fetch(origin + "/api/invoices", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({}),
});
assert.ok(apiProbe.status >= 400, "Static deployment must not expose a server invoice issuance endpoint");
console.log("PASS: local invoice workspace is static; no invoice issuance API is deployed; issuance remains OFF");
