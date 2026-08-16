"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { OrderAddress } from "../../types/orders";
import { MetaLabel } from "@/components/shared/meta-label";

interface OrderDeliveryCardProps {
  deliveryMethod: string;
  shippingAddress?: OrderAddress | null;
  notes?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
}

/**
 * Delivery & logistics for the order — method, destination, rider, and any
 * customer/internal notes. Shared by both flows so a dispatched order looks the
 * same regardless of which backend it came from.
 */
export function OrderDeliveryCard({
  deliveryMethod,
  shippingAddress,
  notes,
  riderName,
  riderPhone,
}: OrderDeliveryCardProps) {
  const isDispatch = deliveryMethod === "DISPATCH";
  const icon = isDispatch ? "solar:delivery-linear" : "solar:shop-linear";

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground mb-5 flex items-center gap-2">
        <AppIcon icon={icon} className="w-4 h-4 text-primary-ink" />
        Delivery
      </h3>

      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
          <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center border border-border shrink-0">
            <AppIcon icon={icon} className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <MetaLabel className="block">
              Method
            </MetaLabel>
            <p className="text-sm font-semibold text-foreground">
              {isDispatch ? "Home Delivery" : "Store Pick-up"}
            </p>
          </div>
        </div>

        {isDispatch && shippingAddress && (
          <div className="space-y-2">
            <MetaLabel className="flex items-center gap-2">
              <AppIcon icon="solar:map-point-linear" className="w-3 h-3" />
              Shipping Address
            </MetaLabel>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {[
                shippingAddress.street ?? shippingAddress.addressLine1,
                shippingAddress.city,
                shippingAddress.state,
                shippingAddress.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        )}

        {(riderName || riderPhone) && (
          <div className="space-y-2 pt-4 border-t border-border">
            <MetaLabel className="flex items-center gap-2">
              <AppIcon icon="solar:scooter-linear" className="w-3 h-3" />
              Rider
            </MetaLabel>
            <p className="text-sm font-semibold text-foreground">{riderName}</p>
            {riderPhone && (
              <p className="text-xs text-muted-foreground font-medium">
                {riderPhone}
              </p>
            )}
          </div>
        )}

        {notes && (
          <div className="pt-4 border-t border-border">
            <MetaLabel className="mb-2 flex items-center gap-2">
              <AppIcon icon="solar:document-text-linear" className="w-3 h-3" />
              Notes
            </MetaLabel>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &ldquo;{notes}&rdquo;
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
