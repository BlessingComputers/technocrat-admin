import type { Metadata } from "next";
import { AdSpendEditPage } from "@/features/analytics";

export const metadata: Metadata = { title: "Edit ad spend" };

export default function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  return <AdSpendEditPage {...props} />;
}
