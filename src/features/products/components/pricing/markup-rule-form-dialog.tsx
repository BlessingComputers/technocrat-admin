"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import {
  ItemScopePicker,
  ScopeModeToggle,
  type ScopeItem,
} from "@/components/shared/item-scope-picker";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils/format";
import {
  useMarkupProductSearch,
  usePreviewMarkupRule,
} from "../../api/pricing.queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  markupRuleFormSchema,
  type MarkupRuleFormValues,
} from "../../schemas/markup-rule-form";
import {
  MARKUP_MAX_DISCOUNT_PERCENT,
  MARKUP_MAX_PERCENT,
  MARKUP_MIN_PERCENT,
  type MarkupRule,
} from "../../types/pricing";
import { cn } from "@/lib/utils/cn";
import { ruleScopeLabel } from "./markup-rule-utils";
import type { ProductBrand, ProductCategory } from "../../types/products";

/** Sentinel for the "applies to all" option (shadcn Select rejects ""). */
const ALL = "__all__";

/** Direction of the percentage: mark the price up, or discount it. */
type PriceMode = "markup" | "discount";

const APPLY_TO_OPTIONS: { value: string; label: string }[] = [
  { value: "PRICE", label: "Selling price" },
];

interface MarkupRuleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rule being edited, or null when creating. */
  initial: MarkupRule | null;
  categories: ProductCategory[];
  brands: ProductBrand[];
  onSubmit: (values: MarkupRuleFormValues) => void;
  isSubmitting: boolean;
}

export function MarkupRuleFormDialog({
  isOpen,
  onOpenChange,
  initial,
  categories,
  brands,
  onSubmit,
  isSubmitting,
}: MarkupRuleFormDialogProps) {
  const isEditing = !!initial;

  // A rule targets EITHER one exact product OR a category/brand slice — never
  // both (backend refine). Seed the mode from an existing product-scoped rule so
  // edit reflects reality; scope is immutable once created, but the mode still
  // decides which fields render.
  const initialProduct: ScopeItem | null =
    initial?.productId && initial.product
      ? { id: initial.productId, name: initial.product.name }
      : null;
  const [scopeMode, setScopeMode] = useState<"taxonomy" | "item">(
    initialProduct ? "item" : "taxonomy",
  );
  const [product, setProduct] = useState<ScopeItem | null>(initialProduct);
  const [productTerm, setProductTerm] = useState("");
  const { data: productResults = [], isFetching: isSearchingProducts } =
    useMarkupProductSearch(scopeMode === "item" ? productTerm : "");

  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? ALL,
  );
  const [brandId, setBrandId] = useState<string>(initial?.brandId ?? ALL);
  // The user types a positive magnitude; the Markup/Discount toggle owns the
  // sign, so the input never needs a minus key.
  const [mode, setMode] = useState<PriceMode>(
    initial && initial.markupPercentage < 0 ? "discount" : "markup",
  );
  const [percentage, setPercentage] = useState<string>(
    initial ? String(Math.abs(initial.markupPercentage)) : "",
  );
  const [applyTo, setApplyTo] = useState<string>(initial?.applyTo ?? "PRICE");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  // Ad-hoc dry-run so staff can see what a percentage would do before saving.
  const preview = usePreviewMarkupRule();

  // The chosen scope/percentage as the signed value the API expects. An
  // item-scoped rule omits the taxonomy keys entirely (and vice versa) so the
  // backend's either/or refine is satisfied.
  const isItemScope = scopeMode === "item";
  const category = isItemScope || categoryId === ALL ? undefined : categoryId;
  const brand = isItemScope || brandId === ALL ? undefined : brandId;
  const scopeProductId = isItemScope ? product?.id : undefined;
  const signedPercentage =
    (mode === "discount" ? -1 : 1) * (Number(percentage) || 0);

  // Drop a stale preview whenever the scope or percentage changes (or reopen).
  useEffect(() => {
    preview.reset();
    // preview handle is stable; key only on the inputs that change the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    scopeMode,
    product?.id,
    categoryId,
    brandId,
    percentage,
    mode,
    applyTo,
  ]);

  const handlePreview = () => {
    if (!category && !brand && !scopeProductId) {
      setError(
        isItemScope
          ? "Pick a product to preview."
          : "Pick a category or brand to preview.",
      );
      return;
    }
    if (!signedPercentage) {
      setError("Enter a percentage to preview.");
      return;
    }
    setError(null);
    preview.mutate({
      categoryId: category,
      brandId: brand,
      scopeProductId,
      markupPercentage: signedPercentage,
      applyTo,
    });
  };

  const previewError = preview.error as ApiError | null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const magnitude = Number(percentage);
    // The toggle decides the sign; the input only ever holds a positive number.
    const signed = mode === "discount" ? -magnitude : magnitude;

    const values = {
      categoryId: category,
      brandId: brand,
      productId: scopeProductId,
      markupPercentage: signed,
      applyTo,
      notes: notes.trim() || undefined,
      isActive,
    };

    const parsed = markupRuleFormSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit Markup Rule" : "New Markup Rule"}
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            Product, category &amp; brand pricing
          </MetaLabel>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {isEditing ? (
            // Scope is immutable once a rule exists — show it, don't offer edits.
            <Field label="Scope">
              <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-foreground">
                <span className="truncate">{ruleScopeLabel(initial)}</span>
              </div>
            </Field>
          ) : (
            <>
              {/* A rule targets one exact product or a category/brand slice —
                  mutually exclusive, so offer a mode switch. */}
              <ScopeModeToggle
                taxonomyLabel="Category / Brand"
                itemLabel="Specific product"
                mode={scopeMode}
                onChange={setScopeMode}
              />

              {/* Reserve a stable height so switching modes doesn't jump the
                  fields below — both branches fit within this min-height. */}
              <div className="min-h-[5.5rem]">
                {isItemScope ? (
                  <ItemScopePicker
                    label="Product"
                    noun="products"
                    selected={product}
                    onSelect={setProduct}
                    onClear={() => setProduct(null)}
                    onTermChange={setProductTerm}
                    results={productResults}
                    isFetching={isSearchingProducts}
                    hint="This percentage applies to the exact product, overriding any category or brand rule."
                  />
                ) : (
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
                )}
              </div>
            </>
          )}

          <Field label="Direction">
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={mode === "markup"}
                onClick={() => setMode("markup")}
                label="Markup"
                hint="Increase price"
              />
              <ModeButton
                active={mode === "discount"}
                onClick={() => setMode("discount")}
                label="Discount"
                hint="Reduce price"
                discount
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={
                mode === "discount"
                  ? `Discount % (1–${MARKUP_MAX_DISCOUNT_PERCENT})`
                  : `Markup % (${MARKUP_MIN_PERCENT}–${MARKUP_MAX_PERCENT})`
              }
            >
              <Input
                type="number"
                inputMode="decimal"
                min={mode === "discount" ? 1 : MARKUP_MIN_PERCENT}
                max={mode === "discount" ? MARKUP_MAX_DISCOUNT_PERCENT : MARKUP_MAX_PERCENT}
                step="0.1"
                placeholder="e.g. 15"
                value={percentage}
                // The sign comes from the Markup/Discount toggle — block the
                // minus (and other sign) keys so the field stays positive.
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) =>
                  setPercentage(e.target.value.replace(/[^0-9.]/g, ""))
                }
                required
              />
            </Field>
            <Field label="Apply to">
              <Select value={applyTo} onValueChange={setApplyTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLY_TO_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Ad-hoc dry-run — what this percentage does, before saving. */}
          <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                See how many active products this would reprice — nothing is
                saved.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={preview.isPending}
                className="h-8 shrink-0 rounded-lg text-xs font-medium"
              >
                {preview.isPending ? "Checking…" : "Preview"}
              </Button>
            </div>

            {preview.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AppIcon
                  icon="solar:refresh-linear"
                  className="size-4 animate-spin"
                />
                Calculating projected prices…
              </div>
            )}

            {previewError && (
              <p className="text-xs font-medium text-muted-foreground">
                {previewError.status === 404
                  ? "No active products match this scope yet."
                  : previewError.message || "Couldn’t build a preview."}
              </p>
            )}

            {preview.data && !preview.isPending && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Affects {preview.data.totalProducts} product
                  {preview.data.totalProducts === 1 ? "" : "s"} ·{" "}
                  {preview.data.totalVariants} variant
                  {preview.data.totalVariants === 1 ? "" : "s"}
                </p>
                {preview.data.variants.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/40">
                    {preview.data.variants.slice(0, 8).map((v) => (
                      <div
                        key={v.variantId}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs"
                      >
                        <span className="truncate text-muted-foreground">
                          {v.productName}
                        </span>
                        <span className="shrink-0 font-mono tabular-nums">
                          <span className="text-muted-foreground line-through mr-1.5">
                            {formatPrice(v.currentPrice)}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatPrice(v.projectedPrice)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Field label="Notes (optional)">
            <Input
              placeholder="Why this rule exists"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Applied to future product &amp; variant pricing
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
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
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update Rule"
                  : "Create Rule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  hint,
  discount,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  discount?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-2 text-left transition-colors",
        active
          ? discount
            ? "border-destructive bg-destructive/10"
            : "border-primary bg-primary/10"
          : "border-border hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "block text-sm font-semibold",
          active
            ? discount
              ? "text-destructive-ink"
              : "text-primary-ink"
            : "text-foreground",
        )}
      >
        {label}
      </span>
      <span className="block text-xs font-medium text-muted-foreground">
        {hint}
      </span>
    </button>
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
