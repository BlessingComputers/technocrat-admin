"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type {
  CustomerDecision,
  Invoice,
  ProductAvailability,
} from "../../types/invoice";

interface InvoiceReviewPanelProps {
  invoice: Invoice;
  onSubmit: (
    availability: ProductAvailability,
    decision: CustomerDecision | undefined,
  ) => void;
  isSubmitting: boolean;
  onReassign: () => void;
  isReassigning: boolean;
}

/**
 * Outsourced claim-review controls (screens 5–7). The single availability
 * select applies to the whole invoice; the customer-decision branch only
 * appears when items are unavailable.
 */
export function InvoiceReviewPanel({
  invoice,
  onSubmit,
  isSubmitting,
  onReassign,
  isReassigning,
}: InvoiceReviewPanelProps) {
  const [availability, setAvailability] =
    useState<ProductAvailability>("AVAILABLE");
  const [decision, setDecision] = useState<CustomerDecision>("AGREED_TO_WAIT");

  const isUnavailable = availability === "UNAVAILABLE";
  const willReject = isUnavailable && decision === "REQUESTS_REFUND";
  const rep = invoice.representative;

  const actionButton = (
    <ActionButton
      reject={willReject}
      isSubmitting={isSubmitting}
      onClick={() => onSubmit(availability, isUnavailable ? decision : undefined)}
    />
  );

  return (
    <div className="space-y-6">
      <Card className="gap-0 border bg-card p-8">
        <h3 className="text-base font-bold text-foreground">
          Product availability
        </h3>
        <div className="mt-4 space-y-2">
          <label className="text-xs text-muted-foreground">
            Product availability
          </label>
          <Select
            value={availability}
            onValueChange={(v) => setAvailability(v as ProductAvailability)}
          >
            <SelectTrigger className="h-12 w-full rounded-lg border-border/60 bg-muted/40 text-sm data-[size=default]:h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isUnavailable && (
          <div className="mt-8 flex justify-center">{actionButton}</div>
        )}
      </Card>

      {isUnavailable && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Customer communication */}
          <Card className="gap-0 border bg-card p-8">
            <h3 className="text-base font-bold text-foreground">
              Customer Communication
            </h3>
            <div className="mt-4 space-y-2">
              <label className="text-xs text-muted-foreground">
                Assigned representative
              </label>
              <div className="flex items-center gap-3">
                <Select value={rep?.staffId ?? "none"} disabled>
                  <SelectTrigger className="h-11 flex-1 rounded-lg border-border/60 bg-muted/40 text-sm data-[size=default]:h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    <SelectItem value={rep?.staffId ?? "none"}>
                      {rep ? `${rep.firstName} ${rep.lastName}` : "Unassigned"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onReassign}
                  disabled={isReassigning}
                  className="h-11 gap-2 rounded-lg px-5 font-medium"
                >
                  <AppIcon icon="solar:add-circle-linear" className="h-4 w-4" />
                  Re assign
                </Button>
              </div>
            </div>
          </Card>

          {/* Customer decision */}
          <Card className="gap-0 border bg-card p-8">
            <h3 className="text-base font-bold text-foreground">
              Customer decision
            </h3>
            <div className="mt-4 space-y-2">
              <label className="text-xs text-muted-foreground">
                Customer&apos;s decision
              </label>
              <Select
                value={decision}
                onValueChange={(v) => setDecision(v as CustomerDecision)}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-border/60 bg-muted/40 text-sm data-[size=default]:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-sm">
                  <SelectItem value="AGREED_TO_WAIT">Agreed to wait</SelectItem>
                  <SelectItem value="REQUESTS_REFUND">Requests refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-6">{actionButton}</div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  reject,
  isSubmitting,
  onClick,
}: {
  reject: boolean;
  isSubmitting: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      className={cn(
        "h-11 gap-2 rounded-lg px-7 font-medium text-white shadow-sm",
        reject
          ? "bg-destructive hover:bg-destructive/90"
          : "bg-success hover:bg-success/90",
      )}
    >
      <AppIcon icon="solar:add-circle-linear" className="h-4 w-4" />
      {isSubmitting
        ? "Submitting..."
        : reject
          ? "Reject Invoice"
          : "Approve Invoice"}
      <AppIcon icon="solar:add-circle-linear" className="h-4 w-4" />
    </Button>
  );
}
