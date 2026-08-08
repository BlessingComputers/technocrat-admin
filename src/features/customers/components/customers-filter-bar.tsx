"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type {
  CustomerStatus,
  CustomersListParams,
  LoyaltyTier,
} from "../types/customers";

interface CustomersFilterBarProps {
  params: CustomersListParams;
  searchInput: string;
  onSearch: (value: string) => void;
  onFilter: (patch: Partial<CustomersListParams>) => void;
  onReset: () => void;
}

const LOYALTY_TIERS: LoyaltyTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export function CustomersFilterBar({
  params,
  searchInput,
  onSearch,
  onFilter,
  onReset,
}: CustomersFilterBarProps) {
  const hasAdvanced = !!(params.loyaltyTier || params.from || params.to);
  const hasActiveFilters = !!(
    params.search ||
    params.status ||
    hasAdvanced
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1 group">
        <AppIcon
          icon="solar:magnifer-linear"
          className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
        />
        <Input
          placeholder="Search by name or email..."
          className="pl-12 h-12 rounded-md border border-border bg-card focus:ring-primary/20 font-medium"
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Select
        value={params.status || "ALL"}
        onValueChange={(val) =>
          onFilter({
            status: val === "ALL" ? undefined : (val as CustomerStatus),
          })
        }
      >
        <SelectTrigger className="h-12! data-[size=default]:h-12 px-6 rounded-md border border-border bg-card text-xs font-black uppercase tracking-widest text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/20 min-w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border text-xs font-bold text-foreground">
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
          <SelectItem value="DELETED">Deleted</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-12 px-6 rounded-md bg-card border border-border hover:bg-muted/50 flex items-center gap-2",
              hasAdvanced &&
                "border-primary text-primary bg-primary/5 hover:bg-primary/10",
            )}
          >
            <AppIcon
              icon="solar:filter-linear"
              className="w-4 h-4 text-muted-foreground"
            />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground hidden sm:inline">
              Advanced Filters
            </span>
            {hasAdvanced && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 p-6 bg-card border border-border rounded-md shadow-soft-lg space-y-6"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-foreground">
              Advanced Filters
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground">
              Refine the customer list
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Loyalty Tier
              </label>
              <Select
                value={params.loyaltyTier || "ALL"}
                onValueChange={(val) =>
                  onFilter({
                    loyaltyTier:
                      val === "ALL" ? undefined : (val as LoyaltyTier),
                  })
                }
              >
                <SelectTrigger className="h-10 w-full bg-muted/50 border border-border text-xs font-bold text-foreground">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border text-xs font-bold text-foreground">
                  <SelectItem value="ALL">All Tiers</SelectItem>
                  {LOYALTY_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier.charAt(0) + tier.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  Joined From
                </label>
                <Input
                  type="date"
                  value={params.from || ""}
                  onChange={(e) =>
                    onFilter({ from: e.target.value || undefined })
                  }
                  className="h-10 w-full bg-muted/50 border border-border text-xs font-bold text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  Joined To
                </label>
                <Input
                  type="date"
                  value={params.to || ""}
                  onChange={(e) => onFilter({ to: e.target.value || undefined })}
                  className="h-10 w-full bg-muted/50 border border-border text-xs font-bold text-foreground"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={onReset}
              className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background text-xs font-black uppercase tracking-widest rounded-md"
            >
              Reset Filters
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
