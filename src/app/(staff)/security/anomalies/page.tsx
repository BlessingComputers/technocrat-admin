import type { Metadata } from "next";
import { MonitorAnomaliesListView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Security — Anomalies",
};

export default function SecurityAnomaliesPage() {
  return <MonitorAnomaliesListView />;
}
