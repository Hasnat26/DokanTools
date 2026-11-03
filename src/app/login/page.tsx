"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
export default function Login() {
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setError(error.message);return;}router.push("/dashboard");}
 return <div className="container-page max-w-lg py-12"><div className="card"><h1 className="text-2xl font-bold">লগইন করুন</h1><p className="muted mt-2">আপনার দোকানের ড্যাশবোর্ডে প্রবেশ করুন।</p><form onSubmit={submit} className="mt-6 space-y-4"><div><label className="label">ইমেইল</label><input className="field" type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div><div><label className="label">পাসওয়ার্ড</label><input className="field" type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>{error&&<p className="text-sm text-red-600">{error}</p>}<button className="btn-primary w-full" disabled={busy}>{busy?"অপেক্ষা করুন…":"লগইন"}</button></form><p className="mt-4 text-sm">অ্যাকাউন্ট নেই? <Link className="font-semibold text-brand-700" href="/signup">সাইন আপ করুন</Link></p></div></div>;
}
