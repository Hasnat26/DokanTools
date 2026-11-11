const roundToMinor = (value) => Math.round((value + Number.EPSILON) * 100);

export function parsePositiveQuantity(value) {
  const text = String(value ?? "").trim();
  if (!/^[0-9]+(?:.[0-9]{1,3})?$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parsePositivePrice(value) {
  const text = String(value ?? "").trim();
  if (!/^[0-9]+(?:.[0-9]{1,2})?$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function calculateInvoicePreview(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { valid: false, reason: "EMPTY_BILL", lineAmounts: [], totalMinor: 0 };
  }

  const lineAmounts = [];
  let totalMinor = 0;

  for (const line of lines) {
    const quantity = parsePositiveQuantity(line.quantity_text);
    const unitPrice = parsePositivePrice(line.unit_price_text);
    if (quantity === null || unitPrice === null) {
      return { valid: false, reason: "INVALID_LINE", lineAmounts: [], totalMinor: 0 };
    }
    const amount = roundToMinor(quantity * unitPrice);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return { valid: false, reason: "INVALID_LINE_AMOUNT", lineAmounts: [], totalMinor: 0 };
    }
    lineAmounts.push(amount);
    totalMinor += amount;
    if (!Number.isSafeInteger(totalMinor)) {
      return { valid: false, reason: "TOTAL_OVERFLOW", lineAmounts: [], totalMinor: 0 };
    }
  }

  return { valid: true, reason: null, lineAmounts, totalMinor };
}

export function formatBDTFromMinor(minor) {
  if (!Number.isSafeInteger(minor) || minor < 0) return "—";
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function buildOwnerInvoiceShareMessage(invoice) {
  const date = new Date(invoice.created_at);
  const safeDate = Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dhaka",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
  const safeTime = Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(date);

  // No bill URL or QR is included while public verification is disabled.
  return [
    invoice.shop_name_snapshot,
    `Bill No: ${invoice.bill_number}`,
    `Date: ${safeDate}  Time: ${safeTime}`,
    `Total: ৳${formatBDTFromMinor(roundToMinor(Number(invoice.total_amount)))}`,
    "ধন্যবাদ, আবার আসবেন!",
  ].join("\n");
}
