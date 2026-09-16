"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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
import {
  usePartMarkupPartSearch,
  usePartRuleAtTarget,
} from "../../api/pricing.queries";
import { ruleScopeLabel } from "./markup-rule-utils";
import { formatExpiry, markupRuleExpiry } from "./sale-timing";
import type { Brand, Category, PartType } from "../../types/parts";
import {
  PART_MARKUP_MAX_PERCENT,
  PART_MARKUP_MIN_PERCENT,
  partRuleTypeOf,
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

  // Always a positive magnitude on this screen. A negative percentage is a
  // deal, and deals are created from /pricing/deals.
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

  const writeMagnitude = (magStr: string) => {
    setValue("markupPercentage", Number(magStr) || 0, { shouldValidate: true });
  };

  // Sync the magnitude whenever the dialog (re)opens for a (possibly different)
  // rule. Adjusting state during render is React's recommended alternative to a
  // setState-in-effect (no cascading renders).
  const openKey = isOpen ? (initial?.id ?? "new") : null;
  if (openKey !== syncedKey) {
    setSyncedKey(openKey);
    if (isOpen) {
      setMagnitude(
        String(
          initial?.markupPercentage ?? EMPTY_MARKUP_RULE.markupPercentage,
        ),
      );
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

  // Pre-flight clash check. Deals are the same backend rows at the same targets,
  // and this screen no longer lists them — so without this, saving a markup over
  // a running sale ends it with nothing on screen to say so. Scope is immutable
  // once a rule exists, so only a new rule can land on top of something.
  // Named rather than watching the whole form: the scope fields are the only
  // ones the lookup depends on, so a keystroke in Notes should not re-run it.
  const [scopePartId, scopeCategoryId, scopeBrandId, scopePartTypeId] =
    useWatch({
      control,
      name: ["partId", "categoryId", "brandId", "partTypeId"],
    });
  const { rule: ruleAtTarget, isChecking: isCheckingTarget } =
    usePartRuleAtTarget(
      isEditing
        ? null
        : {
            partId: scopePartId || undefined,
            categoryId: scopeCategoryId || undefined,
            brandId: scopeBrandId || undefined,
            partTypeId: scopePartTypeId || undefined,
          },
    );
  const clashType = ruleAtTarget ? partRuleTypeOf(ruleAtTarget) : null;
  // A second markup at the same scope is refused server-side, and ask 27 means
  // that refusal arrives as an untyped 500. Block it here instead.
  const blockedByMarkup = clashType === "MARKUP";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit markup rule" : "New markup rule"}
          </DialogTitle>
          <DialogDescription>
            Marks matching parts up by a percentage — a standing pricing policy.
            Scope to one exact part, or by category, brand, and/or part type.
          </DialogDescription>
        </DialogHeader>

        {/* min-w-0: DialogContent is a CSS grid, so this form is a grid item
            with default min-width:auto. Without it, a long non-wrapping value
            (a selected product's full name) sets the item's min-content and
            blows the dialog past its max-width — the leaf `truncate` cannot
            take effect until this ancestor is allowed to shrink. */}
        <form onSubmit={handleSubmit(onSubmit)} className="min-w-0 space-y-4">
          {isEditing ? (
            // Scope is immutable once a rule exists — show it, don't offer edits.
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Scope
              </label>
              {/* overflow-x-auto does two jobs: a long exact-product name
                  scrolls inside the box instead of running past it, and a
                  scroll container's automatic minimum size is 0, so this box
                  can shrink to the dialog's width no matter what its
                  ancestors' min-width resolves to. */}
              <div className="flex h-9 items-center overflow-x-auto rounded-md border border-border bg-muted/40 px-3 text-sm font-semibold text-foreground">
                <span className="whitespace-nowrap" title={ruleScopeLabel(initial)}>
                  {ruleScopeLabel(initial)}
                </span>
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

          {/* What is already sitting on this exact scope. A deal is the same
              backend row at the same target, so saving over one ends it — and
              this screen never lists it. */}
          {ruleAtTarget && clashType && (
            <ClashNotice
              rule={ruleAtTarget}
              type={clashType}
              percentage={Number(magnitude) || 0}
            />
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {`Markup % (${PART_MARKUP_MIN_PERCENT}–${PART_MARKUP_MAX_PERCENT})`}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                min={PART_MARKUP_MIN_PERCENT}
                max={PART_MARKUP_MAX_PERCENT}
                step="0.1"
                placeholder="e.g. 15"
                value={magnitude}
                // A negative percentage is a deal, not a markup — block the
                // sign keys rather than let one be typed here.
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                }}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9.]/g, "");
                  setMagnitude(next);
                  writeMagnitude(next);
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
            <Button
              type="submit"
              disabled={isSubmitting || isCheckingTarget || blockedByMarkup}
              className="font-semibold"
            >
              {isSubmitting && (
                <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
              )}
              {isEditing
                ? "Save"
                : clashType === "DISCOUNT"
                  ? `End the deal and set +${Number(magnitude) || 0}%`
                  : "Create rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The rule already sitting on this exact scope, and what saving will do to it.
 *
 * Two different situations, one panel:
 *
 * - A **deal** is destroyed by the save. The backend overwrites the row rather
 *   than refusing, so this warning is the only thing between staff and a sale
 *   that ends without warning. (The Deals screen gets a typed 409 as a second
 *   line; ask 27 means this side gets an untyped 500 instead, so there is
 *   nothing to catch afterwards.)
 * - A **markup** blocks the save outright. Editing that rule is the only way to
 *   change it — the server refuses a second one at the same scope.
 *
 * Inactive rules count. The backend's duplicate check ignores `isActive`, so a
 * switched-off rule still occupies the scope.
 */
function ClashNotice({
  rule,
  type,
  percentage,
}: {
  rule: PartMarkupRule;
  type: "MARKUP" | "DISCOUNT";
  percentage: number;
}) {
  const isDeal = type === "DISCOUNT";
  const expiry = markupRuleExpiry(rule.expiresAt);
  const name = rule.notes?.trim();

  return (
    <div
      role="alert"
      className={
        isDeal
          ? "space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-3"
          : "space-y-1 rounded-lg border border-destructive/50 bg-destructive/10 p-3"
      }
    >
      <p
        className={
          isDeal
            ? "text-sm font-semibold text-warning-ink"
            : "text-sm font-semibold text-destructive-ink"
        }
      >
        {isDeal
          ? `A deal is on this scope: ${name || ruleScopeLabel(rule)}, −${Math.abs(rule.markupPercentage)}%`
          : `A markup rule already covers this scope: +${rule.markupPercentage}%`}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        {isDeal
          ? `Saving this markup ends that deal now and prices will jump. ${
              expiry.state === "scheduled"
                ? `It was set to run until ${formatExpiry(expiry.at)}.`
                : expiry.state === "expired"
                  ? `Its end time (${formatExpiry(expiry.at)}) has passed, but prices only revert on the next five-minute sweep.`
                  : "It runs until someone cancels it."
            }${rule.isActive ? "" : " It is switched off, and still occupies the scope."}`
          : "Only one rule can sit on a scope, active or not. Edit that rule to change it, or pick a more specific scope."}
      </p>
      {isDeal && percentage > 0 && (
        <p className="text-xs font-medium text-muted-foreground">
          Prices here move from −{Math.abs(rule.markupPercentage)}% to +
          {percentage}% the moment you save.
        </p>
      )}
    </div>
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
