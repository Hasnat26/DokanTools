import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "DokanTools Draft Memo" },
};

export default function DraftMemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
