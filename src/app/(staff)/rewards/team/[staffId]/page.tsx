import type { Metadata } from "next";

import { StaffRewardsView } from "@/features/rewards";

export const metadata: Metadata = {
  title: "Uploader rewards",
};

/** One uploader's rewards, every month (ask 20). */
export default async function StaffRewardsPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  return <StaffRewardsView staffId={staffId} />;
}
