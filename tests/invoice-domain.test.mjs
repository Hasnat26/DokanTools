import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePositiveQuantity,
  parsePositivePrice,
  calculateInvoicePreview,
  formatBDTFromMinor,
  safeInvoiceMapUrl,
} from "../src/lib/invoice-domain.mjs";

test("quantity accepts positive decimal lexical values up to three fraction digits", () => {
  assert.equal(parsePositiveQuantity("1"), 1);
  assert.equal(parsePositiveQuantity("1.5"), 1.5);
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
    { item_name: "Rice", quantity_text: "2", unit_price_text: "12.50" },
    { item_name: "Curry", quantity_text: "1.5", unit_price_text: "10.00" },
  ]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.lineAmounts, [2500, 1500]);
  assert.equal(result.totalMinor, 4000);
});

test("unnamed or whitespace-only invoice lines are rejected before review", () => {
  assert.deepEqual(calculateInvoicePreview([
    { item_name: "", quantity_text: "1", unit_price_text: "10.00" },
  ]), { valid: false, reason: "MISSING_ITEM_NAME", lineAmounts: [], totalMinor: 0 });
  assert.equal(calculateInvoicePreview([
    { item_name: "   ", quantity_text: "1", unit_price_text: "10.00" },
  ]).reason, "MISSING_ITEM_NAME");
});

test("decimal quantity and price are accepted together and calculate correctly", () => {
  const result = calculateInvoicePreview([
    { item_name: "Rice", quantity_text: "1.5", unit_price_text: "10.50" },
  ]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.lineAmounts, [1575]);
  assert.equal(result.totalMinor, 1575);
});

test("invalid line and unsafe arithmetic fail closed", () => {
  assert.equal(calculateInvoicePreview([
    { item_name: "Rice", quantity_text: "1", unit_price_text: "0" },
  ]).valid, false);
  assert.equal(calculateInvoicePreview([
    { item_name: "Rice", quantity_text: "1", unit_price_text: "999999999999999999999" },
  ]).valid, false);
});

test("BDT formatter does not produce negative or unsafe display values", () => {
  assert.equal(formatBDTFromMinor(12345), "123.45");
  assert.equal(formatBDTFromMinor(-1), "—");
});

test("nullable invoice mapUrl renders no link and never fabricates a Maps URL", () => {
  assert.equal(safeInvoiceMapUrl(null), null);
  assert.equal(safeInvoiceMapUrl(undefined), null);
  assert.equal(safeInvoiceMapUrl(""), null);
  assert.equal(safeInvoiceMapUrl("https://example.com/shop"), null);
  assert.equal(safeInvoiceMapUrl("http://maps.google.com/?q=shop"), null);
  assert.equal(safeInvoiceMapUrl("https://maps.google.com/?q=shop"), "https://maps.google.com/?q=shop");
});
