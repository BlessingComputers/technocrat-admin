import type { Metadata } from "next";
import { PromotionDetailView } from "@/features/promotions";

export const metadata: Metadata = {
  title: "Promotion",
};

export default async function PromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PromotionDetailView id={id} />;
}
