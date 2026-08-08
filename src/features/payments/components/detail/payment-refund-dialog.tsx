"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRecordRefund } from "../../api/payments.queries";
import type { AdminTransactionDetail } from "../../types/payments";

interface PaymentRefundDialogProps {
  payment: AdminTransactionDetail;
}

/**
 * Records a refund that was already processed manually (bank/Miden/Paystack
 * dashboard) — this endpoint does NOT trigger a bank refund itself
 * (PAYMENTS-BACKEND-CONTRACT.md §2, `POST /payments/refund`). Amount is
 * optional (omit = full remaining balance); `idempotencyKey` is generated
 * per submission so a double-click can't double-record.
 */
export function PaymentRefundDialog({ payment }: PaymentRefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("bank_transfer");
  const mutation = useRecordRefund();

  const disabled = mutation.isPending || reason.trim().length < 5;

  const submit = () => {
    mutation.mutate(
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: amount ? Number(amount) : undefined,
        reason: reason.trim(),
        refundMethod,
        idempotencyKey: `refund-${payment.paymentId}-${Date.now()}`,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setAmount("");
          setReason("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest"
        >
          <AppIcon icon="solar:card-recive-linear" className="w-3 h-3 mr-2" />
          Record Refund
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-xl p-8 border border-border">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-foreground">
            Record Refund
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            This only records a refund already processed elsewhere — it does
            not move money.
          </p>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Amount (leave blank for full remaining balance)
            </Label>
            <Input
              type="number"
              min={0}
              placeholder={String(payment.amount)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg bg-muted/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Refund Method
            </Label>
            <Input
              placeholder="bank_transfer, cash, miden_dashboard..."
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="rounded-lg bg-muted/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Reason
            </Label>
            <Textarea
              placeholder="e.g. Customer returned the item in good condition"
              className="rounded-lg bg-muted/50 border-border min-h-[90px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button
            onClick={submit}
            disabled={disabled}
            className="w-full h-12 rounded-lg font-black disabled:opacity-50"
          >
            {mutation.isPending ? "Recording..." : "Record Refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
