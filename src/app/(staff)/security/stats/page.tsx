import type { Metadata } from "next";
import { MonitorStatsView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Security — Stats",
};

export default function SecurityStatsPage() {
  return <MonitorStatsView />;
}
