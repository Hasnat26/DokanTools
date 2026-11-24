import test from "node:test";
import assert from "node:assert/strict";
import { INVOICE_ISSUANCE_ENABLED, assertInvoiceIssuanceDisabled } from "../src/lib/invoice-issuance-guard.mjs";

test("invoice issuance remains fail-closed pending PO approval", () => {
  assert.equal(INVOICE_ISSUANCE_ENABLED, false);
  assert.throws(assertInvoiceIssuanceDisabled, /INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL/);
});
