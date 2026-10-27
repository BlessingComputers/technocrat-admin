"use client";

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
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/shared/app-icon";
import {
  FilterBar,
  FilterSearch,
  filterControlClass,
} from "@/components/shared/filter-bar";
import { cn } from "@/lib/utils/cn";
import { MetaLabel } from "@/components/shared/meta-label";
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
    <FilterBar>
      <FilterSearch
        placeholder="Search by name or email..."
        value={searchInput}
        onChange={(e) => onSearch(e.target.value)}
      />

      <Select
        value={params.status || "ALL"}
        onValueChange={(val) =>
          onFilter({
            status: val === "ALL" ? undefined : (val as CustomerStatus),
          })
        }
      >
        <SelectTrigger className={filterControlClass}>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
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
              "gap-2",
              hasAdvanced &&
                "border-primary text-primary-ink bg-primary/5 hover:bg-primary/10",
            )}
          >
            <AppIcon
              icon="solar:filter-linear"
              className="w-4 h-4 text-muted-foreground"
            />
            <MetaLabel className="hidden sm:inline">
              Advanced Filters
            </MetaLabel>
            {hasAdvanced && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 space-y-6 p-6 shadow-soft-lg"
        >
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-foreground">
              Advanced Filters
            </h4>
            <p className="text-xs font-medium text-muted-foreground">
              Refine the customer list
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <MetaLabel asChild>
                <label>
                  Loyalty Tier
                </label>
              </MetaLabel>
              <Select
                value={params.loyaltyTier || "ALL"}
                onValueChange={(val) =>
                  onFilter({
                    loyaltyTier:
                      val === "ALL" ? undefined : (val as LoyaltyTier),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
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
                <MetaLabel asChild>
                  <label>
                    Joined From
                  </label>
                </MetaLabel>
                <Input
                  type="date"
                  value={params.from || ""}
                  onChange={(e) =>
                    onFilter({ from: e.target.value || undefined })
                  }
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <MetaLabel asChild>
                  <label>
                    Joined To
                  </label>
                </MetaLabel>
                <Input
                  type="date"
                  value={params.to || ""}
                  onChange={(e) => onFilter({ to: e.target.value || undefined })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={onReset}
              className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background text-xs font-medium rounded-md"
            >
              Reset Filters
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </FilterBar>
  );
}
