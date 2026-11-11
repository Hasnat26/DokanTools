export type InvoiceCreateRequest = {
  shopId: string;
  requestId: string;
  idempotencyNamespace: "invoice-create/v1";
  header: { shopName: string; shopAddress: string; shopPhone: string; mapUrl: string };
  lines: Array<{ catalogItemId: string | null; itemName: string; unit: string | null; quantity: string; unitPrice: string }>;
};
export type InvoiceLineDTO = { lineNo:number; catalogItemId:string|null; itemName:string; unit:string|null; quantity:string; unitPrice:string; lineTotal:string };
export type InvoiceDTO = {
  id:string; shopId:string; billNumber:string; issuedAt:string; currency:"BDT"; totalAmount:string;
  header:{shopName:string;shopAddress:string;shopPhone:string;mapUrl:string|null}; lines:InvoiceLineDTO[];
};
export type InvoiceCreateResponse = {invoice:InvoiceDTO;replayed:boolean};
export type InvoiceHistoryResponse = {invoices:InvoiceDTO[]};
