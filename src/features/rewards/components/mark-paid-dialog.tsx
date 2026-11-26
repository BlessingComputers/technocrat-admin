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

import { useMarkRewardPaid } from "../api/rewards.queries";
import {
  formatRewardMonth,
  isAlreadyPaidError,
  staffName,
  todayLocal,
} from "../model/reward-rules";
import { makePaidSchema } from "../schemas/reward-forms";
import type { RewardRow } from "../types/rewards";

export function MarkPaidDialog({
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
          <DialogTitle>Mark paid</DialogTitle>
          <DialogDescription>
            {row
              ? `${staffName(row)}, ${formatRewardMonth(row.month)}: ${formatPrice(row.finalAmount)}. A paid reward is locked.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {row && <PaidForm key={row.id} row={row} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function PaidForm({ row, onClose }: { row: RewardRow; onClose: () => void }) {
  const markPaid = useMarkRewardPaid();
  const today = todayLocal();
  const [paidAt, setPaidAt] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const parsed = makePaidSchema(today).safeParse({
      paidAt,
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the date.");
      return;
    }
    setError(null);
    markPaid.mutate(
      { id: row.id as string, input: parsed.data },
      {
        onSuccess: () => {
          toast.success("Marked paid.");
          onClose();
        },
        onError: (err) => {
          if (isAlreadyPaidError(err)) {
            toast.error("Someone already marked this paid.");
            onClose();
            return;
          }
          setError(getErrorMessage(err, "Couldn't mark this paid."));
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="reward-paid-at">Paid on</Label>
          <Input
            id="reward-paid-at"
            type="date"
            max={today}
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reward-paid-note">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="reward-paid-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="For example: November payroll"
          />
        </div>
        {error && <p className="text-xs font-medium text-destructive-ink">{error}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={markPaid.isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={markPaid.isPending} className="font-semibold">
          {markPaid.isPending && (
            <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
          )}
          Mark paid
        </Button>
      </DialogFooter>
    </>
  );
}
