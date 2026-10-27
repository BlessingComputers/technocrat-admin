"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/error-message";
import { useRecordHandoffCollection } from "../../api/payment-terms.queries";
import type { RecordHandoffCollectionInput } from "../../types/preorders";

type PaymentMethod = RecordHandoffCollectionInput["paymentMethod"];

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === "CASH" || value === "POS" || value === "TRANSFER";
}

export function PreorderHandoffCollectionForm({ preorderId, requestId }: {
  preorderId: string;
  requestId: string;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [transactionReference, setTransactionReference] = useState("");
  const [note, setNote] = useState("");
  const collection = useRecordHandoffCollection();
  const needsReference = paymentMethod === "TRANSFER";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMethod || collection.isPending) return;
    const trimmedReference = transactionReference.trim();
    if (needsReference && !trimmedReference) return;
    const trimmedNote = note.trim();
    const input: RecordHandoffCollectionInput = paymentMethod === "TRANSFER"
      ? {
          paymentMethod,
          transactionReference: trimmedReference,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        }
      : {
          paymentMethod,
          ...(trimmedNote ? { note: trimmedNote } : {}),
        };
    collection.mutate({ preorderId, requestId, input }, {
      onSuccess: () => toast.success("Handoff payment recorded. Fulfilment is still separate."),
      onError: (error) => toast.error(getErrorMessage(error, "Could not record the handoff payment")),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor={`handoff-method-${requestId}`}>Payment method</Label>
        <select
          id={`handoff-method-${requestId}`}
          value={paymentMethod}
          onChange={(event) => {
            const value = event.target.value;
            setPaymentMethod(isPaymentMethod(value) ? value : "");
          }}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          required
        >
          <option value="">Choose a method</option>
          <option value="CASH">Cash</option>
          <option value="POS">POS</option>
          <option value="TRANSFER">Transfer</option>
        </select>
      </div>
      {needsReference && <div className="space-y-2">
        <Label htmlFor={`handoff-reference-${requestId}`}>Transaction reference</Label>
        <Input id={`handoff-reference-${requestId}`} value={transactionReference} onChange={(event) => setTransactionReference(event.target.value)} maxLength={200} required />
      </div>}
      <div className="space-y-2">
        <Label htmlFor={`handoff-note-${requestId}`}>Note, optional</Label>
        <Input id={`handoff-note-${requestId}`} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} />
      </div>
      <Button type="submit" disabled={!paymentMethod || (needsReference && !transactionReference.trim()) || collection.isPending}>
        {collection.isPending ? "Recording..." : "Record collection"}
      </Button>
      <p className="text-xs text-muted-foreground">This records payment only. Mark fulfilment after the customer receives the item.</p>
    </form>
  );
}
