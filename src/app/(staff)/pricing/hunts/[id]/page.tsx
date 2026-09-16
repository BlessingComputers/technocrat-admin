import type { Metadata } from "next";

import { HuntDetailView } from "@/features/hunts";

export const metadata: Metadata = {
  title: "Treasure hunt",
};

/**
 * One campaign: the secret schedule before it runs, the live monitor while it
 * does, and the winners list after.
 */
export default async function HuntPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HuntDetailView campaignId={id} />;
}
