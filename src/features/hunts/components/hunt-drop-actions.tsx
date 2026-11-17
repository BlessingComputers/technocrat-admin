"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/error-message";

import { useDeleteHuntDeal } from "../api/hunts.queries";
import type { HuntCampaign, HuntDeal } from "../types/hunts";
import { canRemoveDrop } from "../utils/hunt-rows";

/** The two writes on a drop's row: release a holder, or remove a scheduled drop. */
export function HuntDropActions({
  campaign,
  deal,
  now,
}: {
  campaign: HuntCampaign;
  deal: HuntDeal;
  now: number;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const { mutate: removeDrop, isPending } = useDeleteHuntDeal(campaign.id);

  if (deal.claimStatus !== "OPEN") {
    return (
      <Button asChild variant="outline" size="sm" className="h-8 rounded-md text-xs font-medium">
        <Link href={`/pricing/hunts/${campaign.id}/release/${deal.id}`}>Release</Link>
      </Button>
    );
  }

  if (!canRemoveDrop(campaign, deal, now)) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsConfirming(true)}
        className="h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive-ink"
      >
        <AppIcon icon="solar:trash-bin-trash-linear" className="mr-1.5 size-4" />
        Remove
      </Button>
      <ConfirmModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={() =>
          removeDrop(deal.id, {
            onSuccess: () => {
              setIsConfirming(false);
              toast.success("Drop removed.");
            },
            onError: (err) =>
              toast.error(getErrorMessage(err, "Couldn’t remove this drop.")),
          })
        }
        title="Remove this drop?"
        description={`${deal.productName ?? "This item"} leaves the campaign and its schedule. If the campaign is already announced, customers will see it disappear.`}
        confirmText="Remove drop"
        cancelText="Keep it"
        variant="destructive"
        isPending={isPending}
      />
    </>
  );
}
