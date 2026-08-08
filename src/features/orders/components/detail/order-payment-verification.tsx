"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils/format";
import type { ManualOrder } from "../../types/orders";

interface OrderPaymentVerificationProps {
  order: ManualOrder;
  onConfirm: (amount: number, note: string) => void;
  onReject: (reason: string) => void;
  isConfirmPending: boolean;
  isRejectPending: boolean;
}

export function OrderPaymentVerification({
  order,
  onConfirm,
  onReject,
  isConfirmPending,
  isRejectPending,
}: OrderPaymentVerificationProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const [confirmAmount, setConfirmAmount] = useState<number>(order.totalAmount);
  const [confirmNote, setConfirmNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirmAction = () => {
    onConfirm(confirmAmount, confirmNote);
    setIsConfirmOpen(false);
  };

  const handleRejectAction = () => {
    onReject(rejectReason);
    setIsRejectOpen(false);
  };

  if (!order.proofOfPaymentUrl) return null;

  return (
    <Card className="border border-border bg-card rounded-xl overflow-hidden">
      <div className="p-8 sm:p-10 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-black text-foreground flex items-center gap-3">
          <AppIcon icon="solar:shield-check-linear" className="w-6 h-6 text-primary" />
          Payment Verification
        </h3>
        <a
          href={order.proofOfPaymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:underline"
        >
          View Original{" "}
          <AppIcon icon="solar:square-arrow-right-up-linear" className="w-3 h-3" />
        </a>
      </div>
      <div className="p-8 sm:p-10 bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Customer Proof
            </p>
            <div
              className="aspect-4/5 rounded-lg border border-border overflow-hidden bg-muted relative group cursor-zoom-in"
              onClick={() => setIsPreviewOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.proofOfPaymentUrl}
                alt="Payment Proof"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <AppIcon icon="solar:eye-linear" className="w-8 h-8 text-white" />
              </div>
            </div>

            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogContent
                showCloseButton={false}
                className="max-w-6xl w-[95vw] h-[85vh] p-0 border border-white/10 bg-black/95 backdrop-blur-md shadow-2xl flex items-center justify-center rounded-3xl z-100 overflow-hidden"
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>Payment Proof Preview</DialogTitle>
                  <DialogDescription>
                    Fullscreen view of the customer&apos;s uploaded payment
                    receipt
                  </DialogDescription>
                </DialogHeader>
                <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.proofOfPaymentUrl}
                    alt="Payment Proof Fullscreen"
                    className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-300"
                  />
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-md"
                  >
                    <AppIcon icon="solar:close-circle-linear" className="w-6 h-6" />
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {order.proofUploadedAt && (
              <p className="text-[10px] text-muted-foreground font-bold text-center italic">
                Uploaded at: {new Date(order.proofUploadedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Order Totals
              </p>
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Subtotal
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(order.subtotalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Shipping
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(order.shippingCost)}
                  </span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-baseline">
                  <span className="text-xs font-black text-foreground">
                    EXPECTED TOTAL
                  </span>
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {order.paymentStatus === "PROOF_UPLOADED" && (
              <div className="space-y-4 pt-4">
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full h-14 rounded-md bg-success hover:bg-success/90 text-success-foreground font-black text-sm"
                      onClick={() => setConfirmAmount(order.totalAmount)}
                    >
                      <AppIcon icon="solar:check-circle-linear" className="w-5 h-5 mr-2" />
                      Confirm Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-xl p-8 border border-border">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-black text-foreground">
                        Confirm Payment
                      </DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                          Expected:
                        </p>
                        <span className="text-xs font-black text-primary">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Confirmed Amount (NGN)
                        </Label>
                        <Input
                          type="number"
                          className="h-14 rounded-xl bg-muted/50 border-border font-black text-xl tracking-tighter"
                          value={confirmAmount}
                          onChange={(e) =>
                            setConfirmAmount(Number(e.target.value))
                          }
                        />
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 ml-1">
                          In Words: {formatPrice(confirmAmount)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Internal Note (Optional)
                        </Label>
                        <Textarea
                          placeholder="e.g. Verified on GTBank dashboard. Amount matches."
                          className="rounded-xl bg-muted/50 border-border min-h-[100px]"
                          value={confirmNote}
                          onChange={(e) => setConfirmNote(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setIsConfirmOpen(false)}
                          className="flex-1 rounded-md font-bold"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmAction}
                          disabled={isConfirmPending}
                          className="flex-2 h-14 rounded-md bg-success hover:bg-success/90 text-success-foreground font-black"
                        >
                          {isConfirmPending ? "Validating..." : "Confirm & Process"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-14 rounded-md border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 font-bold text-sm"
                    >
                      <AppIcon icon="solar:forbidden-circle-linear" className="w-5 h-5 mr-2" />
                      Reject Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-xl p-8 border border-border">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-black text-destructive">
                        Reject Proof
                      </DialogTitle>
                      <p className="text-xs text-destructive/70 font-bold uppercase tracking-widest mt-1">
                        This will notify the customer
                      </p>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                          Rejection Reason (Visible to Customer)
                        </Label>
                        <Textarea
                          placeholder="e.g. The receipt is blurry and the amount is not visible. Please upload a clearer copy."
                          className="rounded-xl bg-muted/50 border-border min-h-[150px] font-medium"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => setIsRejectOpen(false)}
                          className="flex-1 rounded-md font-bold"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRejectAction}
                          disabled={isRejectPending}
                          className="flex-2 h-14 rounded-md bg-destructive hover:bg-destructive/90 text-white font-black"
                        >
                          {isRejectPending ? "Rejecting..." : "Send Rejection"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {order.paymentStatus === "CONFIRMED" && (
              <div className="p-6 bg-success/10 rounded-xl border border-success/20 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success text-success-foreground flex items-center justify-center">
                  <AppIcon icon="solar:check-circle-linear" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">
                    Validated Payment
                  </p>
                  <p className="font-black text-foreground text-lg tracking-tighter">
                    {formatPrice(order.confirmedAmountPaid || 0)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
