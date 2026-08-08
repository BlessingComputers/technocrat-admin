"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OrderCancelDialogProps {
  /** `close` is handed back so the parent can dismiss on mutation success. */
  onConfirm: (reason: string, close: () => void) => void;
  isPending: boolean;
  /** Consequence line under the title (e.g. "This will release held stock"). */
  consequence?: string;
  /** Minimum reason length before the confirm button enables. */
  minReasonLength?: number;
}

/**
 * Shared cancel-order flow for both the manual and gateway detail views. A
 * reason is always required (it lands in the audit trail and, for manual
 * orders, releases held stock), so the two flows differ only in copy — passed
 * in as `consequence`.
 */
export function OrderCancelDialog({
  onConfirm,
  isPending,
  consequence,
  minReasonLength = 5,
}: OrderCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const disabled = isPending || reason.trim().length < minReasonLength;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-lg border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 font-black text-[10px] uppercase tracking-widest"
        >
          <AppIcon icon="solar:forbidden-circle-linear" className="w-3 h-3 mr-2" />
          Cancel Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl p-8 border border-border">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-destructive">
            Cancel Order
          </DialogTitle>
          {consequence && (
            <p className="text-xs text-destructive/70 font-bold uppercase tracking-widest mt-1">
              {consequence}
            </p>
          )}
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Cancellation Reason
            </Label>
            <Textarea
              placeholder="e.g. Customer requested cancellation via phone."
              className="rounded-xl bg-muted/50 border-border min-h-[100px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl font-bold"
            >
              Keep Order
            </Button>
            <Button
              onClick={() =>
                onConfirm(reason.trim(), () => {
                  setOpen(false);
                  setReason("");
                })
              }
              disabled={disabled}
              className="flex-[2] h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-black shadow-lg shadow-destructive/20 disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
