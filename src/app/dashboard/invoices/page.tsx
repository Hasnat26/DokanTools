import Link from "next/link";

export default function InvoiceFirstPage() {
  return <main className="container-page max-w-3xl py-8">
    <Link href="/dashboard" className="text-sm font-semibold text-brand-700">← Dashboard</Link>
    <h1 className="mt-3 text-3xl font-extrabold">Invoice-First · Local Drafts</h1>
    <p className="muted mt-2">Invoice creation, calculation, draft storage and A6 PDF are being moved to the browser-first local workspace.</p>
    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
      <strong>Invoice issuance remains OFF.</strong> This page does not create an issued invoice, bill number, public verification link or server invoice record.
    </div>
    <Link href="/local-invoice/" className="btn-primary mt-5 inline-flex">Open local invoice workspace</Link>
  </main>;
}
