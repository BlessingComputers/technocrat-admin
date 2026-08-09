"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { MetaLabel } from "@/components/shared/meta-label";

interface OrderFulfillmentManagerProps {
  currentStatus: string;
  deliveryMethod: string;
  /** Manual orders collect rider details on `ASSIGNED`; gateway orders don't. */
  collectRider?: boolean;
  onSubmit: (
    status: string,
    data: { note: string; riderName: string; riderPhone: string },
  ) => void;
  isPending: boolean;
}

interface FulfillmentOption {
  value: string;
  label: string;
}

// Forward fulfilment transitions. The backend enforces the legal transition map
// and rejects anything illegal; cancellation has its own reason-gated flow, so
// it's deliberately excluded here.
function buildOptions(deliveryMethod: string): FulfillmentOption[] {
  const opts: FulfillmentOption[] = [
    { value: "PROCESSING", label: "Preparing Order" },
  ];
  if (deliveryMethod === "DISPATCH") {
    opts.push(
      { value: "ASSIGNED", label: "Assign Rider" },
      { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
      { value: "DELIVERED", label: "Mark as Delivered" },
    );
  }
  opts.push({ value: "COMPLETED", label: "Complete Order" });
  return opts;
}

/**
 * Fulfilment control shared by both order flows: pick the next status, add an
 * optional note (and rider details for a dispatch assignment), with a live flow
 * guide showing where the order sits. Each view wires `onSubmit` to its own
 * status mutation, so the two pages present one identical control.
 */
export function OrderFulfillmentManager({
  currentStatus,
  deliveryMethod,
  collectRider = false,
  onSubmit,
  isPending,
}: OrderFulfillmentManagerProps) {
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [riderInfo, setRiderInfo] = useState({ name: "", phone: "" });

  const options = buildOptions(deliveryMethod);
  const isDispatch = deliveryMethod === "DISPATCH";
  const showRider = collectRider && newStatus === "ASSIGNED";

  const handleUpdate = () => {
    onSubmit(newStatus, {
      note: statusNote,
      riderName: riderInfo.name,
      riderPhone: riderInfo.phone,
    });
  };

  return (
    <Card className="p-8 sm:p-10">
      <h3 className="text-xl font-semibold text-foreground mb-8 flex items-center gap-3">
        <AppIcon icon="solar:delivery-linear" className="w-6 h-6 text-primary-ink" />
        Fulfilment
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              Next Status
            </Label>
            <select
              className="w-full h-14 px-6 rounded-md bg-muted/50 border border-border font-semibold text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Select status...</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {showRider && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground ml-1">
                  Rider Name
                </Label>
                <Input
                  className="h-14 rounded-md bg-muted/50"
                  value={riderInfo.name}
                  onChange={(e) =>
                    setRiderInfo({ ...riderInfo, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground ml-1">
                  Rider Phone
                </Label>
                <Input
                  className="h-14 rounded-md bg-muted/50"
                  value={riderInfo.phone}
                  onChange={(e) =>
                    setRiderInfo({ ...riderInfo, phone: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground ml-1">
              Fulfilment Note (Optional)
            </Label>
            <Textarea
              placeholder="e.g. Order packed and ready for pickup."
              className="rounded-md bg-muted/50 border-border min-h-[72px]"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>

          <Button
            disabled={!newStatus || isPending}
            onClick={handleUpdate}
            className="w-full h-14 rounded-md bg-foreground text-background font-medium text-sm"
          >
            {isPending ? "Updating..." : "Update Fulfilment Status"}
          </Button>
        </div>

        <div className="bg-muted/40 rounded-xl p-8 space-y-6 border border-border">
          <MetaLabel className="block">
            Status Flow Guide
          </MetaLabel>
          <div className="space-y-4">
            <StatusFlowItem
              label="Preparing Order"
              active={currentStatus === "PROCESSING"}
            />
            {isDispatch && (
              <>
                <StatusFlowItem
                  label="Rider Assigned"
                  active={currentStatus === "ASSIGNED"}
                />
                <StatusFlowItem
                  label="In Transit"
                  active={currentStatus === "OUT_FOR_DELIVERY"}
                />
                <StatusFlowItem
                  label="Delivered"
                  active={currentStatus === "DELIVERED"}
                />
              </>
            )}
            <StatusFlowItem
              label="Completed"
              active={currentStatus === "COMPLETED"}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatusFlowItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/30",
        )}
      />
      <p
        className={cn(
          "text-xs font-semibold",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
    </div>
  );
}
