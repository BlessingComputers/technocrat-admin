"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/error-message";
import { useRequestPreorderBalance } from "../../api/payment-terms.queries";
import { validNewDeadline } from "../../utils/payment-changes";
import { defaultPaymentDeadline, formatNaira, toDateTimeLocalValue, westAfricaLocalToIso } from "../../utils/payment-terms";

export function PreorderBalanceRequestForm({ preorderId, amount }: { preorderId: string; amount: number }) {
  const [received, setReceived] = useState(false);
  const [method, setMethod] = useState<"TRANSFER_BEFORE_HANDOFF" | "PAY_AT_HANDOFF" | null>(null);
  const [payBy, setPayBy] = useState(() => toDateTimeLocalValue(defaultPaymentDeadline()));
  const request = useRequestPreorderBalance();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!received || !method || request.isPending) return;
    if (method === "TRANSFER_BEFORE_HANDOFF" && !validNewDeadline(payBy, null)) {
      toast.error("Choose a future payment deadline");
      return;
    }
    const input = method === "TRANSFER_BEFORE_HANDOFF"
      ? { collectionMethod: method, payBy: westAfricaLocalToIso(payBy) }
      : { collectionMethod: method };
    request.mutate({ preorderId, input }, {
      onSuccess: () => toast.success("Balance requested. Customer notified."),
      onError: (error) => toast.error(getErrorMessage(error, "Could not request the balance")),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted-foreground">Request the remaining {formatNaira(amount)} after receiving and checking the item.</p>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={received} onChange={(event) => setReceived(event.target.checked)} className="mt-1 size-4" required />
        I have physically received and checked the item.
      </label>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">How should the customer pay?</legend>
        <label className="flex items-center gap-3 text-sm"><input type="radio" name="balance-method" checked={method === "TRANSFER_BEFORE_HANDOFF"} onChange={() => setMethod("TRANSFER_BEFORE_HANDOFF")} required />Bank transfer before delivery or pickup</label>
        <label className="flex items-center gap-3 text-sm"><input type="radio" name="balance-method" checked={method === "PAY_AT_HANDOFF"} onChange={() => setMethod("PAY_AT_HANDOFF")} required />Pay at delivery or pickup</label>
      </fieldset>
      {method === "TRANSFER_BEFORE_HANDOFF" && <div className="space-y-2">
        <Label htmlFor="balance-pay-by">Balance deadline, WAT</Label>
        <Input id="balance-pay-by" type="datetime-local" value={payBy} onChange={(event) => setPayBy(event.target.value)} required />
        <p className="text-xs text-muted-foreground">Defaults to 72 hours. The customer must submit a receipt before this deadline.</p>
      </div>}
      <Button type="submit" disabled={!received || !method || (method === "TRANSFER_BEFORE_HANDOFF" && !payBy) || request.isPending}>{request.isPending ? "Requesting..." : "Request balance"}</Button>
    </form>
  );
}
