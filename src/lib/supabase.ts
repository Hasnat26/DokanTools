import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  url || "https://example.supabase.co",
  anonKey || "example-anon-key"
);

export type Shop = {
  id: string;
  user_id: string;
  shop_name: string;
  shop_type: "grocery" | "pharmacy" | "food" | "salon" | "general";
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  map_link: string | null;
  logo_url: string | null;
  plan: "free" | "pro";
  is_public: boolean;
  usage_count: number;
  created_at: string;
};
