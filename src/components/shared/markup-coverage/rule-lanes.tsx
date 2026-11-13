"use client";

import { forwardRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import {
  familyOf,
  isLive,
  laneOrder,
  tierFamily,
  type CoverageKind,
  type CoverageRule,
  type PreviewItem,
  type RuleAnalysis,
} from "@/lib/utils/markup-coverage";

import { CellItemsList } from "./cell-items";

import { TONE, pct, plural, shortDate } from "./tone";

export type RuleAction = "apply" | "edit" | "reset" | "cancel" | "delete";

export interface TierInfo {
  key: string;
  label: string;
}

const TIER_HELP: Record<string, string> = {
  product: "One exact product. Beats every other rule.",
  part: "One exact part. Beats every other rule.",
  categoryBrandType: "For example Dell laptop batteries.",
  categoryBrand: "For example Apple phones.",
  brandType: "For example HP batteries.",
  categoryType: "For example laptop screens.",
  brand: "Every item from one brand.",
  category: "Every item in a category and its subcategories.",
  type: "Every part of one type.",
  all: "The fallback when no other rule fits.",
};

export interface RuleLanesProps {
  kind: CoverageKind;
  tiers: readonly TierInfo[];
  /** Every rule, before filters: an empty list is the empty store. */
  allRules: readonly CoverageRule[];
  /** The rules left after search and filters. */
  shown: readonly CoverageRule[];
  query: string;
  hasFallback: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  now: number;
  onCreate: () => void;
}

export function RuleLanes(props: RuleLanesProps) {
  const { kind, tiers, allRules, shown, query, hasFallback, selectedId } = props;
  const noun = kind === "parts" ? "part" : "product";
  const allLabel = kind === "parts" ? "All parts" : "All products";

  if (!allRules.length) {
    return (
      <div className="grid gap-3.5 px-5 pt-2 pb-5">
        <p className="text-sm text-muted-foreground">
          No markup rules yet. Every {noun} sells at its base price.
        </p>
        <ol className="relative grid gap-0.5 before:absolute before:top-3.5 before:bottom-3.5 before:left-[11px] before:w-[1.5px] before:bg-border">
          {tiers.map((t) => (
            <li key={t.key} className="relative grid grid-cols-[24px_1fr] gap-2.5 py-1">
              <span aria-hidden className="z-10 grid size-6 place-items-center">
                <span
                  className={cn(
                    "size-[9px] rounded-full border-[1.5px] border-dashed bg-card",
                    TONE[tierFamily(t.key)].line,
                  )}
                />
              </span>
              <span>
                <b className="block text-sm font-medium">{t.label}</b>
                <small className="text-xs text-muted-foreground">{TIER_HELP[t.key]}</small>
              </span>
            </li>
          ))}
        </ol>
        <div>
          <Button variant="outline" size="sm" onClick={props.onCreate}>
            <AppIcon icon="solar:add-circle-linear" className="size-4" />
            Start with {allLabel}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A rule higher up beats every rule below it. &ldquo;{allLabel}&rdquo; is the fallback,
          so it is a good first rule.
        </p>
      </div>
    );
  }

  const empty: string[] = [];
  const lanes = tiers.flatMap((t) => {
    const inTier = shown.filter((r) => r.tier === t.key);
    if (!inTier.length) {
      if (!query) empty.push(t.label);
      return [];
    }
    return [{ tier: t, rules: laneOrder(inTier) }];
  });

  return (
    <>
      {lanes.length > 0 && (
        <div className="relative grid gap-1 px-3 pb-3.5 before:absolute before:top-3.5 before:bottom-6 before:left-[23px] before:w-[1.5px] before:bg-border">
          {lanes.map(({ tier, rules }) => {
            const tone = TONE[tierFamily(tier.key)];
            const hasSel = rules.some((r) => r.id === selectedId);
            return (
              <section key={tier.key} aria-label={tier.label} className="grid gap-0.5">
                <div className="relative grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 pt-1.5 pr-1 pb-0.5">
                  <span aria-hidden className="z-10 grid size-6 place-items-center">
                    <span
                      className={cn(
                        "rounded-full",
                        tone.dot,
                        hasSel ? cn("size-[11px] ring-4", tone.halo) : "size-[9px]",
                      )}
                    />
                  </span>
                  <b className="font-semibold">{tier.label}</b>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {plural(rules.length, "rule")}
                  </span>
                </div>
                {rules.map((r) => (
                  <RuleRow key={r.id} rule={r} selected={r.id === selectedId} {...props} />
                ))}
              </section>
            );
          })}
        </div>
      )}
      {lanes.length === 0 && (
        <p className="px-5 pb-4 text-sm text-muted-foreground">No rules match the filters.</p>
      )}
      {empty.length > 0 && (
        <p className="mx-4 mb-3.5 ml-[46px] text-xs text-muted-foreground">
          No rules: <b className="font-medium text-foreground">{empty.join(" · ")}</b>
          {!hasFallback && empty.includes(allLabel)
            ? ". With no fallback, items no rule covers sell at base price."
            : "."}
        </p>
      )}
    </>
  );
}

/** The rule's scope as labelled parts: Category, Brand, Type, or one item. */
function scopeChips(rule: CoverageRule, kind: CoverageKind): { key: string | null; value: string }[] {
  if (rule.itemId) return [{ key: kind === "parts" ? "Part" : "Product", value: rule.label }];
  const chips = [
    rule.categoryId && { key: "Category", value: rule.categoryName ?? "Unknown category" },
    rule.brandId && { key: "Brand", value: rule.brandName ?? "Unknown brand" },
    rule.typeId && { key: "Type", value: rule.typeName ?? "Unknown type" },
  ].filter((c): c is { key: string; value: string } => !!c);
  return chips.length ? chips : [{ key: null, value: kind === "parts" ? "All parts" : "All products" }];
}

function RuleRow({
  rule,
  selected,
  onSelect,
  now,
  kind,
}: RuleLanesProps & { rule: CoverageRule; selected: boolean }) {
  return (
    <div
      className={cn(
        "ml-[34px] rounded-[11px] border border-transparent max-sm:ml-[30px]",
        selected
          ? "border-success bg-success/5 shadow-[0_8px_20px_-8px_rgb(0_0_0/0.14)] dark:shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)]"
          : "hover:bg-accent",
      )}
    >
      {/* Selecting opens the rule's detail at the top of the right column. */}
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(selected ? null : rule.id)}
        className="w-full rounded-[11px] px-2.5 py-2 text-left"
      >
        <RuleSummary rule={rule} kind={kind} now={now} />
      </button>
    </div>
  );
}

/** Scope chips, the %, and the status line: a lane row and the panel header. */
function RuleSummary({ rule, kind, now }: { rule: CoverageRule; kind: CoverageKind; now: number }) {
  const off = !isLive(rule, now);
  const tone = TONE[familyOf(rule)];
  return (
    <span className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5">
      {/* Each part of the scope named, so "which is the brand, which is the
          category" never has to be guessed from "Apple · Phones". */}
      <span className={cn("flex min-w-0 flex-wrap gap-1", off && "opacity-70")}>
        {scopeChips(rule, kind).map((c) => (
          <span
            key={`${c.key}:${c.value}`}
            className="inline-flex max-w-full min-w-0 items-baseline gap-1 rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-xs"
          >
            {c.key && <span className="shrink-0 text-muted-foreground">{c.key}:</span>}
            <span className="truncate font-medium text-foreground">{c.value}</span>
          </span>
        ))}
      </span>
      <span
        className={cn(
          "row-span-2 pt-0.5 text-base font-semibold tabular-nums",
          off ? "font-normal text-muted-foreground" : tone.ink,
        )}
      >
        {pct(rule.pct)}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        {rule.isActive ? (
          <span className="font-medium text-foreground">On</span>
        ) : (
          <Badge variant="muted" className="rounded-full">
            Off
          </Badge>
        )}
        {rule.isDeal && (
          <Badge variant="info" className="rounded-full">
            <AppIcon icon="solar:tag-price-linear" className="size-3" />
            {rule.expiresAt ? `Deal · ends ${shortDate(rule.expiresAt)}` : "Deal"}
          </Badge>
        )}
        {rule.meta && <span className="truncate">· {rule.meta}</span>}
        {rule.ruleId && <span className="font-mono">· {rule.ruleId}</span>}
      </span>
    </span>
  );
}

export interface SelectedRulePanelProps {
  kind: CoverageKind;
  tiers: readonly TierInfo[];
  rule: CoverageRule;
  now: number;
  analysis: RuleAnalysis | null;
  /** "Battery", or null for other types (parts only). */
  typeName: string | null;
  /** Live one-item rules, which can also beat the selected rule. */
  itemRuleCount: number;
  renderItems: (rule: CoverageRule) => ReactNode;
  onAction: (action: RuleAction, rule: CoverageRule) => void;
  onClose: () => void;
}

/**
 * The selected rule's detail, at the top of the right column above the map:
 * where it wins and loses, its items, what it beats and what beats it, and
 * its actions. Green line: it is the selection.
 */
export const SelectedRulePanel = forwardRef<HTMLElement, SelectedRulePanelProps>(
  function SelectedRulePanel(props, ref) {
    return (
      <section
        ref={ref}
        aria-label="Selected rule"
        className="scroll-mt-4 rounded-[14px] border border-success bg-card shadow-soft"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 max-sm:px-3.5">
          <h3 className="text-base font-semibold">Selected rule</h3>
          <Button
            variant="ghost"
            size="icon"
            className="-mt-1 -mr-2 size-8"
            aria-label="Close the selected rule"
            onClick={props.onClose}
          >
            <AppIcon icon="solar:close-circle-linear" className="size-[18px]" />
          </Button>
        </div>
        <div className="px-5 max-sm:px-3.5">
          <RuleSummary rule={props.rule} kind={props.kind} now={props.now} />
        </div>
        <RuleDetail {...props} off={!isLive(props.rule, props.now)} />
      </section>
    );
  },
);

function RuleDetail({
  rule,
  off,
  kind,
  tiers,
  analysis,
  typeName,
  itemRuleCount,
  renderItems,
  onAction,
}: SelectedRulePanelProps & { off: boolean }) {
  const noun = kind === "parts" ? "part" : "product";
  const actions = <RuleActions rule={rule} onAction={onAction} />;
  const shell = "mx-5 mt-3 mb-5 grid gap-3 border-t border-border pt-3 max-sm:mx-3.5";

  if (off) {
    return (
      <div className={shell}>
        <p className="text-base leading-snug">
          This rule is off, so it prices nothing and has no cells on the map.
        </p>
        {actions}
      </div>
    );
  }
  if (rule.itemId) {
    return (
      <div className={shell}>
        <p className="text-base leading-snug">
          Beats every other rule for <b className="font-semibold">{rule.label}</b>.
        </p>
        {renderItems(rule)}
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <AppIcon icon="solar:info-circle-linear" className="mt-0.5 size-4 shrink-0" />
          <span>No cell on the map: a one-{noun} rule has no category or brand in the API.</span>
        </p>
        {actions}
      </div>
    );
  }

  const tierLabel = Object.fromEntries(tiers.map((t) => [t.key, t.label]));
  const list = (rows: [CoverageRule, number][], none: string) =>
    rows.length ? (
      <ul className="grid gap-0.5">
        {rows.map(([o, n]) => (
          <li
            key={o.id}
            className="grid grid-cols-[8px_minmax(0,1fr)_auto_auto] items-baseline gap-2.5 border-b border-border/60 py-1 last:border-b-0"
          >
            <i aria-hidden className={cn("size-2 -translate-y-px rounded-full", TONE[familyOf(o)].dot)} />
            <span className="truncate">
              {o.label}
              <small className="block text-xs text-muted-foreground">
                {tierLabel[o.tier]}
                {o.isDeal && o.expiresAt ? ` · deal, ends ${shortDate(o.expiresAt)}` : ""}
              </small>
            </span>
            <span className={cn("font-semibold tabular-nums", TONE[familyOf(o)].ink)}>
              {pct(o.pct)}
            </span>
            <span className="min-w-[52px] text-right text-xs text-muted-foreground tabular-nums">
              {plural(n, "cell")}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-muted-foreground">{none}</p>
    );

  const a = analysis;
  return (
    <div className={shell}>
      <p className="text-base leading-snug tabular-nums">
        Wins <b className="font-semibold">{plural(a?.wins.size ?? 0, "cell")}</b>
        {a?.lost.size ? (
          <>
            , beaten in <b className="font-semibold">{a.lost.size}</b>
          </>
        ) : null}
        {kind === "parts" ? ` for ${typeName ? `${typeName} parts` : "parts of other types"}` : ""}.
      </p>
      {renderItems(rule)}
      <div className="grid gap-3 md:grid-cols-2 md:gap-6">
      <div className="min-w-0">
        <h5 className="mb-1 text-xs font-medium text-muted-foreground">Beats</h5>
        {list(a?.beats ?? [], "Nothing below it here.")}
      </div>
      <div className="min-w-0">
        <h5 className="mb-1 text-xs font-medium text-muted-foreground">Beaten by</h5>
        {list(a?.beatenBy ?? [], "Nothing on the map.")}
        {itemRuleCount > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {plural(itemRuleCount, `one-${noun} rule`)} may also beat it, each for its own {noun}.
          </p>
        )}
      </div>
      </div>
      {actions}
    </div>
  );
}

/** Every action the old rules table had. A deal is managed on /pricing/deals. */
function RuleActions({
  rule,
  onAction,
}: {
  rule: CoverageRule;
  onAction: (action: RuleAction, rule: CoverageRule) => void;
}) {
  if (rule.isDeal) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Button asChild variant="outline" size="sm">
          <Link href={rule.dealId ? `/pricing/deals/${rule.dealId}` : "/pricing/deals"}>
            <AppIcon icon="solar:arrow-right-up-linear" className="size-4" />
            Open in Deals
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="outline" size="sm" onClick={() => onAction("apply", rule)}>
        <AppIcon icon="solar:play-circle-linear" className="size-4" />
        Preview &amp; apply
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onAction("edit", rule)}>
        <AppIcon icon="solar:pen-2-linear" className="size-4" />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="More actions">
            <AppIcon icon="solar:menu-dots-bold" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => onAction("reset", rule)}>
            <AppIcon icon="solar:rewind-back-linear" className="mr-2 size-4" />
            Reset prices (keep active)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("cancel", rule)}>
            <AppIcon icon="solar:undo-left-round-linear" className="mr-2 size-4" />
            Cancel rule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onAction("delete", rule)}
            disabled={rule.isActive}
            title={rule.isActive ? "Cancel the rule first — an active rule cannot be deleted" : undefined}
            className="font-medium text-destructive-ink focus:bg-destructive/10 focus:text-destructive-ink"
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * The selected rule's item count, from the slice's impact query, and a
 * button that lists those items (base, rule price, difference) in a sheet.
 */
export function RuleItemsLine({
  loading,
  count,
  other,
  noun,
  rule,
  rows,
}: {
  loading: boolean;
  count: number | undefined;
  other: number | undefined;
  /** "variant" or "part". */
  noun: string;
  rule: CoverageRule;
  /** The same preview's rows, for the item list. */
  rows: PreviewItem[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  if (loading) {
    return (
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="mt-[3px] size-3.5 shrink-0 animate-spin rounded-full border-2 border-border border-t-muted-foreground motion-reduce:animate-none"
        />
        <span>Counting {noun}s…</span>
      </p>
    );
  }
  if (count === undefined) return null;
  return (
    <div className="grid gap-1.5">
      <p className="flex items-start gap-2 text-sm text-muted-foreground tabular-nums">
        <AppIcon icon="solar:box-linear" className="mt-0.5 size-4 shrink-0" />
        <span>
          Prices <b className="font-semibold text-foreground">{plural(count, noun)}</b> now.
          {other ? ` ${other.toLocaleString("en-GB")} more in its scope use another rule.` : ""}
        </span>
      </p>
      {rows && rows.length > 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <AppIcon icon="solar:list-check-linear" className="size-4" />
            Show the items
          </Button>
        </div>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-border bg-card shadow-soft-lg sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
            <SheetTitle className="text-base">Items this rule prices</SheetTitle>
            <SheetDescription>
              {rule.label} {pct(rule.pct)}
              {rule.ruleId ? ` · ${rule.ruleId}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pt-4 pb-6">
            <CellItemsList
              loading={false}
              failed={false}
              rows={rows}
              // The rule's own preview keeps its applyTo: a compare-at-only
              // rule leaves the price at base, so there is no % to undo.
              previewPct={rule.affectsPrice ? rule.pct : 0}
              winner={rule}
              noun={noun}
              title="Items"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
