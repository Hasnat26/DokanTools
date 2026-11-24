import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "DokanTools — ছোট দোকানের ডিজিটাল সহকারী",
  description: "Baki Khata, memo, stock alert এবং QR shop page — সহজে, বাংলায়।"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="bn"><body><Header /><PwaRegister /><main>{children}</main><footer className="mt-16 border-t bg-white py-8 text-center text-sm text-slate-500">DokanTools · ছোট দোকানের ডিজিটাল সহকারী · Free to start</footer></body></html>;
}
