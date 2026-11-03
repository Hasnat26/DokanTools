export type BillLine = {
  name: string;
  qty?: number | string;
  quantity?: number | string;
  unit_price?: number | string;
  price?: number | string;
  [key: string]: unknown;
};
export type StockItemForTest = { id: string; name: string; qty: number | string; [key: string]: unknown };
export function toMinorUnits(value: number | string): number;
export function fromMinorUnits(value: number): number;
export function calculateMemoPreviewTotal(items: BillLine[]): number;
export function calculateMemoTotals(items: BillLine[]): { lines: Array<BillLine & { qty: number; unit_price: number; line_total: number; line_total_minor: number }>; totalMinor: number; total: number };
export function normalizeProductName(value: unknown): string;
export function applySaleToStock(input: { stockItems: StockItemForTest[]; items: BillLine[]; operationId: string; appliedOperationIds?: string[] }): { stockItems: StockItemForTest[]; movements: Array<{ operation_id: string; stock_item_id: string; movement_type: string; qty_delta: number; qty_before: number; qty_after: number }>; appliedOperationIds: string[]; duplicate: boolean };
