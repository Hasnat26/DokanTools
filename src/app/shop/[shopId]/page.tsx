"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { money, normalizeBdPhone, todayIso } from "@/lib/utils";

type PublicProfile={id:string;shop_name:string;owner_name:string|null;phone:string|null;address:string|null;map_link:string|null;logo_url:string|null;created_at:string};
type PublicProduct={id:string;shop_id:string;name:string;unit:string;price:number;in_stock:boolean};
type PublicOffer={id:string;shop_id:string;title:string;details:string|null;valid_until:string|null;created_at:string};
export default function PublicShop(){
 const params=useParams<{shopId:string}>();const shopId=params.shopId;
 const [shop,setShop]=useState<PublicProfile|null>(null);const [products,setProducts]=useState<PublicProduct[]>([]);const [offers,setOffers]=useState<PublicOffer[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true;async function load(){
  const [s,p,o]=await Promise.all([
   supabase.from("public_shop_profiles").select("id,shop_name,owner_name,phone,address,map_link,logo_url,created_at").eq("id",shopId).maybeSingle(),
   supabase.from("public_shop_products").select("id,shop_id,name,unit,price,in_stock").eq("shop_id",shopId).order("name"),
   supabase.from("shop_offers").select("id,shop_id,title,details,valid_until,created_at").eq("shop_id",shopId).or(`valid_until.is.null,valid_until.gte.${todayIso()}`).order("created_at",{ascending:false})
  ]);
  if(!alive)return;setShop((s.data||null) as PublicProfile|null);setProducts((p.data||[]) as PublicProduct[]);setOffers((o.data||[]) as PublicOffer[]);setLoading(false);
 }load();return()=>{alive=false};},[shopId]);
 if(loading)return <div className="container-page py-12">দোকানের তথ্য লোড হচ্ছে…</div>;
 if(!shop)return <div className="container-page py-16"><h1 className="text-2xl font-bold">পাবলিক দোকান পেজ পাওয়া যায়নি</h1><p className="muted mt-2">দোকানটি এখনো প্রকাশ করা হয়নি, অথবা লিংকটি সঠিক নয়।</p></div>;
 const orderLink=shop.phone?`https://wa.me/${normalizeBdPhone(shop.phone)}?text=${encodeURIComponent(`আসসালামু আলাইকুম, ${shop.shop_name} থেকে অর্ডার করতে চাই।`)}`:"#";
 return <div className="container-page py-8">
  <section className="overflow-hidden rounded-3xl bg-brand-700 p-6 text-white sm:p-10">{shop.logo_url&&<Image src={shop.logo_url} alt="Shop logo" width={64} height={64} unoptimized className="mb-4 h-16 w-16 rounded-full bg-white object-contain"/>}<p className="text-sm text-green-100">DokanTools · প্রকাশিত দোকান পেজ</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{shop.shop_name}</h1>{shop.owner_name&&<p className="mt-2">মালিক: {shop.owner_name}</p>}{shop.address&&<p className="mt-2">{shop.address}</p>}<div className="mt-5 flex flex-wrap gap-3">{shop.phone&&<a className="rounded-xl bg-white px-4 py-2.5 font-semibold text-brand-700" href={`tel:${shop.phone}`}>ফোন করুন</a>}{shop.map_link&&<a className="rounded-xl border border-white/40 px-4 py-2.5 font-semibold" href={shop.map_link} target="_blank" rel="noreferrer">ম্যাপ দেখুন</a>}{shop.phone&&<a className="rounded-xl bg-green-500 px-4 py-2.5 font-semibold text-white" href={orderLink} target="_blank" rel="noreferrer">WhatsApp-এ যোগাযোগ</a>}</div></section>
  <div className="mt-6 grid gap-5 md:grid-cols-2"><section className="card"><h2 className="text-xl font-bold">প্রকাশিত অফার</h2><div className="mt-3 space-y-3">{offers.map(o=><div key={o.id} className="rounded-xl bg-brand-50 p-3"><p className="font-bold">{o.title}</p>{o.details&&<p className="mt-1 text-sm text-slate-600">{o.details}</p>}{o.valid_until&&<p className="mt-1 text-xs text-slate-500">শেষ তারিখ: {o.valid_until}</p>}</div>)}{offers.length===0&&<p className="muted">বর্তমানে কোনো অফার যোগ করা হয়নি।</p>}</div></section>
   <section className="card"><h2 className="text-xl font-bold">বকেয়া ও ব্যক্তিগত তথ্য</h2><p className="mt-2 text-sm text-slate-600">গ্রাহকের নাম, ফোন নম্বর, বকেয়া, পেমেন্ট বা মেমোর ইতিহাস এই পাবলিক পেজে প্রকাশ করা হয় না। নিজের বকেয়া যাচাই করতে সরাসরি দোকানের সঙ্গে যোগাযোগ করুন।</p></section></div>
  <section className="mt-6 card"><h2 className="text-xl font-bold">দোকানের প্রকাশিত পণ্য</h2><p className="muted mt-1">শুধু দোকানদার যেসব পণ্য প্রকাশ করেছেন, সেগুলোর নাম, ইউনিট ও বিক্রয়মূল্য এখানে দেখা যাবে। পরিমাণ বা ক্রয়মূল্য প্রকাশ করা হয় না।</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{products.map(item=><div key={item.id} className="rounded-xl border p-4"><p className="font-bold">{item.name}</p><p className="mt-1 text-lg font-bold text-brand-700">{money(item.price)} <span className="text-sm font-normal text-slate-500">/ {item.unit||"পিস"}</span></p><span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${item.in_stock?"bg-green-100 text-green-800":"bg-slate-100 text-slate-700"}`}>{item.in_stock?"স্টকে আছে":"স্টক যাচাই করুন"}</span></div>)}{products.length===0&&<p className="muted">এখনো কোনো পণ্য প্রকাশ করা হয়নি।</p>}</div></section>
  <p className="mt-6 text-center text-xs text-slate-400">Powered by DokanTools</p>
 </div>;
}
