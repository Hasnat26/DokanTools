import test from "node:test";
import assert from "node:assert/strict";
import {
  applySaleToStock,
  calculateMemoTotals,
  normalizeProductName,
  toMinorUnits,
  canonicalizePayload,
  payloadFingerprint,
} from "../src/lib/reliability-core.mjs";

test("money calculations use integer minor units and per-line rounding", () => {
  assert.equal(toMinorUnits("0.10"), 10);
  const result = calculateMemoTotals([
    { name: "Rice", qty: 0.5, unit_price: 72.1 },
    { name: "Oil", qty: 2, unit_price: 155.25 },
  ]);
  assert.equal(result.totalMinor, 34655);
  assert.equal(result.total, 346.55);
});

test("invalid quantities, prices and names are rejected", () => {
  assert.throws(() => calculateMemoTotals([{ name: "Rice", qty: 0, unit_price: 12 }]), /Quantity/);
  assert.throws(() => calculateMemoTotals([{ name: "Rice", qty: 1, unit_price: -1 }]), /Unit price/);
  assert.throws(() => calculateMemoTotals([{ name: " ", qty: 1, unit_price: 2 }]), /name/);
});

test("sale decrements inventory and records a negative movement", () => {
  const original = [{ id: "r1", name: "Rice", qty: 10 }];
  const result = applySaleToStock({
    stockItems: original,
    items: [{ name: " rice ", qty: 2, stock_item_id: "r1" }],
    operationId: "op-1",
  });
  assert.equal(result.stockItems[0].qty, 8);
  assert.deepEqual(result.movements[0], {
    operation_id: "op-1", stock_item_id: "r1", movement_type: "sale",
    qty_delta: -2, qty_before: 10, qty_after: 8,
  });
  assert.equal(original[0].qty, 10, "the input is immutable");
});

test("an insufficient stock line leaves every original item untouched", () => {
  const original = [{ id: "r1", name: "Rice", qty: 5 }, { id: "o1", name: "Oil", qty: 1 }];
  assert.throws(() => applySaleToStock({
    stockItems: original,
    items: [{ name: "Rice", qty: 2 }, { name: "Oil", qty: 2 }],
    operationId: "op-2",
  }), /Insufficient stock/);
  assert.deepEqual(original.map((item) => item.qty), [5, 1]);
});

test("a retry with the same operation id does not decrement stock twice", () => {
  const first = applySaleToStock({
    stockItems: [{ id: "r1", name: "Rice", qty: 10 }],
    items: [{ name: "Rice", qty: 3 }],
    operationId: "same-operation",
  });
  const retry = applySaleToStock({
    stockItems: first.stockItems,
    items: [{ name: "Rice", qty: 3 }],
    operationId: "same-operation",
    appliedOperationIds: first.appliedOperationIds,
  });
  assert.equal(first.stockItems[0].qty, 7);
  assert.equal(retry.stockItems[0].qty, 7);
  assert.equal(retry.duplicate, true);
  assert.equal(retry.movements.length, 0);
});

test("ambiguous same-name stock records fail closed", () => {
  assert.throws(() => applySaleToStock({
    stockItems: [{ id: "1", name: "Rice", qty: 10 }, { id: "2", name: " rice ", qty: 4 }],
    items: [{ name: "Rice", qty: 1 }],
    operationId: "ambiguous",
  }), /Ambiguous/);
});

test("a service line without an inventory record does not change stock", () => {
  const input = [{ id: "1", name: "Soap", qty: 3 }];
  const result = applySaleToStock({ stockItems: input, items: [{ name: "Haircut", qty: 1 }], operationId: "service" });
  assert.equal(result.stockItems[0].qty, 3);
  assert.equal(result.movements.length, 0);
});

test("product-name normalization aligns NFKC, case and whitespace identity", () => {
  assert.equal(normalizeProductName("  Rice  "), "rice");
  assert.equal(normalizeProductName("Ｒice"), normalizeProductName("Rice"));
  assert.equal(normalizeProductName("  RICE\t\t"), normalizeProductName("rice"));
  assert.equal(normalizeProductName("Cafe\u0301"), normalizeProductName("Café"));
  assert.equal(normalizeProductName(null), "");
  assert.equal(normalizeProductName("   "), "");
});

test("sale rejects an implicit unit conversion", () => {
  assert.throws(() => applySaleToStock({
    stockItems: [{ id: "r1", name: "Rice", unit: "kg", qty: 10 }],
    items: [{ name: "Rice", unit: "bag", qty: 1, stock_item_id: "r1" }],
    operationId: "unit-mismatch",
  }), /Unit mismatch/);
});


test("canonical payload comparison ignores object key order but preserves array order", () => {
  const first = { customer_id: "c1", items: [{ name: "Rice", qty: 1, unit_price: 10 }, { name: "Oil", qty: 2, unit_price: 20 }], due_amount: 0 };
  const reordered = { due_amount: 0, items: [{ unit_price: 10, qty: 1, name: "Rice" }, { unit_price: 20, qty: 2, name: "Oil" }], customer_id: "c1" };
  assert.equal(canonicalizePayload(first), canonicalizePayload(reordered));
  assert.notEqual(canonicalizePayload(first), canonicalizePayload({ ...first, due_amount: 1 }));
  assert.notEqual(canonicalizePayload(first), canonicalizePayload({ ...first, items: [...first.items].reverse() }));
});

test("canonical payload distinguishes null from missing and string from number", () => {
  assert.notEqual(canonicalizePayload({ customer_id: null }), canonicalizePayload({}));
  assert.notEqual(canonicalizePayload({ amount: "10.00" }), canonicalizePayload({ amount: 10 }));
});


test("SHA-256 payload fingerprint is stable for canonical-equivalent JSON", async () => {
  const a = { z: 1, a: { y: 2, x: 3 } };
  const b = { a: { x: 3, y: 2 }, z: 1 };
  assert.equal(await payloadFingerprint(a), await payloadFingerprint(b));
  assert.notEqual(await payloadFingerprint(a), await payloadFingerprint({ ...a, z: 2 }));
});
