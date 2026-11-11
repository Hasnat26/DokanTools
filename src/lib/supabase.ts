import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  url || "https://example.supabase.co",
  anonKey || "example-anon-key"
);

export type Shop = {
  id: string;
  user_id: string;
  shop_name: string;
  shop_type: "grocery" | "pharmacy" | "food" | "salon" | "general";
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  map_link: string | null;
  logo_url: string | null;
  plan: "free" | "pro";
  is_public: boolean;
  usage_count: number;
  created_at: string;
};

export type InvoiceCatalogItem = {
  id: string;
  shop_id: string;
  name: string;
  sale_price: number | string;
  is_active: boolean | null;
  sort_order?: number | null;
};

export type InvoiceDraftLine = {
  catalog_item_id: string;
  item_name: string;
  quantity_text: string;
  unit_price_text: string;
};

export type InvoiceDraft = {
  id: string;
  shop_id: string;
  created_at: string;
  updated_at: string;
  state: "draft" | "blocked";
  block_reason?: string;
  lines: InvoiceDraftLine[];
};

export type InvoiceRecord = {
  id: string;
  bill_number: string;
  created_at: string;
  total_amount: string | number;
  status: "issued" | "revoked" | string;
  shop_name_snapshot: string;
  shop_address_snapshot: string | null;
  shop_phone_snapshot: string | null;
  shop_map_url_snapshot: string | null;
  lines: Array<{
    line_no: number;
    item_name_snapshot: string;
    quantity: string | number;
    unit_price: string | number;
    line_amount: string | number;
  }>;
  // Public QR/link fields are deliberately not part of the owner UI contract.
};

/**
 * Owner invoice API boundary.
 *
 * CH-3 implementation branch is not yet available. The adapter intentionally
 * fails closed instead of guessing table/RPC names or directly querying
 * invoice tables from the browser. Routes are the design targets from
 * PR #33 v0.4.2 and must be reconciled with CH-3's committed contract before
 * issuance/history are enabled.
 */
export const invoiceApi = {
  async createDraft(_shopId: string, _lines: InvoiceDraftLine[]): Promise<InvoiceDraft> {
    throw new Error("INVOICE_API_NOT_READY");
  },
  async issue(_draft: InvoiceDraft): Promise<InvoiceRecord> {
    throw new Error("INVOICE_API_NOT_READY");
  },
  async list(_shopId: string): Promise<InvoiceRecord[]> {
    throw new Error("INVOICE_API_NOT_READY");
  },
  async get(_shopId: string, _invoiceId: string): Promise<InvoiceRecord> {
    throw new Error("INVOICE_API_NOT_READY");
  },
};
