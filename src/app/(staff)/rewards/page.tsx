import type { Metadata } from "next";

import { MyRewardsView } from "@/features/rewards";

export const metadata: Metadata = {
  title: "My rewards",
};

/** The signed-in uploader's own rewards (ask 20). */
export default function MyRewardsPage() {
  return <MyRewardsView />;
}
