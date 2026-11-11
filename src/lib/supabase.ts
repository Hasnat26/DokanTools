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


import type {
  InvoiceCreateRequest,
  InvoiceCreateResponse,
  InvoiceDTO,
  InvoiceHistoryResponse,
} from "@/lib/invoice-contract";

/**
 * Browser adapter for CH-3's authenticated invoice routes.
 * All invoice reads/writes pass through owner-authorized server endpoints;
 * the browser never queries invoice tables directly.
 */
async function invoiceApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("UNAUTHENTICATED");

  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null) as
    | { error?: { code?: string } }
    | null;
  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.code || `INVOICE_API_HTTP_${response.status}` : `INVOICE_API_HTTP_${response.status}`);
  }
  return payload as T;
}

export const invoiceApi = {
  async create(request: InvoiceCreateRequest): Promise<InvoiceCreateResponse> {
    return invoiceApiRequest<InvoiceCreateResponse>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
  async list(shopId: string): Promise<InvoiceDTO[]> {
    const query = new URLSearchParams({ shopId, limit: "50" });
    const result = await invoiceApiRequest<InvoiceHistoryResponse>(`/api/invoices?${query.toString()}`);
    return result.invoices;
  },
  async get(shopId: string, invoiceId: string): Promise<InvoiceDTO> {
    const query = new URLSearchParams({ shopId });
    const result = await invoiceApiRequest<{ invoice: InvoiceDTO }>(
      `/api/invoices/${encodeURIComponent(invoiceId)}?${query.toString()}`
    );
    return result.invoice;
  },
};
