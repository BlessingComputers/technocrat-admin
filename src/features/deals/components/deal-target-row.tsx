"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import {
  useClashRules,
  useDealBrands,
  useDealCategories,
  useDealItemSearch,
  useDealPartTypes,
} from "../api/deals.queries";
import {
  DEAL_MAX_DISCOUNT_PERCENT,
  DEAL_MIN_DISCOUNT_PERCENT,
  markupKindOf,
  ruleSitsOnTarget,
  type ClashRule,
  type DealEntityType,
  type DealTarget,
} from "../types/deals";

/** Sentinel for "applies to all" — shadcn's Select rejects an empty value. */
const ALL = "__all__";

/**
 * One row of the target builder, as the form holds it.
 *
 * `uid` is a client-side row identity so React keys survive a removal in the
 * middle of the list. It never reaches the API.
 */
export interface DealTargetDraft {
  uid: string;
  entityType: DealEntityType;
  scopeMode: "item" | "taxonomy";
  item: ScopeItem | null;
  categoryId: string;
  brandId: string;
  partTypeId: string;
  /** Positive magnitude. Negated on submit. */
  discountPercent: string;
}

export function emptyTargetDraft(
  entityType: DealEntityType = "product",
): DealTargetDraft {
  return {
    uid: `t-${Math.random().toString(36).slice(2, 10)}`,
    entityType,
    scopeMode: "item",
    item: null,
    categoryId: ALL,
    brandId: ALL,
    partTypeId: ALL,
    discountPercent: "",
  };
}

/**
 * A draft row → the target the API takes.
 *
 * `sharedDiscount` is the "same discount for every target" value. When it is a
 * number it wins outright, so a per-row figure typed before that box was ticked
 * cannot quietly survive underneath it; pass `null` to use each row's own.
 *
 * The item's name rides along in `notes`. That is a label, not an identity:
 * nothing groups or matches on it (the deal's own id does that), it just lets
 * the detail page name an exact product without a hundred catalogue lookups.
 */
export function draftToTarget(
  draft: DealTargetDraft,
  sharedDiscount: number | null,
): DealTarget {
  // "1.2.3" survives the input's digit filter and parses to NaN, which would
  // reach Zod as a min-length complaint about a number nobody typed.
  const typed = Number(draft.discountPercent);
  const magnitude =
    sharedDiscount ?? (Number.isFinite(typed) ? typed : 0);
  const isItem = draft.scopeMode === "item";
  const pick = (value: string) => (value === ALL ? undefined : value);

  const base = {
    entityType: draft.entityType,
    markupPercentage: -Math.abs(magnitude),
    notes: isItem ? (draft.item?.name ?? undefined) : undefined,
  };

  if (draft.entityType === "product") {
    return isItem
      ? { ...base, productId: draft.item?.id }
      : {
          ...base,
          categoryId: pick(draft.categoryId),
          brandId: pick(draft.brandId),
        };
  }
  return isItem
    ? { ...base, partId: draft.item?.id }
    : {
        ...base,
        categoryId: pick(draft.categoryId),
        brandId: pick(draft.brandId),
        partTypeId: pick(draft.partTypeId),
      };
}

interface DealTargetRowProps {
  index: number;
  draft: DealTargetDraft;
  onChange: (next: DealTargetDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
  /** True while one discount covers every row — hides the per-row input. */
  uniformDiscount: boolean;
  /** The shared magnitude, shown read-only when `uniformDiscount`. */
  sharedDiscount: string;
}

export function DealTargetRow({
  index,
  draft,
  onChange,
  onRemove,
  canRemove,
  uniformDiscount,
  sharedDiscount,
}: DealTargetRowProps) {
  const [term, setTerm] = useState("");
  const isPart = draft.entityType === "part";
  const isItem = draft.scopeMode === "item";

  const { data: results = [], isFetching } = useDealItemSearch(
    draft.entityType,
    isItem ? term : "",
  );
  const { data: categories = [] } = useDealCategories();
  const { data: brands = [] } = useDealBrands();
  const { data: partTypes = [] } = useDealPartTypes(); // only rendered for parts

  const set = (patch: Partial<DealTargetDraft>) => onChange({ ...draft, ...patch });

  // Switching catalogue invalidates every id on the row — a product's UUID is
  // not a part's — so clear the scope rather than send a mismatched payload
  // the backend answers with a bare 400.
  const setEntity = (entityType: DealEntityType) => {
    if (entityType === draft.entityType) return;
    setTerm("");
    set({
      entityType,
      item: null,
      categoryId: ALL,
      brandId: ALL,
      partTypeId: ALL,
    });
  };

  const target = draftToTarget(
    draft,
    uniformDiscount ? Number(sharedDiscount) || 0 : null,
  );
  const clash = useTargetClash(target);

  return (
    <div className="rounded-lg border border-border bg-muted/[0.06] p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div
            role="tablist"
            aria-label="Catalogue"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card p-0.5"
          >
            <EntityButton
              active={!isPart}
              onClick={() => setEntity("product")}
              icon="solar:box-linear"
              label="Product"
            />
            <EntityButton
              active={isPart}
              onClick={() => setEntity("part")}
              icon="solar:layers-minimalistic-linear"
              label="Part"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? undefined : "A deal needs at least one target"}
          className="h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive-ink"
        >
          <AppIcon icon="solar:trash-bin-trash-linear" className="mr-1.5 size-4" />
          Remove
        </Button>
      </div>

      <ScopeModeToggle
        taxonomyLabel={isPart ? "Category / Brand / Type" : "Category / Brand"}
        itemLabel={isPart ? "Specific part" : "Specific product"}
        mode={draft.scopeMode}
        onChange={(scopeMode) => {
          setTerm("");
          set({ scopeMode, item: null, categoryId: ALL, brandId: ALL, partTypeId: ALL });
        }}
      />

      {isItem ? (
        <ItemScopePicker
          label={isPart ? "Part" : "Product"}
          noun={isPart ? "parts" : "products"}
          selected={draft.item}
          onSelect={(item) => set({ item })}
          onClear={() => set({ item: null })}
          onTermChange={setTerm}
          results={results}
          isFetching={isFetching}
          hint={
            isPart
              ? "The discount applies to this exact part, overriding any category, brand or type rule."
              : "The discount applies to this exact product, overriding any category or brand rule."
          }
        />
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            isPart ? "sm:grid-cols-3" : "sm:grid-cols-2",
          )}
        >
          <TaxonomyField
            label="Category"
            allLabel="All categories"
            value={draft.categoryId}
            options={categories}
            onChange={(categoryId) => set({ categoryId })}
          />
          <TaxonomyField
            label="Brand"
            allLabel="All brands"
            value={draft.brandId}
            options={brands}
            onChange={(brandId) => set({ brandId })}
          />
          {isPart && (
            <TaxonomyField
              label="Part type"
              allLabel="All types"
              value={draft.partTypeId}
              options={partTypes}
              onChange={(partTypeId) => set({ partTypeId })}
            />
          )}
        </div>
      )}

      {!uniformDiscount && (
        <div className="max-w-[12rem] space-y-1.5">
          <Label className="ml-1 text-xs font-semibold text-muted-foreground">
            Discount % ({DEAL_MIN_DISCOUNT_PERCENT}–{DEAL_MAX_DISCOUNT_PERCENT})
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            min={DEAL_MIN_DISCOUNT_PERCENT}
            max={DEAL_MAX_DISCOUNT_PERCENT}
            step="0.1"
            placeholder="e.g. 15"
            value={draft.discountPercent}
            // The magnitude only. The minus sign is added on submit, so typing
            // one here would double-negate into a price rise.
            onKeyDown={(e) => {
              if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
            }}
            onChange={(e) =>
              set({ discountPercent: e.target.value.replace(/[^0-9.]/g, "") })
            }
          />
        </div>
      )}

      {clash && <ClashNotice rule={clash} />}
    </div>
  );
}

/**
 * The rule already sitting on this exact scope, if any.
 *
 * Exact-scope only, matching the backend's own guard — a category markup does
 * not block a product-level deal inside it. Inactive rules count, because the
 * backend's lookup ignores `isActive` too.
 */
function useTargetClash(target: DealTarget): ClashRule | null {
  const hasScope = Boolean(
    target.productId ||
      target.partId ||
      target.categoryId ||
      target.brandId ||
      target.partTypeId,
  );
  const { data: rules } = useClashRules(target.entityType, hasScope);
  if (!hasScope || !rules) return null;
  return rules.find((rule) => ruleSitsOnTarget(rule, target)) ?? null;
}

/**
 * What already occupies this scope, and what that means when the deal starts.
 *
 * Not a blocker. The target is legal to save — a draft can sit for days, and
 * whatever is in the way may be gone by the time anyone presses Start. It is
 * Start that fails, and it fails per target rather than for the whole deal.
 *
 * Two very different clashes share the panel. An existing markup is the
 * dangerous one: against dev the target is refused with
 * `MARKUP_RULE_SCOPE_CONFLICT`, but prod is five commits behind that fix and
 * still overwrites the row, so the markup's original percentage is gone with
 * nothing recording it existed. An existing deal at the same scope is the
 * merely confusing one.
 */
function ClashNotice({ rule }: { rule: ClashRule }) {
  const isDeal = markupKindOf(rule) === "DISCOUNT";
  const magnitude = Math.abs(rule.markupPercentage);
  const name = rule.notes?.trim();

  return (
    <div
      role="alert"
      className="space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-3"
    >
      <p className="text-sm font-semibold text-warning-ink">
        {isDeal
          ? `A deal already covers this scope: −${magnitude}%`
          : `A markup rule already covers this scope: +${magnitude}%`}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        {isDeal
          ? `Only one rule can sit on a scope, so this target won’t start while that one stands${
              name ? ` (${name})` : ""
            }. End that deal first, or narrow this target to a specific item.`
          : `Starting this deal takes that markup’s place, and prices will not go back to +${magnitude}% when the sale ends. Narrow this target to a specific item instead — a deal on one product leaves a category markup alone, and the markup comes back on its own.`}
      </p>
      {!rule.isActive && (
        <p className="text-xs font-medium text-muted-foreground">
          That rule is switched off, and still occupies the scope.
        </p>
      )}
    </div>
  );
}

function TaxonomyField({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EntityButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition-colors",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <AppIcon icon={icon} className="size-3.5" />
      {label}
    </button>
  );
}
