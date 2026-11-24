const toMinor = value => {
  const text = String(value ?? "").trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const minor = Number(whole) * 100 + Number((fraction + "00").slice(0, 2));
  return Number.isSafeInteger(minor) ? minor : null;
};

export function calculateLocalInvoice(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { valid: false, reason: "EMPTY_INVOICE", lineTotalsMinor: [], totalMinor: 0 };
  }
  const lineTotalsMinor = [];
  let totalMinor = 0;
  for (const line of lines) {
    const name = String(line?.name ?? "").trim();
    const quantityText = String(line?.quantity ?? "").trim();
    if (!name) return { valid: false, reason: "ITEM_NAME_REQUIRED", lineTotalsMinor: [], totalMinor: 0 };
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(quantityText)) {
      return { valid: false, reason: "INVALID_QUANTITY", lineTotalsMinor: [], totalMinor: 0 };
    }
    const quantity = Number(quantityText);
    const priceMinor = toMinor(line?.unitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || priceMinor === null || priceMinor <= 0) {
      return { valid: false, reason: "INVALID_LINE", lineTotalsMinor: [], totalMinor: 0 };
    }
    const lineMinor = Math.round(quantity * priceMinor);
    if (!Number.isSafeInteger(lineMinor) || lineMinor <= 0) {
      return { valid: false, reason: "INVALID_LINE_AMOUNT", lineTotalsMinor: [], totalMinor: 0 };
    }
    totalMinor += lineMinor;
    if (!Number.isSafeInteger(totalMinor)) {
      return { valid: false, reason: "TOTAL_OVERFLOW", lineTotalsMinor: [], totalMinor: 0 };
    }
    lineTotalsMinor.push(lineMinor);
  }
  return { valid: true, reason: null, lineTotalsMinor, totalMinor };
}

export function formatLocalBDT(minor) {
  if (!Number.isSafeInteger(minor) || minor < 0) return "—";
  return new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}

export function createLocalInvoiceDraft({ workspaceId, shop, customer, lines, id = globalThis.crypto?.randomUUID?.() }) {
  if (!workspaceId || !id) throw new Error("WORKSPACE_AND_INVOICE_ID_REQUIRED");
  const calculation = calculateLocalInvoice(lines);
  if (!calculation.valid) throw new Error(calculation.reason);
  const now = new Date().toISOString();
  return {
    id,
    workspace_id: workspaceId,
    schema_version: 1,
    status: "draft",
    created_at: now,
    updated_at: now,
    revision: 1,
    shop: {
      name: String(shop?.name ?? "").trim(),
      address: String(shop?.address ?? "").trim(),
      phone: String(shop?.phone ?? "").trim(),
    },
    customer: {
      name: String(customer?.name ?? "").trim(),
      phone: String(customer?.phone ?? "").trim(),
    },
    lines: lines.map(line => ({
      name: String(line.name).trim(),
      quantity: String(line.quantity),
      unit: String(line.unit ?? "").trim(),
      unitPrice: String(line.unitPrice),
    })),
    total_minor: calculation.totalMinor,
    pdf_artifact: null,
  };
}

export function validateLocalBackup(backup) {
  if (!backup || typeof backup !== "object" || backup.schemaVersion !== 1 ||
      !backup.workspace || typeof backup.workspace.id !== "string" ||
      !backup.data || typeof backup.data !== "object" ||
      !Array.isArray(backup.data.invoices) ||
      !Array.isArray(backup.data.products) ||
      !Array.isArray(backup.data.customers)) {
    throw new Error("INVALID_BACKUP_FORMAT");
  }
  for (const invoice of backup.data.invoices) {
    if (!invoice || typeof invoice.id !== "string" || invoice.workspace_id !== backup.workspace.id ||
        !Array.isArray(invoice.lines) || !Number.isSafeInteger(invoice.total_minor)) {
      throw new Error("INVALID_BACKUP_INVOICE");
    }
  }
  return true;
}

export function invoiceContentFingerprint(invoice) {
  return JSON.stringify({
    shop: invoice.shop,
    customer: invoice.customer,
    lines: invoice.lines,
    total_minor: invoice.total_minor,
  });
}
