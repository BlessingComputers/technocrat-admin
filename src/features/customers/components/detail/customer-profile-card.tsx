import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { LoyaltyTierBadge } from "../loyalty-tier-badge";
import { fullName, initials, formatDate } from "../../utils/customer-utils";
import type { CustomerDetail } from "../../types/customers";

interface CustomerProfileCardProps {
  customer: CustomerDetail;
}

export function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  return (
    <Card className="p-8 border border-border bg-foreground rounded-xl text-background">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-black shrink-0">
          {initials(customer)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-black truncate">{fullName(customer)}</p>
          <p className="text-xs font-mono text-primary font-bold truncate">
            {customer.customerId}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-background/70">
          <AppIcon icon="solar:letter-linear" className="w-4 h-4 shrink-0" />
          <span className="truncate">{customer.email}</span>
          {customer.isEmailVerified && (
            <AppIcon
              icon="solar:verified-check-bold"
              className="w-3.5 h-3.5 text-success shrink-0"
            />
          )}
        </div>
        {customer.phone && (
          <div className="flex items-center gap-3 text-xs text-background/70">
            <AppIcon icon="solar:phone-linear" className="w-4 h-4 shrink-0" />
            <span className="truncate">{customer.phone}</span>
            {customer.isPhoneVerified && (
              <AppIcon
                icon="solar:verified-check-bold"
                className="w-3.5 h-3.5 text-success shrink-0"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-background/10 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-background/40">
            Loyalty Tier
          </span>
          <LoyaltyTierBadge tier={customer.loyaltyTier} />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-background/40">
            Loyalty Points
          </span>
          <span className="text-sm font-black">
            {customer.loyaltyPoints ?? 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-background/40">
            Joined
          </span>
          <span className="text-sm font-bold">
            {formatDate(customer.createdAt)}
          </span>
        </div>
        {customer.lastLoginAt && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-background/40">
              Last Login
            </span>
            <span className="text-sm font-bold">
              {formatDate(customer.lastLoginAt)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
