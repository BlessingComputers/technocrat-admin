import type { Metadata } from "next";
import { MonitorRequestDetailView } from "@/features/monitor";

export const metadata: Metadata = {
  title: "Request Detail",
};

export default async function SecurityRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <MonitorRequestDetailView requestId={requestId} />;
}
