"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
import {
  ItemScopePicker,
  ScopeModeToggle,
  type ScopeItem,
} from "@/components/shared/item-scope-picker";
import { cn } from "@/lib/utils/cn";
import { usePartMarkupPartSearch } from "../../api/pricing.queries";
import { ruleScopeLabel } from "./markup-rule-utils";
import type { Brand, Category, PartType } from "../../types/parts";
import {
  PART_MARKUP_MAX_DISCOUNT_PERCENT,
  PART_MARKUP_MAX_PERCENT,
  PART_MARKUP_MIN_PERCENT,
  type PartMarkupRule,
} from "../../types/pricing";
import {
  EMPTY_MARKUP_RULE,
  partMarkupRuleFormSchema,
  type PartMarkupRuleFormValues,
} from "../../schemas/markup-rule-form";

const ANY = "__any__";

interface MarkupRuleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PartMarkupRule | null;
  categories: Category[];
  brands: Brand[];
  partTypes: PartType[];
  onSubmit: (values: PartMarkupRuleFormValues) => void;
  isSubmitting: boolean;
}

export function MarkupRuleFormDialog({
  isOpen,
  onOpenChange,
  initial,
  categories,
  brands,
  partTypes,
  onSubmit,
  isSubmitting,
}: MarkupRuleFormDialogProps) {
  const isEditing = !!initial;
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PartMarkupRuleFormValues>({
    resolver: zodResolver(partMarkupRuleFormSchema),
    defaultValues: EMPTY_MARKUP_RULE,
  });

  // The user types a positive magnitude; the Markup/Discount toggle owns the
  // sign, so the input never needs a minus key. The signed value is written
  // back into the form's `markupPercentage`.
  const [mode, setMode] = useState<"markup" | "discount">("markup");
  const [magnitude, setMagnitude] = useState<string>("");
  const [syncedKey, setSyncedKey] = useState<string | null>(null);

  // A rule targets EITHER one exact part OR a category/brand/type slice — never
  // both (backend refine). The toggle clears the other side's form values so a
  // stale selection can't leak into the payload.
  const [scopeMode, setScopeMode] = useState<"taxonomy" | "item">("taxonomy");
  const [part, setPart] = useState<ScopeItem | null>(null);
  const [partTerm, setPartTerm] = useState("");
  const { data: partResults = [], isFetching: isSearchingParts } =
    usePartMarkupPartSearch(scopeMode === "item" ? partTerm : "");

  const changeScopeMode = (next: "taxonomy" | "item") => {
    setScopeMode(next);
    if (next === "item") {
      setValue("categoryId", "");
      setValue("brandId", "");
      setValue("partTypeId", "");
    } else {
      setPart(null);
      setValue("partId", "");
    }
  };

  const selectPart = (item: ScopeItem) => {
    setPart(item);
    setValue("partId", item.id, { shouldValidate: true });
  };

  const clearPart = () => {
    setPart(null);
    setValue("partId", "");
  };

  const writeSigned = (magStr: string, m: "markup" | "discount") => {
    const mag = Number(magStr) || 0;
    setValue("markupPercentage", (m === "discount" ? -1 : 1) * mag, {
      shouldValidate: true,
    });
  };

  const changeMode = (m: "markup" | "discount") => {
    setMode(m);
    writeSigned(magnitude, m);
  };

  // Sync the direction toggle + magnitude whenever the dialog (re)opens for a
  // (possibly different) rule. Adjusting state during render is React's
  // recommended alternative to a setState-in-effect (no cascading renders).
  const openKey = isOpen ? (initial?.id ?? "new") : null;
  if (openKey !== syncedKey) {
    setSyncedKey(openKey);
    if (isOpen) {
      const signed =
        initial?.markupPercentage ?? EMPTY_MARKUP_RULE.markupPercentage;
      setMode(signed < 0 ? "discount" : "markup");
      setMagnitude(String(Math.abs(signed)));
      // Seed the scope mode from an existing part-scoped rule so edit reflects
      // reality (scope is read-only in edit, but the mode still drives which
      // fields render).
      const seededPart = initial?.partId
        ? { id: initial.partId, name: initial.part?.name ?? "Selected part" }
        : null;
      setScopeMode(seededPart ? "item" : "taxonomy");
      setPart(seededPart);
      setPartTerm("");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    reset(
      initial
        ? {
            categoryId: initial.categoryId ?? "",
            brandId: initial.brandId ?? "",
            partTypeId: initial.partTypeId ?? "",
            partId: initial.partId ?? "",
            markupPercentage: initial.markupPercentage,
            applyTo: initial.applyTo,
            notes: initial.notes ?? "",
            isActive: initial.isActive,
          }
        : EMPTY_MARKUP_RULE,
    );
  }, [isOpen, initial, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit markup rule" : "New markup rule"}
          </DialogTitle>
          <DialogDescription>
            Marks up or discounts matching parts by a percentage. Scope to one
            exact part, or by category, brand, and/or part type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isEditing ? (
            // Scope is immutable once a rule exists — show it, don't offer edits.
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Scope
              </label>
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-foreground">
                <span className="truncate">{ruleScopeLabel(initial)}</span>
              </div>
            </div>
          ) : (
            <>
              {/* A rule targets one exact part or a taxonomy slice — mutually
                  exclusive, so offer a mode switch. */}
              <ScopeModeToggle
                taxonomyLabel="Category / Brand / Type"
                itemLabel="Specific part"
                mode={scopeMode}
                onChange={changeScopeMode}
              />

              {/* Reserve a stable height so switching modes doesn't jump the
                  fields below — both branches fit within this min-height. */}
              <div className="min-h-[5.5rem]">
                {scopeMode === "item" ? (
                  <ItemScopePicker
                    label="Part"
                    noun="parts"
                    selected={part}
                    onSelect={selectPart}
                    onClear={clearPart}
                    onTermChange={setPartTerm}
                    results={partResults}
                    isFetching={isSearchingParts}
                    hint="This percentage applies to the exact part, overriding any category, brand, or part-type rule."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <ScopeSelect
                      control={control}
                      name="categoryId"
                      label="Category"
                      options={categories}
                    />
                    <ScopeSelect
                      control={control}
                      name="brandId"
                      label="Brand"
                      options={brands}
                    />
                    <ScopeSelect
                      control={control}
                      name="partTypeId"
                      label="Part Type"
                      options={partTypes}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          {(errors.partId ?? errors.categoryId) && (
            <p className="text-xs font-medium text-destructive-ink" role="alert">
              {(errors.partId ?? errors.categoryId)?.message}
            </p>
          )}

          {/* Direction: markup (increase) or discount (reduce) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <ModeButton
                active={mode === "markup"}
                onClick={() => changeMode("markup")}
                label="Markup"
                hint="Increase price"
              />
              <ModeButton
                active={mode === "discount"}
                onClick={() => changeMode("discount")}
                label="Discount"
                hint="Reduce price"
                discount
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {mode === "discount"
                  ? `Discount % (${PART_MARKUP_MIN_PERCENT}–${PART_MARKUP_MAX_DISCOUNT_PERCENT})`
                  : `Markup % (${PART_MARKUP_MIN_PERCENT}–${PART_MARKUP_MAX_PERCENT})`}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min={PART_MARKUP_MIN_PERCENT}
                max={
                  mode === "discount"
                    ? PART_MARKUP_MAX_DISCOUNT_PERCENT
                    : PART_MARKUP_MAX_PERCENT
                }
                step="0.1"
                placeholder="e.g. 15"
                value={magnitude}
                // The sign comes from the Markup/Discount toggle — block the
                // minus (and other sign) keys so the field stays positive.
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9.]/g, "");
                  setMagnitude(next);
                  writeSigned(next, mode);
                }}
              />
              {errors.markupPercentage && (
                <p className="text-xs text-destructive-ink">
                  {errors.markupPercentage.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Applies to
              </label>
              <Controller
                control={control}
                name="applyTo"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE">Price</SelectItem>
                      <SelectItem value="COMPARE_AT_PRICE">
                        Compare-at price
                      </SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Input placeholder="Optional note" {...field} />
              )}
            />
          </div>

          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <label className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
                <span className="text-sm font-semibold">Active</span>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-semibold">
              {isSubmitting && (
                <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
              )}
              {isEditing ? "Save" : "Create rule"}
            </Button>
          </DialogFooter>
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

function ScopeSelect({
  control,
  name,
  label,
  options,
}: {
  control: import("react-hook-form").Control<PartMarkupRuleFormValues>;
  name: "categoryId" | "brandId" | "partTypeId";
  label: string;
  options: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value || ANY}
            onValueChange={(v) => field.onChange(v === ANY ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
