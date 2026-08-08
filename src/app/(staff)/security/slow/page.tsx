import type { Metadata } from "next";
import { MonitorSlowListView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Security — Slow Requests",
};

export default function SecuritySlowPage() {
  return <MonitorSlowListView />;
}
