import type { Metadata } from "next";

import { DealDetailView } from "@/features/deals";

export const metadata: Metadata = {
  title: "Deal",
};

/**
 * One deal: what it covers, and the two buttons that move prices.
 *
 * Starting lives here rather than on the list row because the response reports
 * per-target success or failure, and that only fits where there is room for a
 * row per target.
 */
export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DealDetailView dealId={id} />;
}
