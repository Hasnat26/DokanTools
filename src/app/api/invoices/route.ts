import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { InvoiceCreateRequest, InvoiceDTO } from "@/lib/invoice-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const decimal = (scale: number) => new RegExp("^(0|[1-9][0-9]*)([.][0-9]{1," + scale + "})?$");
const fail = (status: number, code: string) => NextResponse.json({ error: { code } }, {
  status, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
});
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function valid(v: unknown): v is InvoiceCreateRequest {
  if (!obj(v) || Object.keys(v).sort().join(",") !== "header,idempotencyNamespace,lines,requestId,shopId"
    || v.idempotencyNamespace !== "invoice-create/v1"
    || typeof v.shopId !== "string" || !UUID.test(v.shopId)
    || typeof v.requestId !== "string" || !UUID.test(v.requestId)
    || !obj(v.header) || !Array.isArray(v.lines) || v.lines.length < 1 || v.lines.length > 100) return false;
  const h = v.header;
  if (Object.keys(h).sort().join(",") !== "mapUrl,shopAddress,shopName,shopPhone"
    || ![h.shopName, h.shopAddress, h.shopPhone, h.mapUrl].every(x => typeof x === "string")) return false;
  return v.lines.every(line => obj(line)
    && Object.keys(line).sort().join(",") === "catalogItemId,itemName,quantity,unit,unitPrice"
    && (line.catalogItemId === null || (typeof line.catalogItemId === "string" && UUID.test(line.catalogItemId)))
    && typeof line.itemName === "string"
    && (line.unit === null || typeof line.unit === "string")
    && typeof line.quantity === "string" && decimal(3).test(line.quantity)
    && typeof line.unitPrice === "string" && decimal(2).test(line.unitPrice));
}

type InvoiceDbRow = {
  id: string; shop_id: string; bill_number: string | number; issued_at: string;
  total_amount: string | number; shop_name_snapshot: string; shop_address_snapshot: string;
  shop_phone_snapshot: string; map_url_snapshot: string | null;
};
type InvoiceLineDbRow = {
  line_no: number; catalog_item_id_snapshot: string | null; item_name_snapshot: string;
  unit_snapshot: string | null; quantity: string | number; unit_price: string | number;
  line_total: string | number;
};
function toDTO(row: InvoiceDbRow, lines: InvoiceLineDbRow[]): InvoiceDTO {
  return {
    id: row.id, shopId: row.shop_id, billNumber: String(row.bill_number),
    issuedAt: row.issued_at, currency: "BDT", totalAmount: String(row.total_amount),
    header: {
      shopName: row.shop_name_snapshot, shopAddress: row.shop_address_snapshot,
      shopPhone: row.shop_phone_snapshot, mapUrl: row.map_url_snapshot,
    },
    lines: lines.map(line => ({
      lineNo: line.line_no, catalogItemId: line.catalog_item_id_snapshot,
      itemName: line.item_name_snapshot, unit: line.unit_snapshot,
      quantity: String(line.quantity), unitPrice: String(line.unit_price), lineTotal: String(line.line_total),
    })),
  };
}

async function authenticatedClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !anon || !token || token.length > 8192) return null;
  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: "Bearer " + token } },
  });
}

async function loadInvoice(client: ReturnType<typeof createClient>, shopId: string, invoiceId: string) {
  const { data: row, error } = await client.from("invoices")
    .select("id,shop_id,bill_number,issued_at,total_amount,shop_name_snapshot,shop_address_snapshot,shop_phone_snapshot,map_url_snapshot")
    .eq("shop_id", shopId).eq("id", invoiceId).maybeSingle();
  if (error || !row) return null;
  const { data: lines, error: lineError } = await client.from("invoice_lines")
    .select("line_no,catalog_item_id_snapshot,item_name_snapshot,unit_snapshot,quantity,unit_price,line_total")
    .eq("shop_id", shopId).eq("invoice_id", invoiceId).order("line_no", { ascending: true });
  if (lineError || !lines) return null;
  return toDTO(row as unknown as InvoiceDbRow, lines as unknown as InvoiceLineDbRow[]);
}

export async function POST(req: NextRequest) {
  // Read the body once and enforce a byte limit even when Content-Length is absent.
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > 65536) return fail(413, "PAYLOAD_TOO_LARGE");
  const client = await authenticatedClient(req);
  if (!client) return fail(401, "UNAUTHENTICATED");
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return fail(400, "INVALID_JSON"); }
  if (!valid(input)) return fail(400, "INVALID_INVOICE_REQUEST");

  // Fail closed until PO-02/04/05/06 are approved. Not env-configurable.
  const INVOICE_ISSUE_ENABLED = false;
  if (!INVOICE_ISSUE_ENABLED) return fail(423, "INVOICE_ISSUE_DISABLED_PENDING_PO_APPROVAL");

  const { data, error } = await client.rpc("create_invoice_transaction", {
    p_shop_id: input.shopId,
    p_idempotency_namespace: input.idempotencyNamespace,
    p_request_id: input.requestId,
    p_payload: { header: input.header, lines: input.lines },
  });
  if (error) {
    if (error.code === "42501") return fail(403, "SHOP_ACCESS_DENIED");
    if (error.code === "23505") return fail(409, "IDEMPOTENCY_CONFLICT");
    if (error.code === "22023" || error.code === "22003") return fail(422, "INVOICE_VALIDATION_FAILED");
    return fail(503, "INVOICE_TEMPORARILY_UNAVAILABLE");
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.result_invoice_id) return fail(503, "INVOICE_RESULT_UNAVAILABLE");
  const invoice = await loadInvoice(client, input.shopId, result.result_invoice_id);
  if (!invoice) return fail(503, "INVOICE_RESULT_UNAVAILABLE");
  return NextResponse.json({ invoice, replayed: result.result_was_replay === true }, {
    status: result.result_was_replay ? 200 : 201,
    headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
  });
}

export async function GET(req: NextRequest) {
  const client = await authenticatedClient(req);
  if (!client) return fail(401, "UNAUTHENTICATED");
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId || !UUID.test(shopId)) return fail(400, "INVALID_SHOP_ID");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) return fail(400, "INVALID_LIMIT");

  const { data: rows, error } = await client.from("invoices")
    .select("id,shop_id,bill_number,issued_at,total_amount,shop_name_snapshot,shop_address_snapshot,shop_phone_snapshot,map_url_snapshot")
    .eq("shop_id", shopId).order("issued_at", { ascending: false })
    .order("bill_number", { ascending: false }).limit(limit);
  if (error) return fail(503, "INVOICE_HISTORY_UNAVAILABLE");
  const invoices = (rows ?? []) as unknown as InvoiceDbRow[];
  const ids = invoices.map(row => row.id);
  const { data: lines, error: linesError } = ids.length
    ? await client.from("invoice_lines")
      .select("invoice_id,line_no,catalog_item_id_snapshot,item_name_snapshot,unit_snapshot,quantity,unit_price,line_total")
      .eq("shop_id", shopId).in("invoice_id", ids).order("line_no", { ascending: true })
    : { data: [], error: null };
  if (linesError || !lines) return fail(503, "INVOICE_HISTORY_UNAVAILABLE");
  const grouped = new Map<string, InvoiceLineDbRow[]>();
  const lineRows = (lines ?? []) as unknown as Array<InvoiceLineDbRow & { invoice_id: string }>;
  for (const line of lineRows) grouped.set(line.invoice_id, [...(grouped.get(line.invoice_id) ?? []), line]);
  return NextResponse.json({ invoices: invoices.map(row => toDTO(row, grouped.get(row.id) ?? [])) }, {
    headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
  });
}
