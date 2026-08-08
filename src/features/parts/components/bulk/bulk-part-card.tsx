"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
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
import type { Brand, Category, PartType } from "../../types/parts";
import {
  formatNaira,
  type BulkPartImage,
  type BulkPartRow,
  validateBulkPartRow,
} from "./bulk-part-helpers";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface BulkPartCardProps {
  row: BulkPartRow;
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  duplicatePartNumbers: Set<string>;
  onChange: (id: string, patch: Partial<BulkPartRow>) => void;
  onRemove: (id: string) => void;
}

export function BulkPartCard({
  row,
  categories,
  brands,
  partTypes,
  duplicatePartNumbers,
  onChange,
  onRemove,
}: BulkPartCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = validateBulkPartRow(row, duplicatePartNumbers);
  const isValid = errors.length === 0;

  const set = (patch: Partial<BulkPartRow>) => onChange(row.id, patch);

  const addImages = (files: FileList) => {
    const hasPrimary = row.images.some((i) => i.isPrimary);
    const next: BulkPartImage[] = [];
    let needPrimary = !hasPrimary;
    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) continue;
      const isPrimary = needPrimary;
      needPrimary = false;
      next.push({
        id: crypto.randomUUID(),
        key: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        isPrimary,
        sortOrder: row.images.length + next.length,
      });
    }
    if (next.length) set({ images: [...row.images, ...next] });
  };

  const removeImage = (id: string) => {
    const target = row.images.find((i) => i.id === id);
    if (target?.file && target.preview.startsWith("blob:")) {
      URL.revokeObjectURL(target.preview);
    }
    let remaining = row.images.filter((i) => i.id !== id);
    if (target?.isPrimary && remaining.length) {
      remaining = remaining.map((i, idx) => ({ ...i, isPrimary: idx === 0 }));
    }
    set({ images: remaining });
  };

  const setPrimaryImage = (id: string) =>
    set({ images: row.images.map((i) => ({ ...i, isPrimary: i.id === id })) });

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        isValid ? "border-border" : "border-warning/40",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {isValid ? (
            <AppIcon icon="solar:check-circle-bold" className="size-4 shrink-0 text-success" />
          ) : (
            <AppIcon icon="solar:danger-triangle-linear" className="size-4 shrink-0 text-warning" />
          )}
          <Input
            value={row.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Part name"
            className="h-9 flex-1 font-bold"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(row.id)}
        >
          <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
        </Button>
      </div>

      {!isValid && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {errors.map((e) => (
            <Badge key={e} variant="warning" className="text-xs">
              {e}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Select value={row.partTypeId} onValueChange={(v) => set({ partTypeId: v })}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Part type" />
          </SelectTrigger>
          <SelectContent>
            {partTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={row.categoryId} onValueChange={(v) => set({ categoryId: v })}>
          <SelectTrigger className="h-9 text-xs">
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

        <Select value={row.brandId} onValueChange={(v) => set({ brandId: v })}>
          <SelectTrigger className="h-9 text-xs">
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

        <Input
          value={row.partNumber}
          onChange={(e) => set({ partNumber: e.target.value })}
          placeholder="Part number"
          className="h-9 font-mono text-xs"
        />

        <Input
          value={row.ownerSku}
          onChange={(e) => set({ ownerSku: e.target.value })}
          placeholder="Owner SKU"
          className="h-9 font-mono text-xs"
        />
        <Input
          inputMode="numeric"
          value={row.costPrice}
          onChange={(e) => set({ costPrice: formatNaira(e.target.value) })}
          placeholder="Cost ₦"
          className="h-9 text-xs"
        />
        <Input
          inputMode="numeric"
          value={row.price}
          onChange={(e) => set({ price: formatNaira(e.target.value) })}
          placeholder="Sell ₦ (blank = on request)"
          className="h-9 text-xs"
        />
        <Input
          type="number"
          min={0}
          value={row.stockQuantity}
          onChange={(e) => set({ stockQuantity: Number(e.target.value) || 0 })}
          placeholder="Stock"
          className="h-9 text-xs"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Switch
            checked={row.isActive}
            onCheckedChange={(v) => set({ isActive: v })}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Switch
            checked={row.isFeatured}
            onCheckedChange={(v) => set({ isFeatured: v })}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Switch
            checked={row.isInStock}
            onCheckedChange={(v) => set({ isInStock: v })}
          />
          In stock
        </label>

        <div className="ml-auto flex items-center gap-2">
          {row.images.map((img) => (
            <div
              key={img.id}
              className="group relative size-9 overflow-hidden rounded-md border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt="" className="h-full w-full object-cover" />
              {img.isPrimary && (
                <span className="absolute inset-x-0 bottom-0 bg-primary/80 text-center text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                  Main
                </span>
              )}
              <div className="absolute inset-0 hidden items-center justify-center gap-0.5 bg-black/50 group-hover:flex">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(img.id)}
                    className="text-warning"
                    title="Set primary"
                  >
                    <AppIcon icon="solar:star-bold" className="size-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="text-destructive"
                  title="Remove"
                >
                  <AppIcon icon="solar:close-circle-bold" className="size-3" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => fileRef.current?.click()}
            title="Add images"
          >
            <AppIcon icon="solar:gallery-add-linear" className="size-4" />
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addImages(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
