"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { SkeletonDetailPage } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";

import { HUNT_POLL_MS, useHuntCampaign, useReleaseHuntDeal } from "../api/hunts.queries";
import { useNow } from "../hooks/use-now";
import { claimLine, releaseConsequence } from "../utils/hunt-rows";
import { formatHuntSlot } from "../utils/hunt-time";
import { HuntOrderRef } from "./hunt-order-ref";

const MAX_REASON = 500;

/**
 * `/pricing/hunts/[id]/release/[huntDealId]`: take a drop back from its holder.
 *
 * The most contested action in the feature, so it gets a page rather than a
 * button: who holds it, the order and its payment, what happens next, and a
 * reason that stays on the row afterwards. The drop is re-read from the campaign
 * because it can change under this page: an unpaid hold releases by itself.
 */
export function HuntReleaseView({
  campaignId,
  huntDealId,
}: {
  campaignId: string;
  huntDealId: string;
}) {
  const router = useRouter();
  const { can } = usePermissions();
  const now = useNow(HUNT_POLL_MS);
  const { data: campaign, isLoading } = useHuntCampaign(campaignId);
  const { mutate: release, isPending } = useReleaseHuntDeal(campaignId);
  const [reason, setReason] = useState("");

  const detailHref = `/pricing/hunts/${campaignId}`;

  if (isLoading) return <SkeletonDetailPage />;

  const deal = campaign?.huntDeals.find((d) => d.id === huntDealId);
  const isReleasable = deal && deal.claimStatus !== "OPEN";

  if (!isReleasable || !can("huntCampaigns:write")) {
    return (
      <Card className="mx-auto max-w-2xl items-center gap-3 py-16 text-center">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {isReleasable ? "You can’t release this drop" : "Nothing to release"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {isReleasable
            ? "Releasing a drop needs the huntCampaigns:write permission."
            : "Nobody holds this drop. An unpaid hold releases by itself after 15 minutes, which may be what happened."}
        </p>
        <Button asChild variant="outline">
          <Link href={detailHref}>Back to the campaign</Link>
        </Button>
      </Card>
    );
  }

  const trimmed = reason.trim();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    release(
      { huntDealId, reason: trimmed },
      {
        onSuccess: () => {
          toast.success("Drop released.");
          router.push(detailHref);
        },
        onError: (err) =>
          toast.error(getErrorMessage(err, "Couldn’t release this drop.")),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Release this drop"
        description={campaign?.name}
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href={detailHref}>
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Campaign
          </Link>
        </Button>
      </PageHeader>

      <Card className="space-y-2 p-6">
        <p className="text-sm font-semibold text-foreground">
          {deal.productName ?? "Product no longer exists"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatHuntSlot(deal.slotStart, deal.slotEnd, true)}
        </p>
        <p className="text-xs font-semibold text-warning-ink">
          {claimLine(deal, now).text}
        </p>
        <HuntOrderRef deal={deal} />
      </Card>

      <form onSubmit={submit} className="space-y-6">
        <div className="space-y-1.5">
          <Label
            htmlFor="release-reason"
            className="ml-1 text-xs font-semibold text-muted-foreground"
          >
            Reason (kept on this drop)
          </Label>
          <Textarea
            id="release-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={MAX_REASON}
            rows={3}
            required
          />
        </div>

        <div
          role="note"
          className="space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-4"
        >
          <p className="text-sm font-semibold text-warning-ink">
            {releaseConsequence(deal, now)}
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            This does not cancel the order or refund the customer. Do that on the
            order page.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button asChild variant="ghost" className="h-10 rounded-lg font-medium">
            <Link href={detailHref}>Keep the hold</Link>
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={!trimmed || isPending}
            className="h-10 rounded-lg font-semibold"
          >
            {isPending ? "Releasing…" : "Release the drop"}
          </Button>
        </div>
      </form>
    </div>
  );
}
