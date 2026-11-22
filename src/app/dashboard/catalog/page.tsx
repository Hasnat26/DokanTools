"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase, Shop } from "@/lib/supabase";
import { normalizeProductName } from "@/lib/reliability-core.mjs";
import { inventoryLinkedProductMutationReason, inventoryLinkedProductDeletionBlocked } from "@/lib/catalog-stock-guard.mjs";
import { PRODUCT_PRESETS } from "@/lib/product-presets";

type Category = { id: string; name: string; sort_order: number };
type Product = {
  id: string;
  name: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  sort_order: number;
  is_active: boolean;
  category_id: string | null;
};
type StockLink = { id: string; name: string; unit: string };

export default function ProductCataloguePage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockLink[]>([]);
  const [catalogSaved, setCatalogSaved] = useState<Record<string, { name: string; unit: string }>>({});
  const [stockReady, setStockReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFeatureAvailable, setCategoryFeatureAvailable] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState("পিস");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [salePrice, setSalePrice] = useState("0");
  const [productCategory, setProductCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!user) { router.replace("/login"); return; }

    const { data: shopData, error: shopError } = await supabase
      .from("shops").select("*").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (shopError) { setError(shopError.message); setLoading(false); return; }
    if (!shopData) { router.replace("/dashboard"); return; }
    setShop(shopData as Shop);

    const [catalogResult, categoriesResult, categoryColumnResult, stockResult] = await Promise.all([
      supabase.from("item_catalog").select("*").eq("shop_id", shopData.id).order("sort_order").order("name"),
      supabase.from("item_categories").select("*").eq("shop_id", shopData.id).order("sort_order").order("name"),
      supabase.from("item_catalog").select("category_id").limit(0),
      supabase.from("stock_items").select("id,name,unit").eq("shop_id", shopData.id),
    ]);

    if (catalogResult.error) setError(catalogResult.error.message);
    if (categoriesResult.error && !categoriesResult.error.message.includes("item_categories")) setError(categoriesResult.error.message);
    if (stockResult.error) { setError("Inventory linkage could not be verified: " + stockResult.error.message); setStockReady(false); }
    else { setStockItems((stockResult.data || []) as StockLink[]); setStockReady(true); }
    const catalogItems = (catalogResult.data || []) as Product[];
    setProducts(catalogItems);
    setCatalogSaved(Object.fromEntries(catalogItems.map(item => [item.id, { name: item.name, unit: item.unit }])));
    setCategories((categoriesResult.data || []) as Category[]);
    setCategoryFeatureAvailable(!categoriesResult.error && !categoryColumnResult.error);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function createCategory(event: FormEvent) {
    event.preventDefault();
    if (!shop || busy) return;
    const name = categoryName.trim();
    if (!name) return;
    if (categories.some(category => normalizeProductName(category.name) === normalizeProductName(name))) {
      setError("এই ক্যাটাগরি আগে থেকেই আছে।");
      return;
    }
    setBusy(true); setError("");
    const { error: insertError } = await supabase.from("item_categories").insert({
      shop_id: shop.id, name, sort_order: categories.length,
    });
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    setCategoryName("");
    await load();
  }

  async function renameCategory(category: Category) {
    if (!shop || busy) return;
    const proposed = window.prompt("ক্যাটাগরির নতুন নাম লিখুন:", category.name);
    if (proposed === null) return;
    const name = proposed.trim();
    if (!name || name === category.name) return;
    if (categories.some(item => item.id !== category.id && normalizeProductName(item.name) === normalizeProductName(name))) {
      setError("এই নামে আরেকটি ক্যাটাগরি আছে।");
      return;
    }
    setBusy(true); setError("");
    const { error: updateError } = await supabase.from("item_categories")
      .update({ name }).eq("id", category.id).eq("shop_id", shop.id);
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  async function deleteCategory(category: Category) {
    if (!shop || busy || !window.confirm(`“${category.name}” ক্যাটাগরি মুছবেন? যুক্ত পণ্যগুলো Uncategorized হবে।`)) return;
    setBusy(true); setError("");
    const { error: deleteError } = await supabase.from("item_categories")
      .delete().eq("id", category.id).eq("shop_id", shop.id);
    setBusy(false);
    if (deleteError) { setError(deleteError.message); return; }
    await load();
  }

  async function createProduct(event: FormEvent) {
    event.preventDefault();
    if (!shop || busy) return;
    const name = productName.trim();
    const unit = productUnit.trim();
    const purchase = Number(purchasePrice);
    const sale = Number(salePrice);
    if (!name || !unit || !Number.isFinite(purchase) || purchase < 0 || !Number.isFinite(sale) || sale < 0) {
      setError("পণ্যের নাম, ইউনিট ও মূল্য যাচাই করুন।");
      return;
    }
    if (products.some(item => normalizeProductName(item.name) === normalizeProductName(name))) {
      setError("এই নামে পণ্য ইতিমধ্যে আছে।");
      return;
    }
    setBusy(true); setError("");
    const payload = {
      shop_id: shop.id, name, unit, purchase_price: purchase, sale_price: sale,
      sort_order: products.length, is_active: true,
      ...(categoryFeatureAvailable && productCategory ? { category_id: productCategory } : {}),
    };
    const { error: insertError } = await supabase.from("item_catalog").insert(payload);
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    setProductName(""); setProductUnit("পিস"); setPurchasePrice("0"); setSalePrice("0"); setProductCategory("");
    await load();
  }

  async function saveProduct(product: Product) {
    if (!shop || busy) return;
    if (!stockReady) { setError("Inventory linkage could not be verified; product changes are blocked until stock data loads."); return; }
    const baseline = catalogSaved[product.id];
    const mutationReason = inventoryLinkedProductMutationReason(stockItems, baseline, product);
    if (mutationReason) {
      setError(mutationReason === "NAME_CHANGE"
        ? "Inventory-linked product name cannot be changed directly; this would break stock matching."
        : "Inventory-linked product unit cannot be changed directly; this would break stock matching.");
      return;
    }
    if (!product.name.trim() || !product.unit.trim() ||
        !Number.isFinite(Number(product.purchase_price)) || Number(product.purchase_price) < 0 ||
        !Number.isFinite(Number(product.sale_price)) || Number(product.sale_price) < 0) {
      setError("পণ্যের নাম, ইউনিট ও মূল্য যাচাই করুন।");
      return;
    }
    if (products.some(item => item.id !== product.id && normalizeProductName(item.name) === normalizeProductName(product.name))) {
      setError("এই নামে আরেকটি ক্যাটালগ পণ্য আছে।");
      return;
    }
    const patch = {
      name: product.name.trim(), unit: product.unit.trim(),
      purchase_price: Number(product.purchase_price), sale_price: Number(product.sale_price),
      sort_order: product.sort_order, is_active: product.is_active,
      ...(categoryFeatureAvailable ? { category_id: product.category_id || null } : {}),
    };
    setBusy(true); setError("");
    const { error: updateError } = await supabase.from("item_catalog")
      .update(patch).eq("id", product.id).eq("shop_id", shop.id);
    setBusy(false);
    if (updateError) { setError(updateError.message); return; }
    await load();
  }

  async function deleteProduct(product: Product) {
    if (!shop || busy) return;
    if (!stockReady) { setError("Inventory linkage could not be verified; deletion is blocked until stock data loads."); return; }
    const baseline = catalogSaved[product.id];
    if (inventoryLinkedProductDeletionBlocked(stockItems, baseline?.name, product.name)) {
      setError("এই পণ্যটি স্টকের সঙ্গে যুক্ত। স্টক-যুক্ত পণ্য ক্যাটালগ থেকে মুছবেন না; আগে সংযোগ যাচাই করুন।");
      return;
    }
    if (!window.confirm(`“${product.name}” ক্যাটালগ থেকে মুছে ফেলবেন? এই কাজটি ফেরানো যাবে না।`)) return;
    setBusy(true); setError("");
    const { error: deleteError } = await supabase.from("item_catalog")
      .delete().eq("id", product.id).eq("shop_id", shop.id);
    setBusy(false);
    if (deleteError) { setError(deleteError.message); return; }
    await load();
  }

  async function moveProduct(index: number, delta: number) {
    if (busy) return;
    const next = index + delta;
    if (next < 0 || next >= products.length) return;
    const current = products[index], adjacent = products[next];
    setBusy(true);
    const results = await Promise.all([
      supabase.from("item_catalog").update({ sort_order: adjacent.sort_order }).eq("id", current.id).eq("shop_id", shop?.id),
      supabase.from("item_catalog").update({ sort_order: current.sort_order }).eq("id", adjacent.id).eq("shop_id", shop?.id),
    ]);
    setBusy(false);
    const failed = results.find(result => result.error);
    if (failed?.error) { setError(failed.error.message); return; }
    await load();
  }

  async function addPresets() {
    if (!shop || busy) return;
    const existing = new Set(products.map(product => normalizeProductName(product.name)));
    const presets = (PRODUCT_PRESETS[shop.shop_type] || PRODUCT_PRESETS.general)
      .filter(product => !existing.has(normalizeProductName(product.name)));
    if (!presets.length) { setError("সব ডিফল্ট পণ্য ইতিমধ্যে তালিকায় আছে।"); return; }
    setBusy(true); setError("");
    const { error: insertError } = await supabase.from("item_catalog").insert(presets.map((product, index) => ({
      shop_id: shop.id, name: product.name, unit: product.unit, purchase_price: 0,
      sale_price: 0, sort_order: products.length + index, is_active: true,
    })));
    setBusy(false);
    if (insertError) { setError(insertError.message); return; }
    await load();
  }

  if (loading) return <main className="container-page py-8">লোড হচ্ছে…</main>;

  return (
    <main className="container-page py-8">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700">← ড্যাশবোর্ড</Link>
      <h1 className="mt-3 text-3xl font-extrabold">পণ্য ও ক্যাটাগরি</h1>
      <p className="muted mt-2">Draft Memo-এর জন্য দোকানের পণ্য, ইউনিট ও মূল্য পরিচালনা করুন।</p>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {categoryFeatureAvailable && (
        <section className="mt-6 card" aria-label="ক্যাটাগরি ব্যবস্থাপনা">
          <h2 className="text-lg font-bold">ক্যাটাগরি ব্যবস্থাপনা</h2>
          <form onSubmit={createCategory} className="mt-3 flex flex-wrap gap-2">
            <input className="field min-w-[180px] flex-1" value={categoryName}
              onChange={event => setCategoryName(event.target.value)}
              placeholder="নতুন ক্যাটাগরির নাম" aria-label="নতুন ক্যাটাগরির নাম" required />
            <button className="btn-primary" disabled={busy}>ক্যাটাগরি যোগ করুন</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(category => (
              <span key={category.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
                {category.name}
                <button type="button" aria-label={category.name + " rename"}
                  onClick={() => renameCategory(category)} className="text-slate-700">✎</button>
                <button type="button" aria-label={category.name + " delete"}
                  onClick={() => deleteCategory(category)} className="text-red-600">×</button>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">পণ্য ক্যাটালগ</h2>
            <p className="muted mt-1">এখানে সংরক্ষিত পণ্য Draft Memo-তে নির্বাচন করা যাবে।</p>
          </div>
          <button type="button" className="btn-secondary" onClick={addPresets} disabled={busy}>ডিফল্ট পণ্য যোগ করুন</button>
        </div>

        <form onSubmit={createProduct} aria-label="পণ্য তৈরি" className="mt-4 grid gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-5">
          <label className="text-xs text-slate-500 sm:col-span-2">নতুন পণ্যের নাম
            <input className="field mt-1" required value={productName}
              onChange={event => setProductName(event.target.value)} />
          </label>
          {categoryFeatureAvailable && <label className="text-xs text-slate-500">ক্যাটাগরি
            <select className="field mt-1" aria-label="ক্যাটাগরি" value={productCategory}
              onChange={event => setProductCategory(event.target.value)}>
              <option value="">ক্যাটাগরি নেই</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>}
          <label className="text-xs text-slate-500">ইউনিট
            <input className="field mt-1" required value={productUnit} onChange={event => setProductUnit(event.target.value)} />
          </label>
          <label className="text-xs text-slate-500">ক্রয়মূল্য
            <input className="field mt-1" type="number" min="0" step="0.01" value={purchasePrice}
              onChange={event => setPurchasePrice(event.target.value)} />
          </label>
          <label className="text-xs text-slate-500">বিক্রয়মূল্য
            <input className="field mt-1" type="number" min="0" step="0.01" value={salePrice}
              onChange={event => setSalePrice(event.target.value)} />
          </label>
          <button className="btn-primary sm:col-span-5" disabled={busy}>Catalogue-এ পণ্য যোগ করুন (Stock ছাড়া)</button>
        </form>

        <div className="mt-4 space-y-3">
          {products.map((product, index) => (
            <div key={product.id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-12 sm:items-end">
              <label className="text-xs text-slate-500 sm:col-span-3">পণ্যের নাম
                <input className="field mt-1" aria-label="পণ্যের নাম" value={product.name}
                  onChange={event => setProducts(items => items.map(item => item.id === product.id ? { ...item, name: event.target.value } : item))} />
              </label>
              <label className="text-xs text-slate-500 sm:col-span-2">ইউনিট
                <input className="field mt-1" aria-label="ইউনিট" value={product.unit}
                  onChange={event => setProducts(items => items.map(item => item.id === product.id ? { ...item, unit: event.target.value } : item))} />
              </label>
              {categoryFeatureAvailable && <label className="text-xs text-slate-500 sm:col-span-2">ক্যাটাগরি
                <select className="field mt-1" aria-label="ক্যাটাগরি" value={product.category_id || ""}
                  onChange={event => setProducts(items => items.map(item => item.id === product.id ? { ...item, category_id: event.target.value || null } : item))}>
                  <option value="">ক্যাটাগরি নেই</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>}
              <label className="text-xs text-slate-500 sm:col-span-2">ক্রয়মূল্য
                <input className="field mt-1" aria-label="ক্রয়মূল্য" type="number" min="0" step="0.01"
                  value={product.purchase_price} onChange={event => setProducts(items => items.map(item => item.id === product.id ? { ...item, purchase_price: Number(event.target.value) } : item))} />
              </label>
              <label className="text-xs text-slate-500 sm:col-span-2">বিক্রয়মূল্য
                <input className="field mt-1" aria-label="বিক্রয়মূল্য" type="number" min="0" step="0.01"
                  value={product.sale_price} onChange={event => setProducts(items => items.map(item => item.id === product.id ? { ...item, sale_price: Number(event.target.value) } : item))} />
              </label>
              <div className="flex gap-1 sm:col-span-3">
                <button type="button" className="btn-secondary px-3" title="উপরে" onClick={() => moveProduct(index, -1)}>↑</button>
                <button type="button" className="btn-secondary px-3" title="নিচে" onClick={() => moveProduct(index, 1)}>↓</button>
                <button type="button" className="btn-primary px-3" onClick={() => saveProduct(product)} disabled={busy}>সেভ</button>
                <button type="button" className="btn-secondary px-3" onClick={() => deleteProduct(product)} disabled={busy}>মুছুন</button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="muted py-8 text-center">এখনও কোনো পণ্য যোগ করা হয়নি।</p>}
        </div>
      </section>
    </main>
  );
}
