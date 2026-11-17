import type { Metadata } from "next";

import { HuntReleaseView } from "@/features/hunts";

export const metadata: Metadata = {
  title: "Release a hunt drop",
};

/** Take a held or claimed drop back from its holder, with a stored reason. */
export default async function ReleaseHuntDealPage({
  params,
}: {
  params: Promise<{ id: string; huntDealId: string }>;
}) {
  const { id, huntDealId } = await params;
  return <HuntReleaseView campaignId={id} huntDealId={huntDealId} />;
}
