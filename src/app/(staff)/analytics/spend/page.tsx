import type { Metadata } from "next";
import { AdSpendSpendPage } from "@/features/analytics";

export const metadata: Metadata = { title: "Ad spend" };

export default function Page({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return <AdSpendSpendPage searchParams={searchParams} />;
}
