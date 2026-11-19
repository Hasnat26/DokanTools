const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
function scaled(value, places, code) {
  const text = String(value ?? "").trim();
  const pattern = places === 2 ? /^\\d+(?:\\.\\d{1,2})?$/ : /^\\d+(?:\\.\\d{1,3})?$/;
  if (!pattern.test(text)) throw new Error(code);
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * (10n ** BigInt(places)) + BigInt((fraction + "0".repeat(places)).slice(0, places));
}
function safeNumber(value, code) {
  if (value < 0n || value > MAX_SAFE) throw new Error(code);
  return Number(value);
}
function roundDivide(numerator, denominator) {
  return (numerator + denominator / 2n) / denominator;
}
function invalid(reason) {
  return { valid: false, reason, lineTotals: [], subtotalMinor: 0, discountMinor: 0, taxableMinor: 0, taxMinor: 0, grandTotalMinor: 0, paidMinor: 0, dueMinor: 0, totalMinor: 0 };
}
export function calculateDraftMemo(lines, options = {}) {
  if (!Array.isArray(lines) || lines.length === 0) return invalid("EMPTY_DRAFT");
  try {
    const lineTotals = [];
    let subtotal = 0n;
    for (const line of lines) {
      if (!line || typeof line.product_id !== "string" || !line.product_id || typeof line.item_name !== "string" || !line.item_name.trim()) return invalid("INVALID_PRODUCT");
      let quantity, unitPrice;
      try { quantity = scaled(line.quantity, 3, "INVALID_QUANTITY"); }
      catch (error) { return invalid(error.message); }
      try { unitPrice = scaled(line.unit_price, 2, "INVALID_UNIT_PRICE"); }
      catch (error) { return invalid(error.message); }
      if (quantity <= 0n) return invalid("INVALID_QUANTITY");
      const lineTotal = roundDivide(quantity * unitPrice, 1000n);
      if (lineTotal > MAX_SAFE) return invalid("LINE_OVERFLOW");
      subtotal += lineTotal;
      if (subtotal > MAX_SAFE) return invalid("TOTAL_OVERFLOW");
      lineTotals.push(Number(lineTotal));
    }
    let discount = 0n;
    if (options.discountEnabled) {
      try { discount = scaled(options.discountAmount ?? "0", 2, "INVALID_DISCOUNT"); }
      catch (error) { return invalid(error.message); }
      if (discount > subtotal) return invalid("DISCOUNT_EXCEEDS_SUBTOTAL");
      if (subtotal > 0n && discount === subtotal) return invalid("DISCOUNT_MUST_BE_LESS_THAN_SUBTOTAL");
    }
    const taxable = subtotal - discount;
    let tax = 0n;
    if (options.taxEnabled) {
      let rate;
      try { rate = scaled(options.taxRate ?? "0", 2, "INVALID_TAX_RATE"); }
      catch (error) { return invalid(error.message); }
      tax = roundDivide(taxable * rate, 10000n);
    }
    const grand = taxable + tax;
    if (grand > MAX_SAFE) return invalid("TOTAL_OVERFLOW");
    let paid = 0n;
    if (options.paidEnabled) {
      try { paid = scaled(options.paidAmount ?? "0", 2, "INVALID_PAID_AMOUNT"); }
      catch (error) { return invalid(error.message); }
      if (paid > grand) return invalid("PAID_EXCEEDS_GRAND_TOTAL");
    }
    const due = grand - paid;
    return {
      valid: true, reason: null, lineTotals,
      subtotalMinor: safeNumber(subtotal, "TOTAL_OVERFLOW"),
      discountMinor: safeNumber(discount, "TOTAL_OVERFLOW"),
      taxableMinor: safeNumber(taxable, "TOTAL_OVERFLOW"),
      taxMinor: safeNumber(tax, "TOTAL_OVERFLOW"),
      grandTotalMinor: safeNumber(grand, "TOTAL_OVERFLOW"),
      paidMinor: safeNumber(paid, "TOTAL_OVERFLOW"),
      dueMinor: safeNumber(due, "TOTAL_OVERFLOW"),
      totalMinor: safeNumber(grand, "TOTAL_OVERFLOW"),
    };
  } catch (error) {
    return invalid(error instanceof Error ? error.message : "CALCULATION_FAILED");
  }
}
export function draftMemoStorageKey(owner, shop, id) {
  if (![owner, shop, id].every(value => typeof value === "string" && value.trim())) throw new Error("DRAFT_IDENTITY_REQUIRED");
  return [owner, shop, id].map(encodeURIComponent).join("::");
}
export function validateDraftMemoIdentity(draft, owner, shop, id = draft?.id) {
  if (!draft || draft.owner_id !== owner || draft.shop_id !== shop || draft.id !== id) throw new Error("DRAFT_IDENTITY_MISMATCH");
  return true;
}
export function validateA6MemoFit(shop, lines) {
  if (!shop?.shop_name || !Array.isArray(lines)) return { valid: false, reason: "MISSING_CONTENT" };
  const estimate = 8 + lines.length * 2;
  return estimate <= 20 ? { valid: true, estimatedRows: estimate } : { valid: false, reason: "A6_CONTENT_OVERFLOW", estimatedRows: estimate };
}
