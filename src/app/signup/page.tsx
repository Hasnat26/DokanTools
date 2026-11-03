"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
export default function Signup() {
 const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [error,setError]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");const {data,error}=await supabase.auth.signUp({email,password});setBusy(false);if(error){setError(error.message);return;}if(data.session){router.push("/dashboard");}else{setMessage("অ্যাকাউন্ট তৈরি হয়েছে। ইমেইল কনফার্ম করে লগইন করুন।");}}
 return <div className="container-page max-w-lg py-12"><div className="card"><h1 className="text-2xl font-bold">ফ্রি অ্যাকাউন্ট খুলুন</h1><p className="muted mt-2">শুরু করতে ইমেইল ও পাসওয়ার্ড দিন।</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label className="label">ইমেইল</label><input className="field" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div><div><label className="label">পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label><input className="field" type="password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} /></div>{error&&<p className="text-sm text-red-600">{error}</p>}{message&&<p className="text-sm text-brand-700">{message}</p>}<button className="btn-primary w-full" disabled={busy}>{busy?"তৈরি হচ্ছে…":"অ্যাকাউন্ট তৈরি করুন"}</button></form><p className="mt-4 text-sm">আগে থেকেই অ্যাকাউন্ট আছে? <Link className="font-semibold text-brand-700" href="/login">লগইন</Link></p></div></div>;
}
