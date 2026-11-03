export type ProductPreset = { name: string; unit: string; purchase_price?: number; sale_price?: number };

export const SHOP_TYPES = [
  { value: "grocery", label: "মুদির দোকান" },
  { value: "pharmacy", label: "ফার্মেসি" },
  { value: "food", label: "খাবারের দোকান / রেস্টুরেন্ট" },
  { value: "salon", label: "সেলুন" },
  { value: "general", label: "অন্যান্য দোকান" }
] as const;

export const PRODUCT_PRESETS: Record<string, ProductPreset[]> = {
  grocery: [
    { name: "চাল", unit: "কেজি" }, { name: "আটা", unit: "কেজি" }, { name: "ডাল", unit: "কেজি" },
    { name: "আলু", unit: "কেজি" }, { name: "পেঁয়াজ", unit: "কেজি" }, { name: "সয়াবিন তেল", unit: "লিটার" },
    { name: "লবণ", unit: "প্যাকেট" }, { name: "চিনি", unit: "কেজি" }, { name: "ডিম", unit: "পিস" },
    { name: "সাবান", unit: "পিস" }, { name: "শ্যাম্পু", unit: "প্যাকেট" }, { name: "বিস্কুট", unit: "প্যাকেট" },
    { name: "ম্যাচ", unit: "বক্স" }, { name: "দুধ", unit: "লিটার" }, { name: "মরিচ", unit: "কেজি" }
  ],
  pharmacy: [
    { name: "প্যারাসিটামল", unit: "স্ট্রিপ" }, { name: "ওআরএস", unit: "প্যাকেট" }, { name: "অ্যান্টাসিড", unit: "স্ট্রিপ" },
    { name: "কাশির সিরাপ", unit: "বোতল" }, { name: "ভিটামিন ট্যাবলেট", unit: "স্ট্রিপ" }, { name: "ব্যান্ডেজ", unit: "পিস" },
    { name: "মাস্ক", unit: "পিস" }, { name: "হ্যান্ড স্যানিটাইজার", unit: "বোতল" }, { name: "থার্মোমিটার", unit: "পিস" },
    { name: "কটন", unit: "প্যাকেট" }, { name: "আই ড্রপ", unit: "বোতল" }, { name: "সিরিঞ্জ", unit: "পিস" }
  ],
  food: [
    { name: "সাদা ভাত", unit: "প্লেট" }, { name: "খিচুড়ি", unit: "প্লেট" }, { name: "ডাল", unit: "বাটি" },
    { name: "মুরগির মাংস", unit: "পিস" }, { name: "গরুর মাংস", unit: "প্লেট" }, { name: "পরোটা", unit: "পিস" },
    { name: "সিঙ্গারা", unit: "পিস" }, { name: "সমুচা", unit: "পিস" }, { name: "চা", unit: "কাপ" },
    { name: "কফি", unit: "কাপ" }, { name: "পানি", unit: "বোতল" }, { name: "কোমল পানীয়", unit: "বোতল" }
  ],
  salon: [
    { name: "চুল কাটা", unit: "সেবা" }, { name: "দাড়ি ট্রিম", unit: "সেবা" }, { name: "শ্যাম্পু", unit: "সেবা" },
    { name: "ফেসিয়াল", unit: "সেবা" }, { name: "হেয়ার কালার", unit: "সেবা" }, { name: "হেয়ার জেল", unit: "পিস" }
  ],
  general: [
    { name: "পণ্য ১", unit: "পিস" }, { name: "পণ্য ২", unit: "পিস" }, { name: "পণ্য ৩", unit: "পিস" }
  ]
};
