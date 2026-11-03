"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, Shop } from "@/lib/supabase";

export function useShop() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    let alive = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("shops").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (!alive) return;
      if (error) console.error(error);
      setShop(data as Shop | null);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [router]);
  return { shop, loading, setShop };
}
