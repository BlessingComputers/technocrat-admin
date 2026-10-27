"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { FilterSearch } from "@/components/shared/filter-bar";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type {
  ProductBrand,
  ProductCategory,
  ProductsListParams,
} from "../types/products";
import {
  ProductsMoreFilters,
  type ConditionOption,
} from "./products-more-filters";

type Tab = NonNullable<ProductsListParams["tab"]>;
const TABS: Tab[] = ["all", "inhouse", "outsourced", "inactive"];

interface ProductsFilterBarProps {
  params: ProductsListParams;
  categories: ProductCategory[];
  brands: ProductBrand[];
  conditionOptions: ConditionOption[];
  /** Controlled (instant) value for the search box; the URL is updated debounced. */
  searchValue: string;
  onSearchChange: (value: string) => void;
  onChange: (patch: Partial<ProductsListParams>) => void;
  onReset: () => void;
}

interface ActiveChip {
  key: string;
  label: string;
  clear: Partial<ProductsListParams>;
}

export function ProductsFilterBar({
  params,
  categories,
  brands,
  conditionOptions,
  searchValue,
  onSearchChange,
  onChange,
  onReset,
}: ProductsFilterBarProps) {
  const activeTab = params.tab ?? "all";
  const category = params.category ?? "all";
  const brand = params.brand ?? "all";
  const stock = params.stock ?? "all";

  const priceLabel = (() => {
    const { minPrice, maxPrice } = params;
    if (minPrice != null && maxPrice != null)
      return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
    if (minPrice != null) return `≥ ${formatPrice(minPrice)}`;
    if (maxPrice != null) return `≤ ${formatPrice(maxPrice)}`;
    return null;
  })();

  const chips: ActiveChip[] = [];
  if (activeTab !== "all")
    chips.push({
      key: "tab",
      label: `Tab: ${activeTab}`,
      clear: { tab: undefined },
    });
  if (category !== "all")
    chips.push({
      key: "category",
      label: `Category: ${categories.find((c) => c.slug === category)?.name || category}`,
      clear: { category: undefined },
    });
  if (brand !== "all")
    chips.push({
      key: "brand",
      label: `Brand: ${brands.find((b) => b.slug === brand)?.name || brand}`,
      clear: { brand: undefined },
    });
  if (stock !== "all")
    chips.push({ key: "stock", label: `Stock: ${stock}`, clear: { stock: undefined } });
  if (params.condition)
    chips.push({
      key: "condition",
      label: `Condition: ${
        conditionOptions.find((o) => o.value === params.condition)?.label ??
        params.condition
      }`,
      clear: { condition: undefined },
    });
  if (priceLabel)
    chips.push({
      key: "price",
      label: `Price: ${priceLabel}`,
      clear: { minPrice: undefined, maxPrice: undefined },
    });
  if (params.isFeatured)
    chips.push({ key: "featured", label: "Featured", clear: { isFeatured: undefined } });

  const hasActiveFilters = chips.length > 0 || searchValue !== "";

  return (
    <div className="flex flex-col gap-4">
      {/* View tabs */}
      <div className="w-full overflow-x-auto">
        <div className="flex w-max gap-0.5 rounded-md border border-border bg-muted/50 p-1 text-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onChange({ tab: tab === "all" ? undefined : tab })}
              className={cn(
                "whitespace-nowrap rounded-sm px-3 py-1.5 font-medium capitalize transition-all",
                activeTab === tab
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "inhouse" ? "In-House" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search + selects */}
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <FilterSearch
          wrapperClassName="w-full lg:max-w-md"
          placeholder="Search products..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:flex sm:items-center">
          <Select
            value={category}
            onValueChange={(v) =>
              onChange({ category: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brand}
            onValueChange={(v) => onChange({ brand: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.slug}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stock}
            onValueChange={(v) =>
              onChange({
                stock:
                  v === "all" ? undefined : (v as ProductsListParams["stock"]),
              })
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <ProductsMoreFilters
            params={params}
            conditionOptions={conditionOptions}
            onApply={onChange}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <AppIcon icon="solar:close-circle-linear" className="mr-1 size-3" />
            Clear Filters
          </Button>
          {chips.length > 0 && (
            <>
              <div className="mx-1 h-4 w-px bg-border" />
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <Badge
                    key={chip.key}
                    variant="muted"
                    className="h-6 gap-1 px-2 text-xs capitalize"
                  >
                    {chip.label}
                    <button
                      type="button"
                      onClick={() => onChange(chip.clear)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`Remove ${chip.label}`}
                    >
                      <AppIcon icon="solar:close-circle-linear" className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
