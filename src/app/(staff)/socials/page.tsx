import type { Metadata } from "next";
import { PromotionsListView } from "@/features/promotions";

export const metadata: Metadata = {
  title: "Socials",
};

export default function SocialsPage() {
  return <PromotionsListView />;
}
