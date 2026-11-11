import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePositiveQuantity,
  parsePositivePrice,
  calculateInvoicePreview,
  formatBDTFromMinor,
} from "../src/lib/invoice-domain.mjs";

test("quantity accepts positive decimal lexical values up to three fraction digits", () => {
  assert.equal(parsePositiveQuantity("1"), 1);
  assert.equal(parsePositiveQuantity("1.125"), 1.125);
  assert.equal(parsePositiveQuantity("0.001"), 0.001);
  assert.equal(parsePositiveQuantity("0"), null);
  assert.equal(parsePositiveQuantity("-1"), null);
  assert.equal(parsePositiveQuantity("1.1234"), null);
  assert.equal(parsePositiveQuantity("1e2"), null);
});

test("price accepts positive BDT values with at most two decimal places", () => {
  assert.equal(parsePositivePrice("10"), 10);
  assert.equal(parsePositivePrice("10.50"), 10.5);
  assert.equal(parsePositivePrice("0"), null);
  assert.equal(parsePositivePrice("-0.01"), null);
  assert.equal(parsePositivePrice("1.001"), null);
});

test("empty bill cannot be reviewed as a valid invoice", () => {
  assert.deepEqual(calculateInvoicePreview([]), {
    valid: false, reason: "EMPTY_BILL", lineAmounts: [], totalMinor: 0,
  });
});

test("preview calculates positive line amounts and total in minor units", () => {
  const result = calculateInvoicePreview([
    { quantity_text: "2", unit_price_text: "12.50" },
    { quantity_text: "1.5", unit_price_text: "10.00" },
  ]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.lineAmounts, [2500, 1500]);
  assert.equal(result.totalMinor, 4000);
});

test("invalid line and unsafe arithmetic fail closed", () => {
  assert.equal(calculateInvoicePreview([
    { quantity_text: "1", unit_price_text: "0" },
  ]).valid, false);
  assert.equal(calculateInvoicePreview([
    { quantity_text: "1", unit_price_text: "999999999999999999999" },
  ]).valid, false);
});

test("BDT formatter does not produce negative or unsafe display values", () => {
  assert.equal(formatBDTFromMinor(12345), "123.45");
  assert.equal(formatBDTFromMinor(-1), "—");
});
