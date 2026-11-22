import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateDraftMemo } from "../src/lib/draft-memo-domain.mjs";
import { calculateInvoicePreview } from "../src/lib/invoice-domain.mjs";
import { isValidInvoiceRequest } from "../src/lib/invoice-request-validation.mjs";

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
  const [contract, route, invoiceDomain, requestValidator] = await Promise.all([
    readFile(new URL("../src/lib/invoice-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/invoices/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/invoice-domain.mjs", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/invoice-request-validation.mjs", import.meta.url), "utf8"),
  ]);

  const requestStart = contract.indexOf("export type InvoiceCreateRequest");
  const requestEnd = contract.indexOf("export type InvoiceLineDTO");
  assert.ok(requestStart >= 0, "InvoiceCreateRequest marker must exist");
  assert.ok(requestEnd >= 0, "InvoiceLineDTO marker must exist");
  assert.ok(requestEnd > requestStart, "Invoice request type must precede line DTO");
  const invoiceRequestType = contract.slice(requestStart, requestEnd);
  assert.doesNotMatch(invoiceRequestType, /(discount|tax|vat|paid|due)/i);

  // Exact allowlists reject additional adjustment properties in request/header/line objects.
  assert.match(requestValidator, /header,idempotencyNamespace,lines,requestId,shopId/);
  assert.match(requestValidator, /mapUrl,shopAddress,shopName,shopPhone/);
  assert.match(requestValidator, /catalogItemId,itemName,quantity,unit,unitPrice/);
  assert.match(route, /const INVOICE_ISSUE_ENABLED = false/);
  assert.match(route, /isValidInvoiceRequest\(input\)/);
  assert.match(route, /p_payload: \{ header: invoiceInput\.header, lines: invoiceInput\.lines \}/);

  assert.doesNotMatch(invoiceDomain, /discount|taxRate|paidAmount|dueMinor/i);
});

test("Invoice-First runtime request validator rejects adjustment fields",()=>{
 const request={shopId:"10000000-0000-4000-8000-000000000011",requestId:"10000000-0000-4000-8000-000000000099",idempotencyNamespace:"invoice-create/v1",header:{shopName:"QA",shopAddress:"",shopPhone:"",mapUrl:""},lines:[{catalogItemId:null,itemName:"Item",unit:"pcs",quantity:"1",unitPrice:"10.00"}]};
 assert.equal(isValidInvoiceRequest(request),true);
 assert.equal(isValidInvoiceRequest({...request,discountAmount:"1.00"}),false);
 assert.equal(isValidInvoiceRequest({...request,header:{...request.header,taxRate:"5"}}),false);
 assert.equal(isValidInvoiceRequest({...request,lines:[{...request.lines[0],paidAmount:"1"}]}),false);
});
