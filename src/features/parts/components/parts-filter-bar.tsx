"use client";

import { Input } from "@/components/ui/input";
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
import type { Brand, Category, PartType, PartsListParams } from "../types/parts";

interface PartsFilterBarProps {
  params: PartsListParams;
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onChange: (patch: Partial<PartsListParams>) => void;
  onReset: () => void;
}

interface ActiveChip {
  key: string;
  label: string;
  clear: Partial<PartsListParams>;
}

export function PartsFilterBar({
  params,
  categories,
  brands,
  partTypes,
  searchValue,
  onSearchChange,
  onChange,
  onReset,
}: PartsFilterBarProps) {
  const category = params.categoryId ?? "all";
  const brand = params.brandId ?? "all";
  const type = params.partType ?? "all";
  const status =
    params.isActive === true
      ? "active"
      : params.isActive === false
        ? "inactive"
        : "all";
  const stock =
    params.isInStock === true
      ? "in"
      : params.isInStock === false
        ? "out"
        : "all";

  const chips: ActiveChip[] = [];
  if (category !== "all")
    chips.push({
      key: "category",
      label: `Category: ${categories.find((c) => c.id === category)?.name ?? category}`,
      clear: { categoryId: undefined },
    });
  if (brand !== "all")
    chips.push({
      key: "brand",
      label: `Brand: ${brands.find((b) => b.id === brand)?.name ?? brand}`,
      clear: { brandId: undefined },
    });
  if (type !== "all")
    chips.push({
      key: "type",
      label: `Type: ${partTypes.find((t) => t.slug === type)?.name ?? type}`,
      clear: { partType: undefined },
    });
  if (status !== "all")
    chips.push({
      key: "status",
      label: `Status: ${status}`,
      clear: { isActive: undefined },
    });
  if (stock !== "all")
    chips.push({
      key: "stock",
      label: stock === "in" ? "In stock" : "Out of stock",
      clear: { isInStock: undefined },
    });

  const hasActiveFilters = chips.length > 0 || searchValue !== "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full flex-1 lg:max-w-md">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search parts by name or part number..."
            className="h-9 w-full border border-border bg-card pl-9 font-medium focus:ring-primary/20"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select
            value={type}
            onValueChange={(v) =>
              onChange({ partType: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card sm:w-[150px]">
              <SelectValue placeholder="Part type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {partTypes.map((t) => (
                <SelectItem key={t.id} value={t.slug}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(v) =>
              onChange({ categoryId: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card sm:w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brand}
            onValueChange={(v) =>
              onChange({ brandId: v === "all" ? undefined : v })
            }
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card sm:w-[140px]">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stock}
            onValueChange={(v) =>
              onChange({
                isInStock: v === "all" ? undefined : v === "in",
              })
            }
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card sm:w-[130px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) =>
              onChange({
                isActive: v === "all" ? undefined : v === "active",
              })
            }
          >
            <SelectTrigger className="h-9 w-full border border-border bg-card sm:w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
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
