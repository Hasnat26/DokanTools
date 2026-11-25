import Link from "next/link";

const features = [
  ["বাকি খাতা", "কাস্টমারের ফোন নম্বর দিয়ে বাকি ও জমা হিসাব রাখুন।"],
  ["মেমো / বিল", "দ্রুত বিল তৈরি করুন, PDF ডাউনলোড করুন ও WhatsApp-এ শেয়ার করুন।"],
  ["স্টক অ্যালার্ট", "কম স্টক ও মেয়াদ শেষ হওয়ার কাছাকাছি পণ্য দেখুন।"],
  ["মাস্টার QR", "একটি QR দিয়ে দোকানের পাবলিক পেজ, যোগাযোগ ও অফার শেয়ার করুন।"],
  ["প্রকাশযোগ্য দোকান পেজ", "দোকানদারের অনুমোদিত দোকানের তথ্য, অফার ও নির্বাচিত পণ্য দেখা যাবে; ব্যক্তিগত বকেয়া প্রকাশ করা হবে না."],
  ["WhatsApp Free Share", "কোনো WhatsApp API ছাড়াই প্রি-ফিল্ড মেসেজ খুলুন।"]
];
export default function Home() {
  return <div>
    <section className="bg-gradient-to-b from-brand-50 to-slate-50">
      <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div><span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm">বাংলাদেশের ছোট দোকানের জন্য</span>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-5xl">দোকানের হিসাব এখন <span className="text-brand-700">এক জায়গায়</span></h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">বাকি খাতা, মেমো, স্টক অ্যালার্ট ও দোকানের QR পেজ—মোবাইল থেকেই সহজে ব্যবহার করুন।</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link className="btn-primary" href="/signup">ফ্রি শুরু করুন</Link><Link className="btn-secondary" href="/#features">ফিচার দেখুন</Link><Link className="btn-secondary" href="/local-invoice/">Local Invoice · Offline-ready</Link></div>
          <p className="mt-4 text-sm text-slate-500">স্বল্প খরচে শুরু · পাইলট সংস্করণ · মূল্য ও ব্যবহারসীমা যাচাইাধীন</p>
        </div>
        <div className="card"><div className="flex items-center justify-between"><div><p className="muted">আজকের দোকান</p><h2 className="text-2xl font-bold">আমার দোকান</h2></div><div className="rounded-xl bg-brand-50 p-3 text-3xl">▦</div></div>
          <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="muted">মোট বাকি</p><p className="mt-1 text-2xl font-bold">৳ ৮,৪৫০</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="muted">কম স্টক</p><p className="mt-1 text-2xl font-bold">৩ পণ্য</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="muted">আজকের মেমো</p><p className="mt-1 text-2xl font-bold">১২</p></div><div className="rounded-xl bg-brand-50 p-4"><p className="muted">দোকানের QR</p><p className="mt-1 font-bold text-brand-700">Ready to share</p></div></div>
          <p className="mt-4 text-xs text-slate-400">ডেমো ভিজ্যুয়াল — বাস্তব ডেটা নয়</p>
        </div>
      </div>
    </section>
    <section id="features" className="container-page py-16"><div className="max-w-2xl"><h2 className="text-3xl font-extrabold">দোকানের দরকারি টুলস</h2><p className="mt-3 text-slate-600">একটি অ্যাকাউন্ট, একটি দোকান, একটি QR—দোকানদার নিয়ন্ত্রণ করবেন কী তথ্য প্রকাশ হবে।</p></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(([title, desc], i) => <article key={title} className="card"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">{i + 1}</div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{desc}</p></article>)}</div>
    </section>
    <section className="container-page pb-16"><div className="card"><h3 className="text-xl font-bold">পাইলট সংস্করণ</h3><p className="mt-2 leading-7 text-slate-600">DokanTools-এর মূল কাজগুলো আগে নিরাপদ ও নির্ভরযোগ্য করা হচ্ছে। ফ্রি/পেইড ব্যবহারের সীমা, সার্ভার খরচ এবং উন্নত ফিচারের মূল্য বাস্তব পরীক্ষার ফল পাওয়ার পর নির্ধারণ করা হবে।</p><ul className="mt-4 space-y-2 text-slate-600"><li>✓ বিক্রয়, বাকি ও স্টকের মূল প্রবাহ</li><li>✓ দোকানভিত্তিক ডেটা সুরক্ষা ও সংশোধনের ইতিহাস</li><li>✓ নিরাপদ প্রকাশযোগ্য দোকান পেজ</li><li>✓ পাইলটের সময় পারফরম্যান্স ও নির্ভরযোগ্যতা যাচাই</li></ul><Link href="/signup" className="btn-primary mt-6 inline-flex">পাইলট সংস্করণ শুরু করুন</Link></div></section>
  </div>;
}
