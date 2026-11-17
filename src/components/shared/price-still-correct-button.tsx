"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { PriceAgeBadge } from "@/components/shared/price-age-badge";

interface PriceStillCorrectButtonProps {
  /** ISO `priceCheckedAt` of the item on the page. */
  checkedAt: string;
  onConfirm: () => void;
  isPending?: boolean;
}

/**
 * Edit-page control for ask 42: shows how long since the price was checked,
 * and confirms it without a fake edit. Confirming gives no uploader credit.
 */
export function PriceStillCorrectButton({
  checkedAt,
  onConfirm,
  isPending = false,
}: PriceStillCorrectButtonProps) {
  return (
    <div className="flex items-center gap-3">
      <PriceAgeBadge checkedAt={checkedAt} />
      <Button
        type="button"
        variant="outline"
        onClick={onConfirm}
        disabled={isPending}
        className="h-10 rounded-lg font-medium"
      >
        <AppIcon icon="solar:check-circle-linear" className="mr-2 size-4" />
        {isPending ? "Saving…" : "Price still correct"}
      </Button>
    </div>
  );
}
