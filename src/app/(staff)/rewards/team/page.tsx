import type { Metadata } from "next";

import { TeamRewardsView } from "@/features/rewards";

export const metadata: Metadata = {
  title: "Team rewards",
};

/** All uploaders' rewards, adjust, mark paid and rates (ask 20). */
export default function TeamRewardsPage() {
  return <TeamRewardsView />;
}
