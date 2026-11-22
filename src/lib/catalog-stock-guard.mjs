import { normalizeProductName } from "./reliability-core.mjs";

export function findInventoryLinkedProduct(stockItems, productName) {
  if (!Array.isArray(stockItems) || typeof productName !== "string" || !productName.trim()) return undefined;
  const normalized = normalizeProductName(productName);
  return stockItems.find(item => normalizeProductName(item.name) === normalized);
}

export function inventoryLinkedProductMutationReason(stockItems, baseline, nextProduct) {
  if (!baseline || !nextProduct) return null;
  const linked = findInventoryLinkedProduct(stockItems, baseline.name);
  if (!linked) return null;
  if (normalizeProductName(nextProduct.name) !== normalizeProductName(baseline.name)) return "NAME_CHANGE";
  if (nextProduct.unit.trim() !== linked.unit) return "UNIT_CHANGE";
  return null;
}

export function inventoryLinkedProductDeletionBlocked(stockItems, baselineName, currentName) {
  return Boolean(findInventoryLinkedProduct(stockItems, baselineName || currentName));
}
