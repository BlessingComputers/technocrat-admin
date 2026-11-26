"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { formatPrice } from "@/lib/utils/format";

import { useAdjustReward } from "../api/rewards.queries";
import {
  formatRewardMonth,
  isAlreadyPaidError,
  parseWholeNaira,
  previewFinalAmount,
  staffName,
} from "../model/reward-rules";
import { makeAdjustmentSchema } from "../schemas/reward-forms";
import type { RewardRow } from "../types/rewards";

export function AdjustRewardDialog({
  row,
  onClose,
}: {
  row: RewardRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust reward</DialogTitle>
          <DialogDescription>
            {row ? `${staffName(row)}, ${formatRewardMonth(row.month)}. Computed ${formatPrice(row.computedAmount)}.` : ""}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so the form reseeds from the row each time it opens. */}
        {row && <AdjustForm key={row.id} row={row} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function AdjustForm({ row, onClose }: { row: RewardRow; onClose: () => void }) {
  const adjust = useAdjustReward();
  const [amount, setAmount] = useState(row.adjustment === 0 ? "" : String(row.adjustment));
  const [reason, setReason] = useState(row.adjustmentReason ?? "");
  const [error, setError] = useState<string | null>(null);

  const preview = previewFinalAmount(row.computedAmount, amount);

  const handleSave = () => {
    const parsed = makeAdjustmentSchema(row.computedAmount).safeParse({
      adjustment: parseWholeNaira(amount),
      reason,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the amount and reason.");
      return;
    }
    setError(null);
    adjust.mutate(
      { id: row.id as string, input: parsed.data },
      {
        onSuccess: () => {
          toast.success("Adjustment saved.");
          onClose();
        },
        onError: (err) => {
          if (isAlreadyPaidError(err)) {
            toast.error("Someone already marked this paid.");
            onClose();
            return;
          }
          setError(getErrorMessage(err, "Couldn't save the adjustment."));
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="reward-adjustment">Adjustment (₦, use a minus to take away)</Label>
          <Input
            id="reward-adjustment"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="-500"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            New final amount: {preview === null ? "enter a whole amount" : formatPrice(preview)}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reward-reason">Reason</Label>
          <Textarea
            id="reward-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
          />
        </div>
        {error && <p className="text-xs font-medium text-destructive-ink">{error}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={adjust.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={adjust.isPending} className="font-semibold">
          {adjust.isPending && (
            <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
          )}
          Save adjustment
        </Button>
      </DialogFooter>
    </>
  );
}
