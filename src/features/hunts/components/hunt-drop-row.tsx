"use client";

import { useState } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { ItemScopePicker } from "@/components/shared/item-scope-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

import { useHuntProductSearch } from "../api/hunts.queries";
import { HUNT_PILL } from "../constants/claim-tone";
import { dropPercentage } from "../schemas/hunt-form";
import type { HuntClashRule, HuntProductPricing } from "../types/hunts";
import { applySlotStart, type HuntDropDraft } from "../utils/hunt-form-state";
import {
  HUNT_MIN_PERCENTAGE,
  huntPrice,
  huntPriceLabel,
  lowestHuntPrice,
} from "../utils/hunt-price";
import { defaultRevealAt, defaultSlotEnd } from "../utils/hunt-schedule";
import {
  formatHuntClock,
  formatHuntSlot,
  fromHuntTimeInput,
  toHuntTimeInput,
} from "../utils/hunt-time";

interface HuntDropRowProps {
  index: number;
  draft: HuntDropDraft;
  onChange: (next: HuntDropDraft) => void;
  /** Absent in edit mode: a saved campaign keeps its drops. */
  onRemove?: () => void;
  canRemove: boolean;
  pricing: HuntProductPricing | undefined;
  pricingLoading: boolean;
  /** A rule already on this product, which would stop the drop from starting. */
  clash: HuntClashRule | null;
  errors: string[];
}

/**
 * One drop: its product, its hunt price in naira, and its slot.
 *
 * A locked drop (held, claimed, or already open) renders as a read-only
 * summary. It still shows errors, because a window edit can push it outside.
 */
export function HuntDropRow(props: HuntDropRowProps) {
  return props.draft.lockedReason ? (
    <LockedDropRow {...props} />
  ) : (
    <EditableDropRow {...props} />
  );
}

function EditableDropRow({
  index,
  draft,
  onChange,
  onRemove,
  canRemove,
  pricing,
  pricingLoading,
  clash,
  errors,
}: HuntDropRowProps) {
  const [term, setTerm] = useState("");
  const { data: results = [], isFetching } = useHuntProductSearch(
    draft.product ? "" : term,
  );

  const set = (patch: Partial<HuntDropDraft>) => onChange({ ...draft, ...patch });
  const start = fromHuntTimeInput(draft.slotStartInput);

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border bg-muted/[0.06] p-4",
        errors.length > 0 ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DropTitle index={index} />
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={!canRemove}
            title={canRemove ? undefined : "A campaign needs at least one drop"}
            className="h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-destructive-ink"
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="mr-1.5 size-4" />
            Remove
          </Button>
        )}
      </div>

      <ItemScopePicker
        label="Product"
        noun="products"
        selected={draft.product}
        onSelect={(product) => {
          setTerm("");
          // A price typed for one product means nothing on another.
          set({ product, priceInput: "", storedPercentage: null });
        }}
        onClear={() => set({ product: null, priceInput: "", storedPercentage: null })}
        onTermChange={setTerm}
        results={results}
        isFetching={isFetching}
        hint="One unit of this product drops at the hunt price."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <Label className="ml-1 text-xs font-semibold text-muted-foreground">
            Hunt price (₦)
          </Label>
          <Input
            inputMode="numeric"
            placeholder="e.g. 5000"
            value={draft.priceInput}
            disabled={!draft.product}
            onChange={(e) =>
              set({
                priceInput: e.target.value.replace(/\D/g, ""),
                storedPercentage: null,
              })
            }
          />
        </div>
        <PriceNotes draft={draft} pricing={pricing} loading={pricingLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TimeField
          label="Slot starts (WAT)"
          value={draft.slotStartInput}
          onChange={(value) => onChange(applySlotStart(draft, value))}
          hint="Secret. Customers never see this time."
        />
        <TimeField
          label="Slot ends (WAT)"
          value={draft.slotEndInput}
          onChange={(value) => set({ slotEndInput: value, endFollows: false })}
          hint="Five minutes after the start."
          reset={
            draft.endFollows
              ? undefined
              : {
                  label: "Reset to five minutes",
                  onReset: () =>
                    set({
                      endFollows: true,
                      slotEndInput: start
                        ? toHuntTimeInput(defaultSlotEnd(start))
                        : draft.slotEndInput,
                    }),
                }
          }
        />
        <TimeField
          label="Countdown public (WAT)"
          value={draft.revealAtInput}
          onChange={(value) => set({ revealAtInput: value, revealFollows: false })}
          hint="Ten minutes before the start."
          reset={
            draft.revealFollows
              ? undefined
              : {
                  label: "Reset to ten minutes before",
                  onReset: () =>
                    set({
                      revealFollows: true,
                      revealAtInput: start
                        ? toHuntTimeInput(defaultRevealAt(start))
                        : draft.revealAtInput,
                    }),
                }
          }
        />
      </div>

      {clash && <ClashNotice rule={clash} />}
      <RowErrors errors={errors} />
    </div>
  );
}

function LockedDropRow({ index, draft, pricing, errors }: HuntDropRowProps) {
  const start = fromHuntTimeInput(draft.slotStartInput);
  const end = fromHuntTimeInput(draft.slotEndInput);
  const reveal = fromHuntTimeInput(draft.revealAtInput);
  const price =
    draft.storedPercentage !== null
      ? huntPriceLabel(pricing, draft.storedPercentage)
      : null;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border bg-muted/30 p-4",
        errors.length > 0 ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <DropTitle index={index} />
        <Badge variant="muted" className={HUNT_PILL}>
          <AppIcon icon="solar:lock-keyhole-minimalistic-linear" className="mr-1 size-3.5" />
          Locked
        </Badge>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{draft.lockedReason}</p>
      <p className="truncate text-sm font-medium text-foreground">
        {draft.product?.name ?? "Product no longer exists"}
      </p>
      <p className="text-xs text-muted-foreground">
        {start && end ? formatHuntSlot(start, end, true) : "No slot"}
        {reveal ? `. Countdown public from ${formatHuntClock(reveal)}` : ""}
        {price ? `. ${price}` : ""}
      </p>
      <RowErrors errors={errors} />
    </div>
  );
}

function DropTitle({ index }: { index: number }) {
  return (
    <span className="flex items-center gap-3">
      <span className="font-mono text-xs font-semibold text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-sm font-semibold text-foreground">Drop {index + 1}</span>
    </span>
  );
}

/**
 * What the typed price becomes. The percentage keeps two decimals, so on a
 * large base the price customers pay can sit a few naira off the one typed,
 * and this says so rather than showing the typed figure as if it were exact.
 */
function PriceNotes({
  draft,
  pricing,
  loading,
}: {
  draft: HuntDropDraft;
  pricing: HuntProductPricing | undefined;
  loading: boolean;
}) {
  const wrap = "space-y-1 text-xs text-muted-foreground sm:pt-7";

  if (!draft.product) {
    return <p className={wrap}>Pick a product to see its base price.</p>;
  }
  if (!pricing) {
    return (
      <p className={wrap}>
        {loading ? "Reading the base price…" : "Couldn’t read this product’s price."}
      </p>
    );
  }
  const base = pricing.cheapestBasePrice;
  if (base === null) {
    return (
      <p className={cn(wrap, "font-medium text-destructive-ink")}>
        This product has no base price, so it can’t be discounted.
      </p>
    );
  }

  const typed = draft.priceInput ? Number(draft.priceInput) : null;
  const percentage = dropPercentage({
    basePrice: base,
    price: typed,
    storedPercentage: draft.storedPercentage,
  });
  const valid =
    percentage !== null && percentage < 0 && percentage >= HUNT_MIN_PERCENTAGE;
  const pays = valid ? huntPrice(base, percentage) : null;
  const off = percentage !== null ? Number(Math.abs(percentage).toFixed(2)) : null;

  return (
    <div className={wrap}>
      {pays !== null ? (
        <p className="text-sm font-semibold text-foreground">
          Customers pay {formatPrice(pays)}, which is {off}% off{" "}
          {formatPrice(base)}.
        </p>
      ) : (
        <p>
          Base price {formatPrice(base)}. The lowest hunt price allowed is{" "}
          {formatPrice(lowestHuntPrice(base))}, which is 99% off.
        </p>
      )}
      {pays !== null &&
        typed !== null &&
        draft.storedPercentage === null &&
        pays !== typed && (
          <p>
            The discount keeps two decimal places, so {formatPrice(typed)} lands
            on {formatPrice(pays)}.
          </p>
        )}
      {pricing.variantCount > 1 && (
        <p className="font-medium text-warning-ink">
          This product has {pricing.variantCount} variants. The hunt price is
          the cheapest one’s, and the others get the same{" "}
          {off !== null ? `${off}%` : "percentage"} off.
        </p>
      )}
      {pays !== null && (
        <p>
          Recheck prices if you change this product’s base price. The discount
          is fixed, so the hunt price moves with the base.
        </p>
      )}
    </div>
  );
}

/**
 * A rule already on this product. A product holds one rule at a time, and the
 * drop's start is refused (`MARKUP_RULE_SCOPE_CONFLICT`) while it stands, so
 * the slot opens at the normal price. The detail page flags that after the
 * fact; this catches it before.
 */
function ClashNotice({ rule }: { rule: HuntClashRule }) {
  const isDiscount =
    (rule.ruleType ?? (rule.markupPercentage < 0 ? "DISCOUNT" : "MARKUP")) ===
    "DISCOUNT";
  const magnitude = Math.abs(rule.markupPercentage);
  const label = rule.notes?.trim();

  return (
    <div
      role="alert"
      className="space-y-1 rounded-lg border border-warning/50 bg-warning/10 p-3"
    >
      <p className="text-sm font-semibold text-warning-ink">
        {isDiscount
          ? `A −${magnitude}% discount rule already sits on this product`
          : `A +${magnitude}% markup rule already sits on this product`}
      </p>
      <p className="text-xs font-medium text-muted-foreground">
        A product holds one pricing rule at a time, so this drop would not start
        and the item would sell at its normal price. Remove that rule under
        Pricing, Markup before the drop{label ? ` (it is labelled “${label}”)` : ""}.
      </p>
      {!rule.isActive && (
        <p className="text-xs font-medium text-muted-foreground">
          It is switched off, and it still blocks the drop.
        </p>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  hint,
  reset,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  /** Set while the field no longer follows the slot start. */
  reset?: { label: string; onReset: () => void };
}) {
  return (
    <div className="space-y-1.5">
      <Label className="ml-1 text-xs font-semibold text-muted-foreground">{label}</Label>
      <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />
      {reset ? (
        <button
          type="button"
          onClick={reset.onReset}
          className="ml-1 text-xs font-medium text-primary-ink hover:underline"
        >
          {reset.label}
        </button>
      ) : (
        <p className="ml-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function RowErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="space-y-1">
      {errors.map((message) => (
        <li key={message} className="text-xs font-medium text-destructive-ink">
          {message}
        </li>
      ))}
    </ul>
  );
}
