import type { Metadata } from "next";
import { MonitorErrorsListView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Security — Errors",
};

export default function SecurityErrorsPage() {
  return <MonitorErrorsListView />;
}
