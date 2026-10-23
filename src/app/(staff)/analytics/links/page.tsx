import type { Metadata } from "next";
import { CampaignLinksPage } from "@/features/analytics";

export const metadata: Metadata = {
  title: "Campaign links",
};

export default function AnalyticsLinksPage() {
  return <CampaignLinksPage />;
}
