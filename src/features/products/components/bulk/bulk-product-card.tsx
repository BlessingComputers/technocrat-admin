"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { ProductBrand, ProductCategory } from "../../types/products";
import { useSubcategories } from "../../api/products.queries";
import { BulkVariantRow } from "./bulk-variant-row";
import { BulkImagesSection } from "./bulk-images-section";
import {
  newBulkSpec,
  validateBulkRow,
  type BulkImage,
  type BulkRow,
  type BulkSpec,
  type BulkVariant,
} from "./bulk-helpers";

interface BulkProductCardProps {
  row: BulkRow;
  categories: ProductCategory[];
  brands: ProductBrand[];
  /** Top-level markup % — Cost edits derive Price from it. */
  markupPct: number;
  /** Batch-wide duplicate part numbers (uppercased) — flagged as row errors. */
  duplicateSkus: ReadonlySet<string>;
  /** Mark this row's still-local images as "not uploaded" (set after a user
   * chooses to import without them following an image-upload failure). */
  flagMissingImages?: boolean;
  onChange: (id: string, patch: Partial<BulkRow>) => void;
  onRemove: (id: string) => void;
}

const SECTION_LABEL =
  "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function BulkProductCard({
  row,
  categories,
  brands,
  markupPct,
  duplicateSkus,
  flagMissingImages,
  onChange,
  onRemove,
}: BulkProductCardProps) {
  const [open, setOpen] = useState(false);
  const errors = validateBulkRow(row, duplicateSkus);
  const valid = errors.length === 0;

  // Local images that never made it to the CDN — only surfaced once flagged.
  const missingImages =
    !!flagMissingImages && row.images.some((img) => img.file && !img.uploaded);

  const { data: subcategories = [], isLoading: subsLoading } = useSubcategories(
    row.categoryId,
  );

  // ── nested updaters ──
  // Each product has a single "Default" variant — the pricing/inventory carrier.
  const updateVariant = (patch: Partial<BulkVariant>) =>
    onChange(row.id, {
      variants: [{ ...row.variants[0], ...patch }],
    });

  const setImages = (images: BulkImage[]) => onChange(row.id, { images });

  const setSpecs = (specifications: BulkSpec[]) =>
    onChange(row.id, { specifications });
  const updateSpec = (sid: string, patch: Partial<BulkSpec>) =>
    setSpecs(row.specifications.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  const addSpec = () => setSpecs([...row.specifications, newBulkSpec()]);
  const removeSpec = (sid: string) =>
    setSpecs(row.specifications.filter((s) => s.id !== sid));

  const fromPrice = row.variants[0]?.price || "—";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      {/* Summary header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span title={valid ? "Ready" : errors.join(", ")}>
            <AppIcon
              icon={valid ? "solar:check-circle-bold" : "solar:danger-circle-bold"}
              className={cn("size-5 shrink-0", valid ? "text-success" : "text-warning")}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {row.name || "Untitled product"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Badge variant="muted" className="font-mono">
                {categories.find((c) => c.id === row.categoryId)?.name ||
                  "no category"}
                {subcategories.find((s) => s.id === row.subcategoryId)
                  ? ` ▸ ${subcategories.find((s) => s.id === row.subcategoryId)?.name}`
                  : ""}
              </Badge>
              <span>·</span>
              <span>{brands.find((b) => b.id === row.brandId)?.name || "no brand"}</span>
              <span>·</span>
              <span className="font-semibold text-foreground">{fromPrice}</span>
              <span>·</span>
              <span
                className={cn(
                  "font-mono",
                  row.variants[0]?.sku.trim()
                    ? "text-foreground"
                    : "font-bold text-warning",
                )}
                title="Part number (required)"
              >
                {row.variants[0]?.sku.trim() || "no part #"}
              </span>
              <span>·</span>
              <span>{row.specifications.length} specs</span>
              <span>·</span>
              <span>
                {row.images.length} image{row.images.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </button>
        {missingImages && (
          <Badge variant="warning" className="gap-1" title="Images weren’t uploaded — add them from the product’s page after import">
            <AppIcon icon="solar:gallery-linear" className="size-3" />
            Images not uploaded
          </Badge>
        )}
        {row.isFeatured && <Badge variant="warning">Featured</Badge>}
        <Badge variant={row.isActive ? "success" : "muted"}>
          {row.isActive ? "Active" : "Draft"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(row.id)}
        >
          <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
        </Button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground"
        >
          <AppIcon
            icon="solar:alt-arrow-down-linear"
            className={cn(
              "size-4 transition-transform duration-300",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Blocking reasons — surfaced inline so the row's caution state never
          requires hovering the icon to diagnose. */}
      {!valid && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-warning/20 bg-warning/5 px-4 py-2.5">
          {errors.map((err) => (
            <span
              key={err}
              className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning"
            >
              <AppIcon icon="solar:danger-triangle-linear" className="size-3" />
              {err}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/10 p-5 space-y-6">
          {/* General */}
          <section className="space-y-3">
            <div className={SECTION_LABEL}>
              <AppIcon icon="solar:widget-5-linear" className="size-4 text-primary" />
              General
            </div>
            <Input
              value={row.name}
              onChange={(e) => onChange(row.id, { name: e.target.value })}
              placeholder="Product name"
              className="bg-card"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                value={row.categoryId || undefined}
                onValueChange={(v) =>
                  onChange(row.id, { categoryId: v, subcategoryId: "" })
                }
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.subcategoryId || undefined}
                onValueChange={(v) => onChange(row.id, { subcategoryId: v })}
                disabled={
                  !row.categoryId || subsLoading || subcategories.length === 0
                }
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue
                    placeholder={
                      !row.categoryId
                        ? "Select a category first"
                        : subsLoading
                          ? "Loading…"
                          : subcategories.length === 0
                            ? "No subcategories"
                            : "Subcategory"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={row.brandId || undefined}
                onValueChange={(v) => onChange(row.id, { brandId: v })}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={row.description}
              onChange={(e) => onChange(row.id, { description: e.target.value })}
              placeholder="Description (min 10 characters)"
              className="resize-none h-20 bg-card"
            />
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch
                  checked={row.isActive}
                  onCheckedChange={(v) => onChange(row.id, { isActive: v })}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <Switch
                  checked={row.isFeatured}
                  onCheckedChange={(v) => onChange(row.id, { isFeatured: v })}
                />
                Featured
              </label>
            </div>
          </section>

          {/* Images */}
          <section className="space-y-3">
            <div className={SECTION_LABEL}>
              <AppIcon icon="solar:gallery-linear" className="size-4 text-primary" />
              Images
            </div>
            <BulkImagesSection
              productName={row.name}
              images={row.images}
              onChange={setImages}
            />
          </section>

          {/* Pricing & Inventory */}
          <section className="space-y-3">
            <div className={SECTION_LABEL}>
              <AppIcon icon="solar:tag-price-linear" className="size-4 text-primary" />
              Pricing & Inventory
            </div>
            <BulkVariantRow
              variant={row.variants[0]}
              markupPct={markupPct}
              onChange={updateVariant}
            />
          </section>

          {/* Specifications */}
          <section className="space-y-3">
            <div className={SECTION_LABEL}>
              <AppIcon icon="solar:document-text-linear" className="size-4 text-primary" />
              Specifications
            </div>
            <div className="space-y-2">
              {row.specifications.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Input
                    value={s.name}
                    onChange={(e) => updateSpec(s.id, { name: e.target.value })}
                    placeholder="Name (e.g. Processor)"
                    className="h-8 text-xs bg-card"
                  />
                  <Input
                    value={s.value}
                    onChange={(e) => updateSpec(s.id, { value: e.target.value })}
                    placeholder="Value (e.g. Intel i7)"
                    className="h-8 text-xs bg-card"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeSpec(s.id)}
                  >
                    <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addSpec}
                className="h-8 rounded-lg text-xs"
              >
                <AppIcon icon="solar:add-circle-linear" className="size-4 mr-1.5" />
                Add spec
              </Button>
            </div>
          </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
