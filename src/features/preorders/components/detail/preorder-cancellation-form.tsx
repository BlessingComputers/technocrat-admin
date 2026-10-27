"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/error-message";
import { useCancelPreorder } from "../../api/preorder-closure.queries";
import type { CancelPreorderInput } from "../../types/preorders";
import { formatNaira } from "../../utils/payment-terms";

type Resolution = NonNullable<CancelPreorderInput["resolution"]>;

const RESOLUTION_LABELS: Record<Resolution, string> = {
  FULL_REFUND: "Full refund",
  PARTIAL_REFUND: "Partial refund",
  STORE_CREDIT: "Store credit",
  NO_REFUND: "No refund",
};

function isResolution(value: string): value is Resolution {
  return value === "FULL_REFUND"
    || value === "PARTIAL_REFUND"
    || value === "STORE_CREDIT"
    || value === "NO_REFUND";
}

interface Props {
  preorderId: string;
  approvedAmount: number;
}

export function PreorderCancellationForm({ preorderId, approvedAmount }: Props) {
  const paid = approvedAmount > 0;
  const [reason, setReason] = useState("");
  const [resolution, setResolution] = useState<Resolution>();
  const [amount, setAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const cancellation = useCancelPreorder();
  const resolvedAmount = resolution === "FULL_REFUND" ? approvedAmount : Number(amount);
  const needsAmount = paid && resolution !== "NO_REFUND";
  const validAmount = !needsAmount || (Number.isFinite(resolvedAmount) && resolvedAmount > 0 && resolvedAmount <= approvedAmount && (resolution !== "PARTIAL_REFUND" || resolvedAmount < approvedAmount));
  const ready = Boolean(reason.trim() && confirmed && (!paid || (resolution && refundReason.trim() && validAmount)));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || cancellation.isPending) return;
    const input: CancelPreorderInput = paid
      ? { reason: reason.trim(), resolution, refundAmount: resolution === "NO_REFUND" ? null : resolvedAmount, refundReason: refundReason.trim() }
      : { reason: reason.trim() };

    cancellation.mutate({ id: preorderId, input }, {
      onSuccess: () => {
        toast.success("Preorder cancelled. Customer notified.");
      },
      onError: (error) => toast.error(getErrorMessage(error, "Could not cancel this preorder")),
    });
  }

  return <form onSubmit={submit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="preorder-cancel-reason">Cancellation reason shown to the customer</Label>
      <Textarea id="preorder-cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} required />
    </div>
    {paid && <>
      <div className="space-y-2">
        <Label>Financial resolution</Label>
        <Select value={resolution} onValueChange={(value) => {
          if (isResolution(value)) setResolution(value);
        }}>
          <SelectTrigger><SelectValue placeholder="Choose a resolution" /></SelectTrigger>
          <SelectContent>{Object.entries(RESOLUTION_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Approved payments total {formatNaira(approvedAmount)}.</p>
      </div>
      {needsAmount && <div className="space-y-2">
        <Label htmlFor="preorder-refund-amount">Resolution amount in NGN</Label>
        <Input id="preorder-refund-amount" type="number" min="0.01" max={resolution === "PARTIAL_REFUND" ? Math.max(approvedAmount - 0.01, 0.01) : approvedAmount} step="0.01" value={resolution === "FULL_REFUND" ? String(approvedAmount) : amount} onChange={(event) => setAmount(event.target.value)} disabled={resolution === "FULL_REFUND"} required />
      </div>}
      <div className="space-y-2">
        <Label htmlFor="preorder-refund-reason">Resolution reason shown to the customer</Label>
        <Textarea id="preorder-refund-reason" value={refundReason} onChange={(event) => setRefundReason(event.target.value)} maxLength={1000} required />
      </div>
    </>}
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" required />
      Cancel this preorder and notify the customer{paid ? " of the financial resolution" : ". No approved payment is recorded"}.
    </label>
    <Button type="submit" variant="destructive" disabled={!ready || cancellation.isPending}>{cancellation.isPending ? "Cancelling..." : "Cancel preorder"}</Button>
  </form>;
}
