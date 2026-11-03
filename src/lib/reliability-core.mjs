/**
 * Small deterministic domain helpers shared by the UI and the offline test suite.
 * Database writes remain authoritative; this module is for client-side previews and
 * repeatable checks, not a replacement for SQL constraints/RPC transactions.
 */

export function toMinorUnits(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new TypeError("Money must be a finite, non-negative number.");
  }
  return Math.round((number + Number.EPSILON) * 100);
}

export function fromMinorUnits(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Minor units must be a non-negative safe integer.");
  }
  return value / 100;
}

export function calculateMemoTotals(items) {
  if (!Array.isArray(items)) throw new TypeError("Items must be an array.");
  let totalMinor = 0;
  const lines = items.map((item) => {
    const name = String(item?.name ?? "").trim();
    const quantity = Number(item?.qty ?? item?.quantity);
    const price = Number(item?.unit_price ?? item?.price);
    if (!name) throw new TypeError("Every bill line needs a product or service name.");
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new TypeError(`Quantity for '${name}' must be greater than zero.`);
    }
    if (!Number.isFinite(price) || price < 0) {
      throw new TypeError(`Unit price for '${name}' must be non-negative.`);
    }
    const unitPriceMinor = toMinorUnits(price);
    const lineTotalMinor = Math.round(quantity * unitPriceMinor);
    if (!Number.isSafeInteger(lineTotalMinor) || lineTotalMinor < 0) {
      throw new RangeError(`Line total for '${name}' is outside the supported range.`);
    }
    totalMinor += lineTotalMinor;
    return {
      ...item,
      name,
      qty: quantity,
      unit_price: unitPriceMinor / 100,
      line_total: lineTotalMinor / 100,
      line_total_minor: lineTotalMinor,
    };
  });
  if (!Number.isSafeInteger(totalMinor)) throw new RangeError("Memo total is outside the supported range.");
  return { lines, totalMinor, total: fromMinorUnits(totalMinor) };
}


export function calculateMemoPreviewTotal(items) {
  if (!Array.isArray(items)) return 0;
  let totalMinor = 0;
  for (const item of items) {
    const quantity = Number(item?.qty ?? item?.quantity);
    const price = Number(item?.unit_price ?? item?.price);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) continue;
    totalMinor += Math.round(quantity * toMinorUnits(price));
  }
  return fromMinorUnits(totalMinor);
}

export function normalizeProductName(value) {
  return String(value ?? "").trim().normalize("NFKC").toLocaleLowerCase("en");
}

/** Pure reference implementation for stock checks, atomicity and idempotency tests. */
export function applySaleToStock({ stockItems, items, operationId, appliedOperationIds = [] }) {
  if (!operationId || typeof operationId !== "string") {
    throw new TypeError("A stable operationId is required.");
  }
  if (!Array.isArray(stockItems) || !Array.isArray(items)) {
    throw new TypeError("stockItems and items must be arrays.");
  }
  if (appliedOperationIds.includes(operationId)) {
    return {
      stockItems,
      movements: [],
      appliedOperationIds,
      duplicate: true,
    };
  }

  const next = stockItems.map((item) => ({ ...item, qty: Number(item.qty) }));
  const byId = new Map(next.map((item) => [String(item.id), item]));
  const movements = [];

  // Mutate only the private clone. If any line fails, the caller's stock is unchanged.
  for (const line of items) {
    const name = String(line?.name ?? "").trim();
    const qty = Number(line?.qty ?? line?.quantity);
    if (!name) throw new TypeError("Every sale line needs a name.");
    if (!Number.isFinite(qty) || qty <= 0) throw new TypeError(`Invalid quantity for '${name}'.`);

    let stockItem = null;
    if (line.stock_item_id) {
      stockItem = byId.get(String(line.stock_item_id)) ?? null;
      if (!stockItem || normalizeProductName(stockItem.name) !== normalizeProductName(name)) {
        throw new Error(`Stock item reference does not match '${name}'.`);
      }
    } else {
      const matches = next.filter((candidate) => normalizeProductName(candidate.name) === normalizeProductName(name));
      if (matches.length > 1) throw new Error(`Ambiguous inventory item '${name}'.`);
      stockItem = matches[0] ?? null;
    }

    // A named service/custom line with no inventory record does not affect stock.
    if (!stockItem) continue;
    if (line.unit && stockItem.unit && normalizeProductName(line.unit) !== normalizeProductName(stockItem.unit)) {
      throw new Error(`Unit mismatch for '${name}'. Explicit conversion is required.`);
    }
    if (!Number.isFinite(stockItem.qty) || stockItem.qty < qty) {
      throw new Error(`Insufficient stock for '${name}'.`);
    }
    const before = stockItem.qty;
    stockItem.qty = Number((before - qty).toFixed(3));
    movements.push({
      operation_id: operationId,
      stock_item_id: String(stockItem.id),
      movement_type: "sale",
      qty_delta: Number((-qty).toFixed(3)),
      qty_before: before,
      qty_after: stockItem.qty,
    });
  }

  return {
    stockItems: next,
    movements,
    appliedOperationIds: [...appliedOperationIds, operationId],
    duplicate: false,
  };
}

/** Canonical JSON representation: object keys sorted recursively; arrays retain order. */
export function canonicalizePayload(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalizePayload).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalizePayload(value[key])}`).join(",")}}`;
}

/** SHA-256 fingerprint for client diagnostics; PostgreSQL JSONB remains authoritative. */
export async function payloadFingerprint(value) {
  const canonical = canonicalizePayload(value);
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is required to fingerprint payloads.");
  const bytes = new TextEncoder().encode(canonical);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
