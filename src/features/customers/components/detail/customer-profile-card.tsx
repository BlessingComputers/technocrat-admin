import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { LoyaltyTierBadge } from "../loyalty-tier-badge";
import { fullName, initials, formatDate } from "../../utils/customer-utils";
import type { CustomerDetail } from "../../types/customers";
import { MetaLabel } from "@/components/shared/meta-label";

interface CustomerProfileCardProps {
  customer: CustomerDetail;
}

export function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  // Inverted panel: `bg-foreground` flips with the theme, so it is near-black in
  // light mode and near-WHITE in dark. No hue role survives that — `-ink` and the
  // raw token are both light in dark mode (measured 1.8-2.6:1 on this panel, both
  // apps, both themes). Text here uses the background family only; the accent
  // survives as a tint fill, never as text. Do not "restore" -ink here.
  return (
    <Card className="p-8 bg-foreground text-background">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/20 text-background flex items-center justify-center text-lg font-semibold shrink-0">
          {initials(customer)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold truncate">{fullName(customer)}</p>
          <p className="text-xs font-mono text-background/90 font-semibold truncate">
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
              className="w-3.5 h-3.5 text-background/80 shrink-0"
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
                className="w-3.5 h-3.5 text-background/80 shrink-0"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-background/10 space-y-4">
        <div className="flex justify-between items-center">
          <MetaLabel tone="inverted">
            Loyalty Tier
          </MetaLabel>
          <LoyaltyTierBadge tier={customer.loyaltyTier} />
        </div>
        <div className="flex justify-between items-center">
          <MetaLabel tone="inverted">
            Loyalty Points
          </MetaLabel>
          <span className="text-sm font-semibold">
            {customer.loyaltyPoints ?? 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <MetaLabel tone="inverted">
            Joined
          </MetaLabel>
          <span className="text-sm font-semibold">
            {formatDate(customer.createdAt)}
          </span>
        </div>
        {customer.lastLoginAt && (
          <div className="flex justify-between items-center">
            <MetaLabel tone="inverted">
              Last Login
            </MetaLabel>
            <span className="text-sm font-semibold">
              {formatDate(customer.lastLoginAt)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
