"use client";

import { Badge } from "@/components/ui/badge";
import type { DealStatus } from "../types/deals";

const TONE: Record<DealStatus, "muted" | "info" | "success" | "outline"> = {
  DRAFT: "muted",
  SCHEDULED: "info",
  ACTIVE: "success",
  ENDED: "outline",
};

const LABEL: Record<DealStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  ENDED: "Ended",
};

/**
 * The deal's server-side status, and only that.
 *
 * Deliberately not clever: an ACTIVE deal whose expiry has passed still reads
 * Active here, because that is what the backend thinks and what the prices
 * still say until the five-minute sweep catches up. The "ended 2m ago, prices
 * updating" line beside it is where that gap gets explained — folding it into
 * the badge would hide which of the two is the server's opinion.
 */
export function DealStatusBadge({ status }: { status: DealStatus }) {
  return (
    <Badge
      variant={TONE[status]}
      className="font-semibold text-xs px-2.5 py-1 rounded-full"
    >
      {LABEL[status]}
    </Badge>
  );
}
