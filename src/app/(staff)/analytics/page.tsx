import type { Metadata } from "next";
import { TrafficPage } from "@/features/analytics";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return <TrafficPage searchParams={searchParams} />;
}
