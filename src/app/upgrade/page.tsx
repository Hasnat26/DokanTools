"use client";
import Link from "next/link";

export default function UpgradePage(){
 return <div className="container-page max-w-2xl py-10">
  <Link href="/dashboard" className="text-sm font-semibold text-brand-700">← ড্যাশবোর্ড</Link>
  <section className="card mt-4">
   <p className="text-sm font-semibold text-brand-700">DokanTools · পাইলট সংস্করণ</p>
   <h1 className="mt-2 text-3xl font-extrabold">পেইড প্ল্যান এখনো চালু নয়</h1>
   <p className="mt-3 leading-7 text-slate-600">প্রথমে বিক্রয়, বাকি, স্টক, ডেটা সুরক্ষা ও সিঙ্কের নির্ভরযোগ্যতা যাচাই করা হচ্ছে। অবকাঠামোর বাস্তব খরচ, বিনামূল্যের ব্যবহারের সীমা ও দোকানদারের চাহিদা পরিমাপ না হওয়া পর্যন্ত কোনো নির্দিষ্ট মূল্য বা সীমাহীন ব্যবহারের প্রতিশ্রুতি দেওয়া হচ্ছে না।</p>
   <div className="mt-5 rounded-xl bg-slate-50 p-4"><h2 className="font-bold">এখন কী করবেন?</h2><p className="mt-1 text-sm leading-6 text-slate-600">মূল ফিচার ব্যবহার করুন এবং হিসাব, স্টক বা সিঙ্কে সমস্যা হলে রিপোর্ট করুন। নিরাপত্তা, হিসাবের অখণ্ডতা ও ডেটা রপ্তানির মৌলিক সুরক্ষা পেইড প্ল্যানের ওপর নির্ভর করবে না।</p></div>
   <Link href="/dashboard" className="btn-primary mt-5 inline-flex">ড্যাশবোর্ডে ফিরুন</Link>
  </section>
 </div>;
}
