"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, invoiceApi, InvoiceCatalogItem, InvoiceDraft, InvoiceDraftLine, Shop } from "@/lib/supabase";
import type { InvoiceDTO } from "@/lib/invoice-contract";
import { calculateInvoicePreview, formatBDTFromMinor } from "@/lib/invoice-domain.mjs";
import { deleteInvoiceDraft, listInvoiceDrafts, saveInvoiceDraft } from "@/lib/invoice-draft-store.mjs";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";

type Screen = "composer" | "review" | "history" | "detail";
type LocalDraft = InvoiceDraft & { owner_id: string };
type ShopProfile = Pick<Shop, "id" | "user_id" | "shop_name" | "phone" | "address" | "map_link">;
type CatalogRow = InvoiceCatalogItem & { is_active: boolean | null };

const EMPTY_LINE: InvoiceDraftLine = {
  catalog_item_id: "",
  item_name: "",
  quantity_text: "1",
  unit_price_text: "",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
}

function OwnerInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [drafts, setDrafts] = useState<LocalDraft[]>([]);
  const [issuedInvoices, setIssuedInvoices] = useState<InvoiceDTO[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDTO | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [lines, setLines] = useState<InvoiceDraftLine[]>([{ ...EMPTY_LINE }]);
  const [screen, setScreen] = useState<Screen>("composer");
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);


  const preview = useMemo(() => calculateInvoicePreview(lines), [lines]);
  const filteredCatalog = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return catalog.filter(item => !normalized || item.name.toLocaleLowerCase().includes(normalized));
  }, [catalog, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      router.replace("/login");
      return;
    }
    setUserId(auth.user.id);

    const { data: shopData, error: shopError } = await supabase
      .from("shops")
      .select("id,user_id,shop_name,phone,address,map_link")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (shopError) {
      setError("দোকানের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
      setLoading(false);
      return;
    }
    if (!shopData) {
      router.replace("/dashboard");
      return;
    }
    const currentShop = shopData as ShopProfile;
    setShop(currentShop);

    // Read only the menu catalogue. Never query stock, customers, memos or ledger.
    const { data: menuData, error: menuError } = await supabase
      .from("item_catalog")
      .select("id,shop_id,name,sale_price,is_active,sort_order")
      .eq("shop_id", currentShop.id)
      .order("sort_order", { ascending: true });

    if (menuError) {
      setError("খাবারের তালিকা লোড করা যায়নি। কোনো স্টক বা লেজার তথ্য পড়া হয়নি।");
      setCatalog([]);
    } else {
      setCatalog((menuData || []) as CatalogRow[]);
    }

    try {
      const localDrafts = await listInvoiceDrafts(auth.user.id, currentShop.id);
      setDrafts(localDrafts as LocalDraft[]);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
      setDrafts([]);
      setNotice("এই ব্রাউজারে নিরাপদ খসড়া সংরক্ষণ নেই। এই সেশনের বাইরে খসড়া সংরক্ষিত থাকবে না।");
    }

    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const loadIssuedInvoices = useCallback(async () => {
    if (!shop) return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const invoices = await invoiceApi.list(shop.id);
      setIssuedInvoices(invoices);
    } catch (e) {
      setIssuedInvoices([]);
      setHistoryError(e instanceof Error ? e.message : "INVOICE_HISTORY_UNAVAILABLE");
    } finally {
      setHistoryLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    if (screen === "history" && shop) void loadIssuedInvoices();
  }, [screen, shop, loadIssuedInvoices]);

  async function openIssuedInvoice(invoiceId: string) {
    if (!shop) return;
    setHistoryError("");
    try {
      const invoice = await invoiceApi.get(shop.id, invoiceId);
      setSelectedInvoice(invoice);
      setScreen("detail");
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "INVOICE_DETAIL_UNAVAILABLE");
    }
  }

  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (draftId) setSelectedDraftId(draftId);
    if (searchParams.get("view") === "history") setScreen("history");
  }, [searchParams]);

  function updateLine(index: number, field: keyof InvoiceDraftLine, value: string) {
    setLines(old => old.map((line, i) => i === index ? { ...line, [field]: value } : line));
  }

  function chooseCatalog(index: number, id: string) {
    // PO-06 is pending: do not infer active/inactive selection or lifecycle.
    const item = catalog.find(entry => entry.id === id);
    if (!item) {
      updateLine(index, "catalog_item_id", "");
      return;
    }
    setLines(old => old.map((line, i) => i === index ? {
      ...line,
      catalog_item_id: item.id,
      item_name: item.name,
      unit_price_text: String(item.sale_price ?? ""),
    } : line));
  }

  function addLine() {
    setLines(old => [...old, { ...EMPTY_LINE }]);
    setScreen("composer");
  }

  async function persistDraft(): Promise<boolean> {
    if (!shop || !userId) return false;
    if (!storageAvailable) {
      setError("খসড়া সংরক্ষণের জন্য IndexedDB উপলব্ধ নয়। এই অবস্থায় অন্য পৃষ্ঠায় গেলে তথ্য হারাতে পারে।");
      return false;
    }
    setSavingDraft(true);
    setError("");
    const now = new Date().toISOString();
    const existing = drafts.find(item => item.id === selectedDraftId);
    const draft: LocalDraft = {
      id: existing?.id || crypto.randomUUID(),
      owner_id: userId,
      shop_id: shop.id,
      created_at: existing?.created_at || now,
      updated_at: now,
      state: "draft",
      lines: lines.map(line => ({ ...line })),
    };
    try {
      await saveInvoiceDraft(draft);
      const all = await listInvoiceDrafts(userId, shop.id);
      setDrafts(all as LocalDraft[]);
      setSelectedDraftId(draft.id);
      setNotice("খসড়া এই ডিভাইসে সংরক্ষিত হয়েছে। এটি ইস্যু করা বিল নয় এবং কোনো বিল নম্বর তৈরি হয়নি।");
      setError("");
      return true;
    } catch (e) {
      setError("খসড়া সংরক্ষণ করা যায়নি। "+(e instanceof Error ? e.message : ""));
      return false;
    } finally {
      setSavingDraft(false);
    }
  }

  async function removeDraft(id: string) {
    if (!shop || !userId || !storageAvailable) return;
    try {
      await deleteInvoiceDraft(userId, shop.id, id);
      setDrafts(await listInvoiceDrafts(userId, shop.id) as LocalDraft[]);
      if (selectedDraftId === id) {
        setSelectedDraftId("");
        setLines([{ ...EMPTY_LINE }]);
        setScreen("composer");
      }
      setNotice("খসড়া মুছে ফেলা হয়েছে।");
    } catch {
      setError("খসড়া মুছে ফেলা যায়নি।");
    }
  }

  function openDraft(draft: LocalDraft) {
    if (draft.owner_id !== userId || draft.shop_id !== shop?.id) {
      setError("এই খসড়াটি বর্তমান দোকান/অ্যাকাউন্টের নয়।");
      return;
    }
    setLines(draft.lines.map(line => ({ ...line })));
    setSelectedDraftId(draft.id);
    setScreen("composer");
    setNotice("খসড়া পুনরায় খোলা হয়েছে। এটি এখনও ইস্যু করা বিল নয়।");
  }

  function showReview(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!preview.valid) {
      setError(preview.reason === "EMPTY_BILL" ? "বিল খালি। অন্তত একটি আইটেম যোগ করুন।" : preview.reason === "MISSING_ITEM_NAME" ? "প্রতিটি লাইনের খাবার/আইটেমের নাম দিন।" : "পরিমাণ ও মূল্য যাচাই করুন।");
      return;
    }
    setScreen("review");
  }

  async function saveAndReview() {
    if (!preview.valid) {
      setError(preview.reason === "MISSING_ITEM_NAME" ? "প্রতিটি লাইনের খাবার/আইটেমের নাম দিন।" : "পরিমাণ ও মূল্য যাচাই করুন।");
      return;
    }
    const saved = await persistDraft();
    if (saved) setScreen("review");
  }

  if (loading) return <div className="container-page py-12">লোড হচ্ছে…</div>;
  if (!shop) return <div className="container-page py-12"><div className="card">দোকানের প্রোফাইল পাওয়া যায়নি। আগে দোকানের তথ্য সম্পন্ন করুন।</div></div>;

  const currentDraft = drafts.find(item => item.id === selectedDraftId) || null;

  return (
    <div className="container-page max-w-6xl py-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-brand-700">← ড্যাশবোর্ড</Link>
          <p className="muted mt-3">Invoice-First · মালিকের কাজ</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">খাবারের বিল</h1>
          <p className="mt-1 text-sm text-slate-600">{shop.shop_name}</p>
        </div>
        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
          খসড়া মোড · ইস্যু বন্ধ
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border bg-white p-2 text-sm">
        <button type="button" className={`min-h-11 rounded-lg px-2 font-semibold ${screen === "composer" ? "bg-brand-50 text-brand-700" : "text-slate-600"}`} onClick={() => setScreen("composer")}>নতুন বিল</button>
        <button type="button" className={`min-h-11 rounded-lg px-2 font-semibold ${screen === "review" ? "bg-brand-50 text-brand-700" : "text-slate-600"}`} onClick={() => setScreen("review")} disabled={!preview.valid}>পর্যালোচনা</button>
        <button type="button" className={`min-h-11 rounded-lg px-2 font-semibold ${screen === "history" || screen === "detail" ? "bg-brand-50 text-brand-700" : "text-slate-600"}`} onClick={() => setScreen("history")}>খসড়া ও বিলের ইতিহাস</button>
      </div>

      <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-bold">এটি এখনও ইস্যু করা বিল নয়</p>
        <p className="mt-1">এই স্ক্রিনে খসড়া তৈরি, সংরক্ষণ ও পর্যালোচনা করা যায়। সার্ভার-নিশ্চিত নম্বর, issued status, QR বা customer verification তৈরি হয় না।</p>
      </div>

      {notice && <div role="status" className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</div>}
      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {screen === "composer" && (
        <form onSubmit={showReview} className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
          <section className="card min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="text-lg font-bold">নতুন বিলের আইটেম</h2><p className="muted">দোকানের খাবারের তালিকা থেকে নির্বাচন করুন</p></div>
              {currentDraft && <span className="text-xs text-slate-500">খসড়া · {currentDraft.id.slice(0, 8)}</span>}
            </div>
            <label className="label mt-5" htmlFor="menu-search">খাবার খুঁজুন</label>
            <input id="menu-search" className="field" value={search} onChange={e => setSearch(e.target.value)} placeholder="খাবারের নাম লিখুন" />
            <div className="mt-3 max-h-60 space-y-2 overflow-y-auto rounded-xl border p-2">
              {filteredCatalog.map(item => (
                <button key={item.id} type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50" onClick={() => {
                  const emptyIndex = lines.findIndex(line => !line.catalog_item_id && !line.item_name.trim());
                  chooseCatalog(emptyIndex >= 0 ? emptyIndex : lines.length - 1, item.id);
                }}>
                  <span className="min-w-0 break-words font-medium">{item.name}</span>
                  <span className="shrink-0 text-sm font-semibold">৳{Number(item.sale_price).toFixed(2)}</span>
                </button>
              ))}
              {filteredCatalog.length === 0 && <p className="p-3 text-sm text-slate-500">কোনো খাবার পাওয়া যায়নি। সার্চ পরিবর্তন করুন।</p>}
            </div>
            <p className="mt-2 text-xs text-amber-800">PO-06 pending: মেনুর active/inactive eligibility ও lifecycle অনুমান করা হয়নি। তালিকাটি কেবল read-only catalogue data।</p>

            <div className="mt-5 flex items-center justify-between gap-2">
              <h3 className="font-bold">বিলের লাইন</h3>
              <button type="button" className="btn-secondary min-h-11" onClick={addLine}>+ লাইন যোগ করুন</button>
            </div>
            <div className="mt-3 space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">আইটেম {index + 1}</p>
                    {lines.length > 1 && <button type="button" className="min-h-11 px-2 text-sm font-semibold text-red-700" onClick={() => setLines(old => old.filter((_, i) => i !== index))}>বাদ দিন</button>}
                  </div>
                  <label className="label mt-2" htmlFor={`item-name-${index}`}>খাবার/আইটেমের নাম</label>
                  <input id={`item-name-${index}`} className="field" value={line.item_name} onChange={e => updateLine(index, "item_name", e.target.value)} placeholder="মেনু থেকে নির্বাচন করুন" />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor={`qty-${index}`}>পরিমাণ</label>
                      <input id={`qty-${index}`} className="field" type="number" inputMode="decimal" min="0" step="any" value={line.quantity_text} onChange={e => updateLine(index, "quantity_text", e.target.value)} />
                    </div>
                    <div>
                      <label className="label" htmlFor={`price-${index}`}>মূল্য (৳)</label>
                      <input id={`price-${index}`} className="field" type="number" inputMode="decimal" min="0" step="any" value={line.unit_price_text} onChange={e => updateLine(index, "unit_price_text", e.target.value)} />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">এই মূল্য ও পরিমাণের নিয়ম provisional। PO-04/05/06/09 সিদ্ধান্ত না হওয়া পর্যন্ত Save/Issue enabled নয়।</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="card h-fit lg:sticky lg:top-4">
            <h2 className="text-lg font-bold">খসড়ার সারাংশ</h2>
            <p className="mt-1 text-sm text-slate-500">{lines.length}টি লাইন</p>
            <div className="mt-4 space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words">{line.item_name || `আইটেম ${i + 1}`}</span>
                  <span className="shrink-0 tabular-nums">{preview.valid ? `৳${formatBDTFromMinor(preview.lineAmounts[i])}` : "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between text-lg font-extrabold"><span>মোট বিল</span><span>৳{preview.valid ? formatBDTFromMinor(preview.totalMinor) : "—"}</span></div>
              {!preview.valid && <p className="mt-2 text-sm text-amber-800">{preview.reason === "EMPTY_BILL" ? "বিল খালি।" : "পরিমাণ/মূল্য পূরণ ও যাচাই করুন।"}</p>}
            </div>
            <button type="submit" className="btn-primary mt-5 min-h-12 w-full" disabled={!preview.valid}>বিল পর্যালোচনা</button>
            <button type="button" className="btn-secondary mt-2 min-h-12 w-full" disabled={!storageAvailable || savingDraft} onClick={saveAndReview}>{savingDraft ? "সংরক্ষণ হচ্ছে…" : "খসড়া সংরক্ষণ ও পর্যালোচনা"}</button>
            <p className="mt-3 text-xs text-slate-500">ক্লায়েন্টের হিসাব শুধু preview। চূড়ান্ত অর্থ ও issued status শুধুমাত্র অনুমোদিত server transaction থেকে আসবে।</p>
          </aside>
        </form>
      )}

      {screen === "review" && (
        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="muted">পর্যালোচনা · খসড়া</p><h2 className="mt-1 text-2xl font-extrabold">খাবারের বিল</h2></div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">ইস্যু হয়নি</span>
            </div>
            <div className="invoice-print-root mt-4">
              <InvoiceDocument
                shop={shop}
                title="খাবারের বিল"
                lines={lines.map((line, i) => ({
                  item_name: line.item_name.trim(),
                  quantity: line.quantity_text,
                  amount_label: preview.valid ? `৳${formatBDTFromMinor(preview.lineAmounts[i])}` : "—",
                }))}
                totalLabel={preview.valid ? `৳${formatBDTFromMinor(preview.totalMinor)}` : "—"}
                statusLabel="খসড়া · ইস্যু হয়নি"
                showIssueMetadata={false}
              />
            </div>
          </div>
          <aside className="card h-fit">
            <h3 className="text-lg font-bold">ইস্যুর আগে যাচাই</h3>
            <p className="mt-2 text-sm text-slate-600">দোকানের তথ্য, প্রতিটি আইটেম, পরিমাণ ও মোট দেখুন। এটি এখনো একটি local draft preview।</p>
            <button type="button" className="btn-secondary mt-4 min-h-12 w-full" onClick={() => setScreen("composer")}>বিল সম্পাদনা</button>
            <button type="button" className="btn-secondary mt-2 min-h-12 w-full" onClick={() => void persistDraft()} disabled={!storageAvailable || savingDraft}>খসড়া সংরক্ষণ</button>
            <button type="button" className="btn-secondary mt-2 min-h-12 w-full" onClick={() => window.print()}>প্রিন্ট / Save as PDF · খসড়া</button>
            <button type="button" className="mt-3 min-h-12 w-full rounded-xl border border-amber-400 bg-amber-50 px-4 font-bold text-amber-950" disabled title="PO decisions pending">বিল তৈরি করুন · PO approval pending</button>
            <p className="mt-3 text-xs text-amber-900">PO-02/04/05/06 pending। তাই UI ইস্যু API call করে না; কোনো বিল নম্বর বা QR তৈরি হয় না।</p>
          </aside>
        </section>
      )}

      {screen === "history" && (
        <section className="mt-5">
          <div className="card">
            <h2 className="text-xl font-bold">সংরক্ষিত খসড়া</h2>
            <p className="muted mt-1">এগুলো এই ব্রাউজার/ডিভাইসে রাখা local drafts; issued invoice history নয়।</p>
            {!storageAvailable && <p className="mt-3 text-sm text-amber-800">IndexedDB উপলব্ধ নয়; saved drafts পড়া সম্ভব নয়।</p>}
            <div className="mt-4 space-y-3">
              {drafts.map(draft => (
                <div key={draft.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">খসড়া · {draft.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">সংশোধন: {formatDate(draft.updated_at)} {formatTime(draft.updated_at)} · {draft.lines.length} লাইন</p>
                    <p className="text-xs text-amber-800">ইস্যু করা হয়নি</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary min-h-11" onClick={() => openDraft(draft)}>খুলুন</button>
                    <button type="button" className="min-h-11 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700" onClick={() => void removeDraft(draft.id)}>মুছুন</button>
                  </div>
                </div>
              ))}
              {drafts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">এখনও কোনো local draft নেই।</p>}
              <p className="pt-2 text-xs text-slate-500">এই তালিকা শুধু local drafts। Server-issued invoice history ও detail CH-3 owner API সংযুক্ত না হওয়া পর্যন্ত unavailable।</p>
            </div>
          </div>
          <div className="card mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-bold">ইস্যু করা বিলের ইতিহাস</h3><p className="muted mt-1">শুধু authenticated owner API থেকে পাওয়া persisted invoice</p></div>
              <button type="button" className="btn-secondary min-h-11" onClick={() => void loadIssuedInvoices()} disabled={historyLoading}>{historyLoading ? "লোড হচ্ছে…" : "রিফ্রেশ"}</button>
            </div>
            {historyError && <p role="alert" className="mt-3 text-sm text-amber-800">ইতিহাস লোড হয়নি: {historyError}</p>}
            <div className="mt-4 space-y-3">
              {issuedInvoices.map(invoice => (
                <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">বিল নং {invoice.billNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(invoice.issuedAt)} {formatTime(invoice.issuedAt)}</p>
                    <p className="text-sm font-semibold">মোট: ৳{invoice.totalAmount}</p>
                  </div>
                  <button type="button" className="btn-secondary min-h-11" onClick={() => void openIssuedInvoice(invoice.id)}>বিস্তারিত</button>
                </div>
              ))}
              {!historyLoading && !historyError && issuedInvoices.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">সার্ভারে কোনো ইস্যু করা বিল পাওয়া যায়নি।</p>}
            </div>
          </div>
        </section>
      )}

      {screen === "detail" && (
        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="invoice-print-root">
            {selectedInvoice ? (
              <InvoiceDocument
                shop={{...shop, shop_name:selectedInvoice.header.shopName,address:selectedInvoice.header.shopAddress,phone:selectedInvoice.header.shopPhone,map_link:selectedInvoice.header.mapUrl}}
                billNumber={selectedInvoice.billNumber}
                createdAt={selectedInvoice.issuedAt}
                lines={selectedInvoice.lines.map(line=>({item_name:line.itemName,quantity:line.quantity,amount_label:`৳${line.lineTotal}`}))}
                totalLabel={`৳${selectedInvoice.totalAmount}`}
                statusLabel="সার্ভারে ইস্যু করা হয়েছে"
                showIssueMetadata={true}
              />
            ) : <div className="card">বিলের বিস্তারিত পাওয়া যায়নি। ইতিহাস থেকে আবার চেষ্টা করুন।</div>}
          </div>
          <aside className="card h-fit">
            <h3 className="text-lg font-bold">ইস্যু করা বিল</h3>
            <p className="mt-2 text-sm text-slate-600">বিল নং: {selectedInvoice?.billNumber || "—"}</p>
            <p className="mt-1 text-sm text-slate-600">তারিখ: {selectedInvoice ? formatDate(selectedInvoice.issuedAt) : "—"}</p>
            <p className="mt-1 text-sm text-slate-600">সময়: {selectedInvoice ? formatTime(selectedInvoice.issuedAt) : "—"}</p>
            <button type="button" className="btn-secondary mt-4 min-h-12 w-full" onClick={() => window.print()} disabled={!selectedInvoice}>প্রিন্ট / Save as PDF</button>
            <button type="button" className="btn-secondary mt-2 min-h-12 w-full" onClick={() => setScreen("history")}>ইতিহাসে ফিরে যান</button>
            <p className="mt-3 text-xs text-amber-900">Public QR / customer verification / revocation are disabled pending PO and security gates.</p>
          </aside>
        </section>
      )}

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm font-semibold text-brand-700">ড্যাশবোর্ডে ফিরে যান</Link>
      </div>
    </div>
  );
}

export default function OwnerInvoicesPage() {
  return (
    <Suspense fallback={<div className="container-page py-12">লোড হচ্ছে…</div>}>
      <OwnerInvoicesContent />
    </Suspense>
  );
}
