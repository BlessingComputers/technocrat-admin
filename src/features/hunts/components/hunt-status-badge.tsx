"use client";

import { Badge } from "@/components/ui/badge";
import type { HuntCampaignStatus } from "../types/hunts";

const TONE: Record<HuntCampaignStatus, "muted" | "info" | "success" | "outline"> = {
  DRAFT: "muted",
  SCHEDULED: "info",
  ACTIVE: "success",
  ENDED: "outline",
};

const LABEL: Record<HuntCampaignStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  ENDED: "Ended",
};

/**
 * The campaign's server-side status, and only that. When the clock and the
 * status disagree (a window has opened but the flip to Active has not landed),
 * the summary line beside it says so; the badge stays the server's word.
 */
export function HuntStatusBadge({ status }: { status: HuntCampaignStatus }) {
  return (
    <Badge
      variant={TONE[status]}
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
    >
      {LABEL[status]}
    </Badge>
  );
}
