export type InvoicePreviewLine = {
  quantity_text: string;
  unit_price_text: string;
};

export type InvoicePreviewResult = {
  valid: boolean;
  reason: string | null;
  lineAmounts: number[];
  totalMinor: number;
};

export function parsePositiveQuantity(value: unknown): number | null;
export function parsePositivePrice(value: unknown): number | null;
export function calculateInvoicePreview(lines: InvoicePreviewLine[]): InvoicePreviewResult;
export function formatBDTFromMinor(minor: number): string;
export function buildOwnerInvoiceShareMessage(invoice: {
  shop_name_snapshot: string;
  bill_number: string;
  created_at: string;
  total_amount: number | string;
}): string;

export function safeInvoiceMapUrl(value: string | null | undefined): string | null;
