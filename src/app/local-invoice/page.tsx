"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createDraftMemoPdf } from "@/lib/draft-memo-pdf.mjs";
import { calculateLocalInvoice, formatLocalBDT, invoiceContentFingerprint } from "@/lib/local-first-invoice.mjs";
import { localFirstStore, getOrCreateLocalWorkspace, saveLocalWorkspace } from "@/lib/local-first-store.mjs";
import { backupToDrive, restoreFromDrive, disconnectDrive } from "@/lib/google-drive-backup.mjs";
import { requestGoogleDriveAccessToken } from "@/lib/google-drive-oauth.mjs";
import { sharePdfFile } from "@/lib/pdf-sharing.mjs";

type Line = { name: string; quantity: string; unit: string; unitPrice: string };
type Invoice = { id: string; workspace_id: string; status: "draft"; created_at: string; updated_at: string; revision: number; shop: { name: string; address: string; phone: string }; customer: { name: string; phone: string }; lines: Line[]; total_minor: number; pdf_artifact: null };
type Workspace = { id: string; name: string; address?: string; phone?: string; created_at: string; updated_at: string };
type Product = { id: string; workspace_id: string; name: string; unit: string; unitPrice: string; updated_at?: string };

const emptyLine: Line = { name: "", quantity: "1", unit: "pc", unitPrice: "" };
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function LocalInvoicePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; workspace_id: string; name: string; phone: string }>>([]);
  const [draftId, setDraftId] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [productName, setProductName] = useState("");
  const [productUnit, setProductUnit] = useState("pc");
  const [productPrice, setProductPrice] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [driveToken, setDriveToken] = useState("");
  const [driveTokenExpiresAt, setDriveTokenExpiresAt] = useState(0);
  const [driveConnected, setDriveConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const calculation = useMemo(() => calculateLocalInvoice(lines), [lines]);
  const totalLabel = calculation.valid ? formatLocalBDT(calculation.totalMinor) : "—";

  const reload = useCallback(async (ws: Workspace) => {
    const [savedInvoices, savedProducts, savedCustomers] = await Promise.all([
      localFirstStore.listInvoices(ws.id),
      localFirstStore.listProducts(ws.id),
      localFirstStore.listCustomers(ws.id),
    ]);
    setInvoices(savedInvoices as Invoice[]);
    setProducts(savedProducts as Product[]);
    setCustomers(savedCustomers as typeof customers);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ws = await getOrCreateLocalWorkspace() as Workspace;
        if (!alive) return;
        setWorkspace(ws);
        setShopName(ws.name || "");
        setShopAddress(ws.address || "");
        setShopPhone(ws.phone || "");
        await reload(ws);
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : "LOCAL_STORAGE_UNAVAILABLE");
      }
    })();
    return () => { alive = false; };
  }, [reload]);

  function invalidatePdf() {
    setPdfFile(null);
    setStatus("");
  }

  function updateLine(index: number, field: keyof Line, value: string) {
    invalidatePdf();
    setLines(current => current.map((line, i) => i === index ? { ...line, [field]: value } : line));
  }

  function startNew() {
    setDraftId("");
    setCustomerName("");
    setCustomerPhone("");
    setLines([{ ...emptyLine }]);
    invalidatePdf();
    setError("");
    setStatus("New local draft.");
  }

  async function saveShop() {
    if (!workspace) return;
    const next = { ...workspace, name: shopName.trim(), address: shopAddress.trim(), phone: shopPhone.trim() };
    await saveLocalWorkspace(next);
    setWorkspace(next);
    setStatus("Shop profile saved in this browser.");
  }

  async function saveDraft() {
    if (!workspace || !calculation.valid) return;
    setBusy(true);
    setError("");
    try {
      const existing = draftId ? await localFirstStore.getInvoice(draftId) as Invoice | null : null;
      const now = new Date().toISOString();
      const invoice = {
        id: draftId || crypto.randomUUID(),
        workspace_id: workspace.id,
        status: "draft" as const,
        created_at: existing?.created_at || now,
        updated_at: now,
        revision: existing?.revision || 1,
        shop: { name: shopName.trim(), address: shopAddress.trim(), phone: shopPhone.trim() },
        customer: { name: customerName.trim(), phone: customerPhone.trim() },
        lines: lines.map(line => ({ ...line })),
        total_minor: calculation.totalMinor,
        pdf_artifact: null,
      };
      await localFirstStore.saveInvoice(invoice, workspace.id);
      if (customerName.trim() || customerPhone.trim()) {
        const old = customers.find(customer => customer.phone && customer.phone === customerPhone.trim()) ||
          customers.find(customer => customer.name.toLowerCase() === customerName.trim().toLowerCase());
        await localFirstStore.saveCustomer({
          id: old?.id || crypto.randomUUID(),
          workspace_id: workspace.id,
          name: customerName.trim(),
          phone: customerPhone.trim(),
        }, workspace.id);
      }
      setDraftId(invoice.id);
      await reload(workspace);
      invalidatePdf();
      setStatus("Draft saved locally in IndexedDB. Invoice issuance is OFF.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "LOCAL_DRAFT_SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  function editDraft(invoice: Invoice) {
    setDraftId(invoice.id);
    setShopName(invoice.shop.name || "");
    setShopAddress(invoice.shop.address || "");
    setShopPhone(invoice.shop.phone || "");
    setCustomerName(invoice.customer.name || "");
    setCustomerPhone(invoice.customer.phone || "");
    setLines(invoice.lines.map(line => ({ ...line })));
    invalidatePdf();
    setError("");
    setStatus("Draft loaded from IndexedDB. Changes will be saved locally.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteDraft(id: string) {
    if (!workspace || !window.confirm("Delete this local draft? This cannot be undone unless backed up.")) return;
    await localFirstStore.deleteInvoice(id, workspace.id);
    if (draftId === id) startNew();
    await reload(workspace);
    setStatus("Local draft deleted.");
  }

  async function addProduct() {
    if (!workspace || !productName.trim() || !productPrice.trim()) return;
    const product: Product = {
      id: crypto.randomUUID(),
      workspace_id: workspace.id,
      name: productName.trim(),
      unit: productUnit.trim() || "pc",
      unitPrice: productPrice.trim(),
    };
    await localFirstStore.saveProduct(product, workspace.id);
    setProductName("");
    setProductPrice("");
    await reload(workspace);
    setStatus("Product saved locally.");
  }

  function addProductToInvoice(product: Product) {
    invalidatePdf();
    setLines(current => [...current, { name: product.name, quantity: "1", unit: product.unit, unitPrice: product.unitPrice }]);
  }

  async function generatePdf() {
    if (!workspace || !calculation.valid) return;
    const snapshot = {
      shop: { name: shopName.trim(), address: shopAddress.trim(), phone: shopPhone.trim() },
      customer: { name: customerName.trim(), phone: customerPhone.trim() },
      lines: lines.map((line, index) => ({
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        unitPrice: formatLocalBDT(Math.round(Number(line.unitPrice) * 100)),
        lineTotal: formatLocalBDT(calculation.lineTotalsMinor[index]),
      })),
      totals: {
        subtotal: formatLocalBDT(calculation.totalMinor),
        discount: null,
        tax: null,
        taxLabel: null,
        grandTotal: formatLocalBDT(calculation.totalMinor),
        paid: null,
        due: null,
      },
      qrDataUrl: "",
      logoDataUrl: "",
    };
    try {
      const fingerprint = invoiceContentFingerprint({ ...snapshot, total_minor: calculation.totalMinor });
      const pdf = createDraftMemoPdf(snapshot);
      const blob = pdf.output("blob");
      if (blob.size < 100 || blob.type !== "application/pdf") throw new Error("LOCAL_PDF_GENERATION_FAILED");
      const file = new File([blob], "DokanTools-Draft-" + (draftId || "local") + ".pdf", { type: "application/pdf" });
      // Artifact exists only in memory and is tied to the current content fingerprint.
      if (fingerprint !== invoiceContentFingerprint({ shop: snapshot.shop, customer: snapshot.customer, lines: snapshot.lines, total_minor: calculation.totalMinor })) {
        throw new Error("PDF_STALE_CONTENT");
      }
      setPdfFile(file);
      setStatus("A6 PDF generated in this browser. Draft only; invoice issuance is OFF.");
    } catch (cause) {
      setPdfFile(null);
      setError(cause instanceof Error ? cause.message : "LOCAL_PDF_GENERATION_FAILED");
    }
  }

  function downloadPdf() {
    if (!pdfFile) return;
    const url = URL.createObjectURL(pdfFile);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = pdfFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("PDF download started.");
  }

  async function sharePdf() {
    if (!pdfFile) return;
    const result = await sharePdfFile(pdfFile, navigator);
    setStatus(result.shared
      ? "Device share sheet opened. Select an available app."
      : result.reason === "unsupported"
        ? "File sharing is unsupported on this browser/device. Download the PDF and attach it manually."
        : result.reason === "cancelled"
          ? "Sharing cancelled; local PDF remains available."
          : "Share failed. Download the PDF and share it manually.");
  }

  async function getDriveToken() {
    if (driveToken && Date.now() < driveTokenExpiresAt - 60000) return driveToken;
    const result = await requestGoogleDriveAccessToken(clientId);
    setDriveToken(result.accessToken);
    setDriveTokenExpiresAt(result.expiresAt);
    setDriveConnected(true);
    return result.accessToken;
  }

  async function backupDrive() {
    if (!workspace) return;
    setBusy(true);
    setError("");
    try {
      const token = await getDriveToken();
      const backup = await localFirstStore.exportBackup(workspace);
      await backupToDrive(token, backup);
      setStatus("Manual backup completed in your Google Drive appData area.");
    } catch (cause) {
      if (cause instanceof Error && /DRIVE_AUTH_EXPIRED/.test(cause.message)) {
        setDriveToken("");
        setDriveConnected(false);
      }
      setError(cause instanceof Error ? cause.message : "DRIVE_BACKUP_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function restoreDrive() {
    if (!workspace || !window.confirm("Restore/merge the latest Google Drive backup into this browser? Existing local records with matching IDs will be updated.")) return;
    setBusy(true);
    setError("");
    try {
      const token = await getDriveToken();
      const { backup } = await restoreFromDrive(token);
      await localFirstStore.restoreBackup(backup, workspace, "merge");
      await reload(workspace);
      setStatus("Drive backup restored/merged. Local data was not deleted.");
    } catch (cause) {
      if (cause instanceof Error && /DRIVE_AUTH_EXPIRED/.test(cause.message)) {
        setDriveToken("");
        setDriveConnected(false);
      }
      setError(cause instanceof Error ? cause.message : "DRIVE_RESTORE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function exportBackupFile() {
    if (!workspace) return;
    const backup = await localFirstStore.exportBackup(workspace);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dokantools-local-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Local JSON backup download started.");
  }

  async function disconnectGoogleDrive() {
    if (!driveToken) { setDriveConnected(false); return; }
    if (!window.confirm("Revoke this Google Drive authorization? Local invoice data will remain in this browser.")) return;
    try {
      await disconnectDrive(driveToken);
      setDriveToken("");
      setDriveTokenExpiresAt(0);
      setDriveConnected(false);
      setStatus("Google Drive authorization revoked. Local data remains in IndexedDB.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DRIVE_DISCONNECT_FAILED");
    }
  }

  async function importBackupFile(file?: File) {
    if (!workspace || !file) return;
    setBusy(true);
    try {
      const backup = JSON.parse(await file.text());
      await localFirstStore.restoreBackup(backup, workspace, "merge");
      await reload(workspace);
      setStatus("Local backup imported/merged successfully.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "BACKUP_IMPORT_FAILED");
    } finally {
      setBusy(false);
    }
  }

  if (!workspace) return <main className="container-page py-8"><p>Opening local workspace…</p>{error && <p role="alert">{error}</p>}</main>;

  return <main className="container-page max-w-5xl py-8">
    <Link href="/" className="text-sm font-semibold text-brand-700">← Home</Link>
    <h1 className="mt-3 text-3xl font-extrabold">Local Invoice Workspace</h1>
    <p className="muted mt-2">Browser-only draft, calculation, IndexedDB save and A6 PDF. No Supabase, invoice API or server-side invoice processing.</p>
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <strong>Draft only — invoice issuance OFF.</strong> PO-10 total-only scope applies. Discount, VAT/Tax, Paid and Due are not available here.
    </div>

    <section className="card mt-5 space-y-3">
      <h2 className="text-lg font-bold">Local shop profile</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Shop name<input className="field mt-1" value={shopName} onChange={e=>{setShopName(e.target.value);invalidatePdf();}} /></label>
        <label className="text-sm">Address<input className="field mt-1" value={shopAddress} onChange={e=>{setShopAddress(e.target.value);invalidatePdf();}} /></label>
        <label className="text-sm">Phone<input className="field mt-1" value={shopPhone} onChange={e=>{setShopPhone(e.target.value);invalidatePdf();}} /></label>
      </div>
      <button className="btn-secondary" type="button" onClick={()=>void saveShop()}>Save shop profile locally</button>
    </section>

    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <section className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{draftId ? "Edit local draft" : "New local draft"}</h2><button className="btn-secondary" type="button" onClick={startNew}>New draft</button></div>
        <label className="text-sm">Customer name<input className="field mt-1" list="local-customers" value={customerName} onChange={e=>{setCustomerName(e.target.value);invalidatePdf();}} /></label>
        <datalist id="local-customers">{customers.map(c=><option key={c.id} value={c.name}>{c.phone}</option>)}</datalist>
        <label className="text-sm">Customer phone<input className="field mt-1" value={customerPhone} onChange={e=>{setCustomerPhone(e.target.value);invalidatePdf();}} /></label>
        <div className="border-t pt-3"><h3 className="font-semibold">Local product catalogue</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <input className="field sm:col-span-2" placeholder="Product name" value={productName} onChange={e=>setProductName(e.target.value)} />
            <input className="field" placeholder="Unit" value={productUnit} onChange={e=>setProductUnit(e.target.value)} />
            <input className="field" type="number" min="0.01" step="0.01" placeholder="Price" value={productPrice} onChange={e=>setProductPrice(e.target.value)} />
          </div>
          <button className="btn-secondary mt-2" type="button" onClick={()=>void addProduct()} disabled={!productName.trim()||!productPrice.trim()}>Add product locally</button>
          {products.length>0&&<div className="mt-2 flex flex-wrap gap-2">{products.map(p=><button key={p.id} type="button" className="rounded border px-2 py-1 text-sm" onClick={()=>addProductToInvoice(p)}>{p.name} · ৳{p.unitPrice}</button>)}</div>}
        </div>
        <div className="border-t pt-3"><div className="flex items-center justify-between"><h3 className="font-semibold">Invoice lines</h3><button className="btn-secondary" type="button" onClick={()=>{invalidatePdf();setLines(current=>[...current,{...emptyLine}]);}}>+ Line</button></div>
          {lines.map((line,index)=><div key={index} className="mt-3 rounded-lg border p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2"><label className="text-sm">Item<input className="field mt-1" value={line.name} onChange={e=>updateLine(index,"name",e.target.value)} /></label><label className="text-sm">Unit<input className="field mt-1" value={line.unit} onChange={e=>updateLine(index,"unit",e.target.value)} /></label></div>
            <div className="grid grid-cols-2 gap-2"><label className="text-sm">Quantity<input className="field mt-1" type="number" min="0.001" step="0.001" value={line.quantity} onChange={e=>updateLine(index,"quantity",e.target.value)} /></label><label className="text-sm">Unit price (BDT)<input className="field mt-1" type="number" min="0.01" step="0.01" value={line.unitPrice} onChange={e=>updateLine(index,"unitPrice",e.target.value)} /></label></div>
            <div className="flex items-center justify-between text-sm"><span>Line total: {calculation.valid?formatLocalBDT(calculation.lineTotalsMinor[index]):"—"}</span>{lines.length>1&&<button className="text-red-600" type="button" onClick={()=>{invalidatePdf();setLines(current=>current.filter((_,i)=>i!==index));}}>Remove</button>}</div>
          </div>)}
        </div>
        <div className="rounded-xl bg-slate-50 p-4"><div className="flex justify-between font-bold text-lg"><span>Total</span><span>BDT {totalLabel}</span></div></div>
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        {status&&<p role="status" className="text-sm text-green-800">{status}</p>}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" type="button" onClick={()=>void saveDraft()} disabled={!calculation.valid||busy}>Save draft locally</button>
          <button className="btn-secondary" type="button" onClick={()=>void generatePdf()} disabled={!calculation.valid}>Generate A6 PDF</button>
          <button className="btn-secondary" type="button" onClick={downloadPdf} disabled={!pdfFile}>Download PDF</button>
          <button className="btn-secondary" type="button" onClick={()=>void sharePdf()} disabled={!pdfFile}>Share PDF</button>
        </div>
        {!pdfFile&&<p className="muted text-xs">PDF is not stored as a stale artifact. Generate again after any content change.</p>}
      </section>

      <section className="card">
        <h2 className="text-lg font-bold">Saved drafts ({invoices.length})</h2>
        <p className="muted mt-1 text-sm">Drafts are stored in this browser profile's IndexedDB. Browser data may be cleared; export/Drive backup is essential.</p>
        <div className="mt-3 space-y-2">{invoices.map(invoice=><div key={invoice.id} className="rounded-lg border p-3">
          <div className="flex flex-wrap justify-between gap-2"><div><strong>{invoice.customer.name || "Walk-in customer"}</strong><p className="muted text-xs">{invoice.lines.length} lines · {new Date(invoice.updated_at).toLocaleString()}</p><p className="font-semibold">BDT {formatLocalBDT(invoice.total_minor)}</p></div><div className="flex gap-2"><button className="btn-secondary" type="button" onClick={()=>editDraft(invoice)}>Edit</button><button className="text-red-600" type="button" onClick={()=>void deleteDraft(invoice.id)}>Delete</button></div></div>
        </div>)}{invoices.length===0&&<p className="muted">No local drafts yet.</p>}</div>
      </section>
    </div>

    <section className="card mt-5 space-y-3">
      <h2 className="text-lg font-bold">Backup and recovery</h2>
      <p className="muted text-sm">Google Drive backup uses the minimal appDataFolder scope. Access token stays in memory and is not saved in IndexedDB or backup files. Drive quota/rate limits apply; retry/backoff is built into the client.</p>
      {clientId
        ? <div className="flex flex-wrap gap-2"><button className="btn-primary" type="button" onClick={()=>void backupDrive()} disabled={busy}>Backup to my Google Drive</button><button className="btn-secondary" type="button" onClick={()=>void restoreDrive()} disabled={busy}>Restore latest Drive backup</button>{driveConnected&&<button className="btn-secondary" type="button" onClick={()=>void disconnectGoogleDrive()}>Disconnect Drive</button>}</div>
        : <p className="text-sm text-amber-800">Google OAuth client ID is not configured. Drive integration requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and an authorized web origin. Local export/import works without it.</p>}
      <div className="flex flex-wrap gap-2"><button className="btn-secondary" type="button" onClick={()=>void exportBackupFile()}>Export local JSON backup</button><label className="btn-secondary cursor-pointer">Import / merge backup<input className="hidden" type="file" accept="application/json,.json" onChange={e=>void importBackupFile(e.target.files?.[0])} /></label></div>
      <p className="muted text-xs">Drive restore merges by record ID and preserves local records. Disconnecting Drive does not delete local data. A separate browser profile is the customer isolation boundary; do not share a browser profile for confidential multi-user work.</p>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>
  </main>;
}
