import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateDraftMemo } from "../src/lib/draft-memo-domain.mjs";
import { calculateInvoicePreview } from "../src/lib/invoice-domain.mjs";

test("PO-10 adjustments calculate only in Draft Memo and do not alter Invoice-First total", () => {
  const memoLine = { product_id: "p1", item_name: "Test item", unit: "pcs", quantity: "1", unit_price: "10.00" };
  const draft = calculateDraftMemo([memoLine], {
    discountEnabled: true, discountAmount: "1.00",
    taxEnabled: true, taxRate: "10.00",
    paidEnabled: true, paidAmount: "2.00",
  });
  assert.equal(draft.valid, true);
  assert.equal(draft.subtotalMinor, 1000);
  assert.equal(draft.discountMinor, 100);
  assert.equal(draft.taxMinor, 90);
  assert.equal(draft.grandTotalMinor, 990);
  assert.equal(draft.paidMinor, 200);
  assert.equal(draft.dueMinor, 790);

  const invoicePreview = calculateInvoicePreview([{
    item_name: "Test item", quantity_text: "1", unit_price_text: "10.00",
  }]);
  assert.equal(invoicePreview.valid, true);
  assert.equal(invoicePreview.totalMinor, 1000);
  assert.deepEqual(Object.keys(invoicePreview).sort(), ["lineAmounts", "reason", "totalMinor", "valid"]);
});

test("Invoice-First contract/API has no adjustment inputs and issuance remains disabled", async () => {
  const [contract, route, invoiceDomain] = await Promise.all([
    readFile(new URL("../src/lib/invoice-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/invoices/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/invoice-domain.mjs", import.meta.url), "utf8"),
  ]);

  const invoiceRequestType = contract.slice(
    contract.indexOf("export type InvoiceCreateRequest"),
    contract.indexOf("export type InvoiceLineDTO"),
  );
  for (const adjustmentField of ["discount", "tax", "paid", "due"]) {
    assert.doesNotMatch(invoiceRequestType, new RegExp("\\b" + adjustmentField + "\\b", "i"));
  }

  // Exact allowlists reject additional adjustment properties in request/header/line objects.
  assert.match(route, /Object\.keys\(v\)\.sort\(\)\.join\(","\) !== "header,idempotencyNamespace,lines,requestId,shopId"/);
  assert.match(route, /Object\.keys\(h\)\.sort\(\)\.join\(","\) !== "mapUrl,shopAddress,shopName,shopPhone"/);
  assert.match(route, /Object\.keys\(line\)\.sort\(\)\.join\(","\) === "catalogItemId,itemName,quantity,unit,unitPrice"/);
  assert.match(route, /const INVOICE_ISSUE_ENABLED = false/);
  assert.match(route, /p_payload: \{ header: input\.header, lines: input\.lines \}/);

  assert.doesNotMatch(invoiceDomain, /discount|taxRate|paidAmount|dueMinor/i);
});
