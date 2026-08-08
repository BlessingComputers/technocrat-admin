"use client";

import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import { useBulkEditProducts } from "../api/products.queries";
import type {
  BulkEditProductsInput,
  ProductBrand,
  ProductCategory,
} from "../types/products";

/**
 * Bulk-edit dialog for the products list. Each field defaults to "Leave
 * unchanged" — only fields the user actively changes are sent, matching the
 * backend's partial `updateMany` (name/slug/price are per-item-unique and
 * therefore not bulk-editable). Applying to zero fields is blocked client-side
 * so the backend's "at least one field" rejection never surfaces.
 */

const UNCHANGED = "__unchanged__";

type TriState = typeof UNCHANGED | "true" | "false";

interface ProductBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** DB UUIDs (ProductSummary.id) of the selected rows. */
  selectedIds: string[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  /** Called after a successful apply so the caller can clear its selection. */
  onApplied: () => void;
}

export function ProductBulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  categories,
  brands,
  onApplied,
}: ProductBulkEditDialogProps) {
  const [categoryId, setCategoryId] = useState<string>(UNCHANGED);
  const [brandId, setBrandId] = useState<string>(UNCHANGED);
  const [isActive, setIsActive] = useState<TriState>(UNCHANGED);
  const [isFeatured, setIsFeatured] = useState<TriState>(UNCHANGED);
  const [sourcingType, setSourcingType] = useState<string>(UNCHANGED);

  const bulkEdit = useBulkEditProducts();

  const reset = () => {
    setCategoryId(UNCHANGED);
    setBrandId(UNCHANGED);
    setIsActive(UNCHANGED);
    setIsFeatured(UNCHANGED);
    setSourcingType(UNCHANGED);
  };

  const changes = useMemo(() => {
    const c: Omit<BulkEditProductsInput, "productIds"> = {};
    if (categoryId !== UNCHANGED) c.categoryId = categoryId;
    if (brandId !== UNCHANGED) c.brandId = brandId;
    if (isActive !== UNCHANGED) c.isActive = isActive === "true";
    if (isFeatured !== UNCHANGED) c.isFeatured = isFeatured === "true";
    if (sourcingType !== UNCHANGED)
      c.sourcingType = sourcingType as "INHOUSE" | "OUTSOURCED";
    return c;
  }, [categoryId, brandId, isActive, isFeatured, sourcingType]);

  const changeCount = Object.keys(changes).length;

  const handleApply = () => {
    if (changeCount === 0 || selectedIds.length === 0) return;
    const promise = bulkEdit.mutateAsync({
      productIds: selectedIds,
      ...changes,
    });
    toast.promise(promise, {
      loading: `Updating ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}…`,
      success: (res) =>
        `Updated ${res.updated} product${res.updated === 1 ? "" : "s"}`,
      error: (err) => getErrorMessage(err, "Failed to update products"),
    });
    promise
      .then(() => {
        reset();
        onApplied();
        onOpenChange(false);
      })
      .catch(() => {});
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit {selectedIds.length} product
            {selectedIds.length === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Only the fields you change are applied. Leave the rest as “unchanged”.
            Name, price and stock are edited per product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Field label="Category">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCHANGED}>Leave unchanged</SelectItem>
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
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCHANGED}>Leave unchanged</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <TriStateSelect
                value={isActive}
                onChange={setIsActive}
                trueLabel="Active"
                falseLabel="Inactive"
              />
            </Field>
            <Field label="Featured">
              <TriStateSelect
                value={isFeatured}
                onChange={setIsFeatured}
                trueLabel="Featured"
                falseLabel="Not featured"
              />
            </Field>
          </div>

          <Field label="Sourcing (applies to all variants)">
            <Select value={sourcingType} onValueChange={setSourcingType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCHANGED}>Leave unchanged</SelectItem>
                <SelectItem value="INHOUSE">In-house</SelectItem>
                <SelectItem value="OUTSOURCED">Outsourced</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={bulkEdit.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={changeCount === 0 || bulkEdit.isPending}
          >
            {bulkEdit.isPending ? (
              <>
                <AppIcon
                  icon="solar:refresh-linear"
                  className="mr-2 size-4 animate-spin"
                />
                Applying…
              </>
            ) : (
              `Apply ${changeCount || ""} change${changeCount === 1 ? "" : "s"}`.trim()
            )}
          </Button>
        </DialogFooter>
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
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function TriStateSelect({
  value,
  onChange,
  trueLabel,
  falseLabel,
}: {
  value: TriState;
  onChange: (v: TriState) => void;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TriState)}>
      <SelectTrigger className="h-10 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNCHANGED}>Leave unchanged</SelectItem>
        <SelectItem value="true">{trueLabel}</SelectItem>
        <SelectItem value="false">{falseLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
}
