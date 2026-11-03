"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user?.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);
  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return <header className="border-b bg-white">
    <div className="container-page flex items-center justify-between py-3">
      <Link href="/" className="text-xl font-extrabold text-brand-700">DokanTools</Link>
      <nav className="flex items-center gap-3 text-sm">
        <Link href="/#features" className="hidden sm:inline hover:text-brand-700">ফিচার</Link>
        {email ? <><Link href="/dashboard" className="font-semibold">ড্যাশবোর্ড</Link><button onClick={logout} className="btn-secondary">লগআউট</button></> : <><Link href="/login" className="hover:text-brand-700">লগইন</Link><Link href="/signup" className="btn-primary">ফ্রি শুরু করুন</Link></>}
      </nav>
    </div>
  </header>;
}
