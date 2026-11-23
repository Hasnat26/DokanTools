#!/usr/bin/env node
import assert from "node:assert/strict";
const origin = process.argv[2] || "http://127.0.0.1:3000";
const valid = {
  shopId: "10000000-0000-4000-8000-000000000011",
  requestId: "10000000-0000-4000-8000-000000000099",
  idempotencyNamespace: "invoice-create/v1",
  header: { shopName: "QA Shop", shopAddress: "", shopPhone: "", mapUrl: "" },
  lines: [{ catalogItemId: null, itemName: "QA item", unit: "pcs", quantity: "1", unitPrice: "10.00" }],
};
const validResponse = await fetch(`${origin}/api/invoices`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(valid) });
assert.equal(validResponse.status, 423, "Valid Invoice-First request must receive 423 while issuance is disabled");
assert.equal((await validResponse.json()).error.code, "INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL");
const adjusted = { ...valid, discountAmount: "1.00" };
const adjustedResponse = await fetch(`${origin}/api/invoices`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adjusted) });
assert.equal(adjustedResponse.status, 400, "Invoice-First must reject unsupported adjustment fields");
assert.equal((await adjustedResponse.json()).error.code, "INVALID_INVOICE_REQUEST");
console.log("PASS: valid request returns 423; adjustment-bearing request returns 400; issuance remains disabled");
