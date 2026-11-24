import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLocalInvoice,
  createLocalInvoiceDraft,
  formatLocalBDT,
  invoiceContentFingerprint,
  validateLocalBackup,
} from "../src/lib/local-first-invoice.mjs";

test("local invoice calculates integer minor units with quantity precision", () => {
  const result = calculateLocalInvoice([
    { name: "Rice", quantity: "2.5", unitPrice: "45.20" },
    { name: "Oil", quantity: "1", unitPrice: "120" },
  ]);
  assert.deepEqual(result, {
    valid: true, reason: null, lineTotalsMinor: [11300, 12000], totalMinor: 23300,
  });
  assert.equal(formatLocalBDT(result.totalMinor), "233.00");
});

test("local invoice rejects invalid and zero values", () => {
  assert.equal(calculateLocalInvoice([]).reason, "EMPTY_INVOICE");
  assert.equal(calculateLocalInvoice([{ name: "X", quantity: "0", unitPrice: "10" }]).reason, "INVALID_LINE");
  assert.equal(calculateLocalInvoice([{ name: "X", quantity: "1", unitPrice: "1.001" }]).reason, "INVALID_LINE");
  assert.equal(calculateLocalInvoice([{ name: "X", quantity: "1.0011", unitPrice: "10" }]).reason, "INVALID_QUANTITY");
});

test("draft is local, total-only and has no issued state", () => {
  const draft = createLocalInvoiceDraft({
    workspaceId: "workspace-1",
    shop: { name: "Local Shop" },
    customer: { name: "Customer" },
    lines: [{ name: "Item", quantity: "2", unit: "pc", unitPrice: "15.50" }],
    id: "invoice-1",
  });
  assert.equal(draft.status, "draft");
  assert.equal(draft.total_minor, 3100);
  assert.equal(draft.pdf_artifact, null);
  for (const prohibited of ["discount", "tax", "paid", "due"]) assert.equal(prohibited in draft, false);
});

test("fingerprint changes when invoice content changes", () => {
  const invoice = { shop: {}, customer: {}, lines: [{ name: "A", quantity: "1", unitPrice: "2" }], total_minor: 200 };
  const first = invoiceContentFingerprint(invoice);
  invoice.lines[0].quantity = "2";
  invoice.total_minor = 400;
  assert.notEqual(invoiceContentFingerprint(invoice), first);
});

test("backup validation rejects malformed or cross-workspace invoice records", () => {
  const valid = {
    schemaVersion: 1,
    workspace: { id: "workspace-1" },
    data: { invoices: [{ id: "i1", workspace_id: "workspace-1", lines: [], total_minor: 0 }], products: [], customers: [] },
  };
  assert.equal(validateLocalBackup(valid), true);
  assert.throws(() => validateLocalBackup({
    ...valid,
    data: { ...valid.data, invoices: [{ ...valid.data.invoices[0], workspace_id: "other" }] },
  }), /INVALID_BACKUP_INVOICE/);
});
