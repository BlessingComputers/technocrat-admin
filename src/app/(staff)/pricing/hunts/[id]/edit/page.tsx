import type { Metadata } from "next";

import { HuntFormView } from "@/features/hunts";

export const metadata: Metadata = {
  title: "Edit treasure hunt",
};

/** Edit a scheduled campaign: its name, its window, and any drop not yet open. */
export default async function EditHuntPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HuntFormView campaignId={id} />;
}
