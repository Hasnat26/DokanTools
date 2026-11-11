import React from "react";
import type { Shop } from "@/lib/supabase";
import { safeInvoiceMapUrl } from "@/lib/invoice-domain.mjs";

export type InvoiceDocumentLine = {
  item_name: string;
  quantity: string;
  amount_label: string;
};

export type InvoiceDocumentProps = {
  shop: Pick<Shop, "shop_name" | "address" | "phone" | "map_link">;
  title?: string;
  billNumber?: string | null;
  createdAt?: string | null;
  lines: InvoiceDocumentLine[];
  totalLabel: string;
  statusLabel?: string;
  showIssueMetadata: boolean;
};

function dateAndTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka", day: "2-digit", month: "2-digit", year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(date),
  };
}

export default function InvoiceDocument({
  shop, title = "খাবারের বিল", billNumber, createdAt, lines, totalLabel,
  statusLabel, showIssueMetadata,
}: InvoiceDocumentProps) {
  const date = dateAndTime(createdAt);
  const mapUrl = safeInvoiceMapUrl(shop.map_link);

  return (
    <article className="invoice-document" aria-label="Bangla food invoice">
      <header className="invoice-document__header">
        <div className="invoice-document__identity">
          <h1 className="invoice-document__shop-name">{shop.shop_name}</h1>
          {shop.address && <p className="invoice-document__meta">{shop.address}</p>}
          {shop.phone && <p className="invoice-document__meta">মোবাইল: {shop.phone}</p>}
          {mapUrl && <p className="invoice-document__meta"><a href={mapUrl} target="_blank" rel="noreferrer">Google Maps Location</a></p>}
        </div>
        {statusLabel && <span className="invoice-document__status">{statusLabel}</span>}
      </header>

      <div className="invoice-document__title-block">
        <h2>{title}</h2>
        {showIssueMetadata && billNumber && date && (
          <div className="invoice-document__bill-meta">
            <span>Bill No: {billNumber}</span>
            <span>তারিখ: {date.date}</span>
            <span>সময়: {date.time}</span>
          </div>
        )}
      </div>

      <table className="invoice-document__table">
        <thead>
          <tr><th>খাবার/আইটেম</th><th>পরিমাণ</th><th>মূল্য</th></tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index}>
              <td>{line.item_name}</td>
              <td className="invoice-document__numeric">{line.quantity}</td>
              <td className="invoice-document__numeric">{line.amount_label}</td>
            </tr>
          ))}
          {lines.length === 0 && <tr><td colSpan={3} className="invoice-document__empty">এখনও কোনো খাবার যোগ করা হয়নি</td></tr>}
        </tbody>
      </table>

      <section className="invoice-document__total">
        <span>মোট বিল</span>
        <strong>{totalLabel}</strong>
      </section>

      <footer className="invoice-document__footer">ধন্যবাদ, আবার আসবেন!</footer>
      {!showIssueMetadata && <p className="invoice-document__draft-note">খসড়া preview · ইস্যু করা হয়নি</p>}
    </article>
  );
}
