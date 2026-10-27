import type { Metadata } from "next";
import { PreorderDetailView } from "@/features/preorders";

export const metadata: Metadata = {
  title: "Pre-order Detail",
};

export default async function PreorderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PreorderDetailView preorderId={id} />;
}
