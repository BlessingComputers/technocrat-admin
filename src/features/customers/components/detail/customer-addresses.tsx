import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import type { CustomerAddress } from "../../types/customers";

interface CustomerAddressesProps {
  addresses?: CustomerAddress[];
}

function formatLine(address: CustomerAddress): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function CustomerAddresses({ addresses }: CustomerAddressesProps) {
  if (!addresses || addresses.length === 0) return null;

  return (
    <Card className="p-8 border border-border bg-card rounded-xl">
      <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
        <AppIcon icon="solar:map-point-linear" className="w-5 h-5 text-primary" />
        Addresses
      </h3>
      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="p-4 bg-muted/40 rounded-lg border border-border"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black text-foreground">
                {[address.firstName, address.lastName]
                  .filter(Boolean)
                  .join(" ") || "Address"}
              </p>
              {address.isDefault && (
                <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              {formatLine(address)}
            </p>
            {address.phone && (
              <p className="text-[11px] text-muted-foreground font-bold mt-1">
                {address.phone}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
