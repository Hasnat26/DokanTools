export const INVOICE_ISSUANCE_ENABLED = false;

export function assertInvoiceIssuanceDisabled() {
  if (!INVOICE_ISSUANCE_ENABLED) {
    throw new Error("INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL");
  }
}
