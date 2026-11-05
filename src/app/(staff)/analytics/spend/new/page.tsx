import type { Metadata } from "next";
import { AdSpendNewPage } from "@/features/analytics";

export const metadata: Metadata = { title: "Log ad spend" };

export default function Page({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return <AdSpendNewPage searchParams={searchParams} />;
}
