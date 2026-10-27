"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResetCategoryInput } from "../../types/pricing";
import type { ProductBrand, ProductCategory } from "../../types/products";
import { MetaLabel } from "@/components/shared/meta-label";

/** Sentinel for the "all" option (shadcn Select rejects ""). */
const ALL = "__all__";

interface CategoryResetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  brands: ProductBrand[];
  onSubmit: (input: ResetCategoryInput) => void;
  isSubmitting: boolean;
}

/**
 * Reset every price in a category (and optionally one brand) back to base —
 * needs no markup rule. Covers brand-only rules, deleted rules, and prices that
 * were bumped manually. At least one of category / brand must be chosen.
 */
export function CategoryResetDialog({
  isOpen,
  onOpenChange,
  categories,
  brands,
  onSubmit,
  isSubmitting,
}: CategoryResetDialogProps) {
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [brandId, setBrandId] = useState<string>(ALL);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category = categoryId === ALL ? undefined : categoryId;
    const brand = brandId === ALL ? undefined : brandId;
    if (!category && !brand) {
      setError("Pick a category, a brand, or both.");
      return;
    }
    setError(null);
    onSubmit({ categoryId: category, brandId: brand });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Reset Category Prices
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            Back to base — no rule needed
          </MetaLabel>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Resets every active variant and part in scope to its base price.
            Useful for brand-only rules, deleted rules, or manually-bumped
            prices.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Brand">
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All brands</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {error && <p className="text-xs font-medium text-destructive-ink">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg font-medium text-muted-foreground h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] rounded-lg bg-primary text-primary-foreground font-semibold h-11"
            >
              {isSubmitting ? "Resetting…" : "Reset to base"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground ml-1">
        {label}
      </Label>
      {children}
    </div>
  );
}
