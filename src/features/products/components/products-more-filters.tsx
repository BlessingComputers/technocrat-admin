"use client";

import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductsListParams } from "../types/products";

export interface ConditionOption {
  value: string;
  label: string;
  count?: number;
}

interface ProductsMoreFiltersProps {
  params: ProductsListParams;
  conditionOptions: ConditionOption[];
  /** Commits the advanced filters in a single patch (one history entry). */
  onApply: (patch: Partial<ProductsListParams>) => void;
}

/**
 * Advanced filters (condition · price range · featured) tucked behind a popover
 * so the inline bar stays calm. The draft is local and committed on Apply as one
 * patch — keeping each price keystroke out of the URL history. The active-count
 * badge reflects the committed params, not the draft.
 */
export function ProductsMoreFilters({
  params,
  conditionOptions,
  onApply,
}: ProductsMoreFiltersProps) {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState(params.condition ?? "");
  const [minPrice, setMinPrice] = useState(params.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(params.maxPrice?.toString() ?? "");
  const [featured, setFeatured] = useState(Boolean(params.isFeatured));

  const activeCount =
    (params.condition ? 1 : 0) +
    (params.minPrice != null ? 1 : 0) +
    (params.maxPrice != null ? 1 : 0) +
    (params.isFeatured ? 1 : 0);

  const min = minPrice.trim() === "" ? undefined : Number(minPrice);
  const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);
  const priceError =
    min != null && max != null && Number.isFinite(min) && Number.isFinite(max)
      ? min > max
      : false;

  // Reflect the committed params whenever the popover opens.
  function handleOpenChange(next: boolean) {
    if (next) {
      setCondition(params.condition ?? "");
      setMinPrice(params.minPrice?.toString() ?? "");
      setMaxPrice(params.maxPrice?.toString() ?? "");
      setFeatured(Boolean(params.isFeatured));
    }
    setOpen(next);
  }

  function apply() {
    if (priceError) return;
    onApply({
      condition: condition || undefined,
      minPrice: min != null && Number.isFinite(min) ? min : undefined,
      maxPrice: max != null && Number.isFinite(max) ? max : undefined,
      isFeatured: featured ? true : undefined,
    });
    setOpen(false);
  }

  function clear() {
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setFeatured(false);
    onApply({
      condition: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      isFeatured: undefined,
    });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full border border-border bg-card font-medium sm:w-auto"
        >
          <AppIcon icon="solar:tuning-2-linear" className="mr-2 size-4" />
          More filters
          {activeCount > 0 && (
            <Badge
              variant="muted"
              className="ml-2 h-5 min-w-5 justify-center px-1.5 text-xs font-semibold"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Condition
          </Label>
          <Select
            value={condition || "any"}
            onValueChange={(v) => setCondition(v === "any" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card">
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any condition</SelectItem>
              {conditionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                  {opt.count != null ? ` (${opt.count})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Price range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              className="h-9 border border-border bg-card"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              className="h-9 border border-border bg-card"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          {priceError && (
            <p className="text-xs font-medium text-destructive">
              Min price can’t be greater than max.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
          <Label
            htmlFor="featured-only"
            className="text-xs font-medium text-foreground"
          >
            Featured only
          </Label>
          <Switch
            id="featured-only"
            checked={featured}
            onCheckedChange={setFeatured}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={apply}
            disabled={priceError}
            className="h-8 px-4 font-medium"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
