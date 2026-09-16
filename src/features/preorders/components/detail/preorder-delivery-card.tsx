import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { preorderAddressLines } from "../../utils/preorder-utils";
import type { Preorder } from "../../types/preorders";

interface PreorderDeliveryCardProps {
  preorder: Preorder;
}

/** Where it goes if we source it. */
export function PreorderDeliveryCard({ preorder }: PreorderDeliveryCardProps) {
  const lines = preorderAddressLines(preorder);

  return (
    <Card className="p-8 space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
        Delivery address
      </h2>

      {lines.length > 0 ? (
        <div className="flex items-start gap-3">
          <AppIcon
            icon="solar:map-point-linear"
            className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground"
          />
          <address className="not-italic text-sm leading-relaxed text-foreground">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No address on this pre-order.
        </p>
      )}
    </Card>
  );
}
