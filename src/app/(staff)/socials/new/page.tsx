import type { Metadata } from "next";
import { PromotionCreateView } from "@/features/promotions";

export const metadata: Metadata = {
  title: "New Promotion",
};

export default function NewPromotionPage() {
  return <PromotionCreateView />;
}
