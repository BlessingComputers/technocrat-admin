"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  analyzeRule,
  buildCoverage,
  countGaps,
  filterMap,
  filterRules,
  isLive,
  ruledTypes,
  type CoverageKind,
  type CoverageRow,
  type CoverageRule,
} from "@/lib/utils/markup-coverage";

import { CoverageMap, type MapFocus } from "./coverage-map";
import { RuleLanes, type RuleAction, type TierInfo } from "./rule-lanes";
import { pct } from "./tone";

export type { RuleAction } from "./rule-lanes";
export { RuleItemsLine } from "./rule-lanes";

export interface MarkupCoverageViewProps {
  kind: CoverageKind;
  /** Every rule, deals included: a deal can win or lose a cell. */
  rules: CoverageRule[];
  rows: CoverageRow[];
  /** The slice's tiers, strongest first. */
  tiers: readonly TierInfo[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  /** The selected rule's item count (the slice's impact query). */
  renderItems: (rule: CoverageRule) => ReactNode;
  onAction: (action: RuleAction, rule: CoverageRule) => void;
  onCreate: () => void;
  formatExpiry: (iso: string) => string;
}

/**
 * The /pricing/markup body (ask 41 part 2, comp docs/design/markup-page-comp.html
 * v8): facts, filters, rules by strength on the left, the coverage map on the
 * right. Selecting a rule lights its cells in green; clicking a cell explains
 * its price. The slices own the header, the dialogs and the API calls.
 */
export function MarkupCoverageView(props: MarkupCoverageViewProps) {
  const { kind, rules, rows, tiers } = props;
  const id = useId();
  const parts = kind === "parts";
  const noun = parts ? "part" : "product";

  // Read once per mount: a deal that ends while the page is open shows after
  // a refresh, like the rest of the list.
  const [now] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [withDeals, setWithDeals] = useState(true);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  // undefined = not chosen yet: the first type with a rule.
  const [typeChoice, setTypeChoice] = useState<string | null | undefined>(undefined);

  const types = useMemo(() => (parts ? ruledTypes(rules, now) : []), [parts, rules, now]);
  const typeId = parts
    ? typeChoice === undefined || (typeChoice && !types.some((t) => t.id === typeChoice))
      ? (types[0]?.id ?? null)
      : typeChoice
    : null;
  const typeName = types.find((t) => t.id === typeId)?.name ?? null;

  const model = useMemo(
    () => buildCoverage({ kind, rules, rows, typeId, withDeals, now }),
    [kind, rules, rows, typeId, withDeals, now],
  );
  const view = useMemo(() => filterMap(model, { query, gapsOnly }), [model, query, gapsOnly]);
  const shown = useMemo(
    () => filterRules(rules, { query, activeOnly, withDeals }),
    [rules, query, activeOnly, withDeals],
  );

  const selected = rules.find((r) => r.id === selectedId) ?? null;
  const analysis = useMemo(
    () =>
      selected && isLive(selected, now) && !selected.itemId && (withDeals || !selected.isDeal)
        ? analyzeRule(model, selected.id)
        : null,
    [selected, model, now, withDeals],
  );

  if (props.isLoading) return <MarkupCoverageSkeleton />;
  if (props.isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[14px] border border-border/60 bg-card px-6 py-16 text-center shadow-soft">
        <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">Couldn’t load markup rules</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This needs the products:write permission. Try again shortly.
          </p>
        </div>
        <Button variant="outline" onClick={props.onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  const markups = rules.filter((r) => !r.isDeal);
  const activeMarkups = markups.filter((r) => r.isActive).length;
  const runningDeals = rules.filter((r) => r.isDeal && isLive(r, now)).length;
  const gaps = countGaps(model);
  const itemRuleCount = rules.filter(
    (r) => r.itemId && isLive(r, now) && (withDeals || !r.isDeal),
  ).length;
  const filtered = !!query.trim() || activeOnly || gapsOnly;
  const hidden = rules.length - shown.length;

  const clear = () => {
    setQuery("");
    setActiveOnly(false);
    setGapsOnly(false);
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-x-0 gap-y-1.5 rounded-[14px] border border-border/60 bg-card px-[18px] py-3 shadow-soft tabular-nums max-sm:gap-x-3.5 max-sm:px-3.5 max-sm:py-2.5">
        <Fact icon="solar:list-check-linear">
          {markups.length ? (
            <>
              <b className="font-semibold text-foreground">{activeMarkups}</b> of {markups.length} markups on
            </>
          ) : (
            <b className="font-semibold text-foreground">No markups yet</b>
          )}
        </Fact>
        <Fact icon="solar:tag-price-linear">
          <b className="font-semibold text-foreground">{runningDeals}</b>{" "}
          {runningDeals === 1 ? "deal" : "deals"} running
        </Fact>
        {model.fallback ? (
          <Fact icon="solar:shield-check-linear">
            Fallback{" "}
            <b className="font-semibold text-foreground">
              {model.fallback.label} {pct(model.fallback.pct)}
            </b>
            , so no gaps
          </Fact>
        ) : (
          <Fact icon="solar:danger-circle-linear">
            <b className={cn("font-semibold", gaps ? "text-warning-ink" : "text-foreground")}>{gaps}</b>{" "}
            map cells at base price{parts ? " (this type)" : ""}
          </Fact>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-[1_1_280px] max-sm:basis-full">
          <AppIcon
            icon="solar:magnifer-linear"
            className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Find a ${noun}, category or brand`}
            aria-label="Search rules and map"
            className="h-10 pl-9"
          />
        </div>
        <Select value={activeOnly ? "active" : "all"} onValueChange={(v) => setActiveOnly(v === "active")}>
          <SelectTrigger className="h-10 w-[140px]" aria-label="Rule status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">On and off</SelectItem>
            <SelectItem value="active">On only</SelectItem>
          </SelectContent>
        </Select>
        <ToggleChip on={withDeals} onToggle={() => setWithDeals((v) => !v)} tone="deals">
          Running deals
        </ToggleChip>
        <ToggleChip on={gapsOnly} onToggle={() => setGapsOnly((v) => !v)} tone="gaps">
          Only gaps
        </ToggleChip>
      </div>

      {filtered && (
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground tabular-nums">
          <AppIcon icon="solar:filter-linear" className="size-4" />
          <span>
            Showing <b className="font-semibold text-foreground">{shown.length}</b> of {rules.length} rules
            {view.brandHits > 0 && (
              <>
                , <b className="font-semibold text-foreground">{view.brandHits}</b> of {model.brands.length}{" "}
                brand columns
              </>
            )}
            {view.rows.length < rows.length && (
              <>
                , <b className="font-semibold text-foreground">{view.rows.length}</b> of {rows.length} categories
              </>
            )}
            .{hidden > 0 ? ` ${hidden} hidden.` : ""}
          </span>
          <button
            type="button"
            onClick={clear}
            className="font-medium text-primary-ink underline underline-offset-[3px]"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section
          aria-labelledby={`${id}-lanes`}
          className="rounded-[14px] border border-border/60 bg-card shadow-soft"
        >
          <div className="px-5 pt-4 pb-3 max-sm:px-3.5">
            <h3 id={`${id}-lanes`} className="text-base font-semibold">
              Rules by strength
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A rule beats every rule below it. Click one to see where it wins.
            </p>
          </div>
          <RuleLanes
            kind={kind}
            tiers={tiers}
            allRules={rules}
            shown={shown}
            query={query.trim()}
            hasFallback={!!model.fallback}
            selectedId={selectedId}
            onSelect={setSelectedId}
            analysis={analysis}
            typeName={typeName}
            itemRuleCount={itemRuleCount}
            now={now}
            renderItems={props.renderItems}
            onAction={props.onAction}
            onCreate={props.onCreate}
          />
        </section>

        <CoverageMap
          id={id}
          kind={kind}
          model={model}
          view={view}
          tiers={tiers}
          rules={rules}
          withDeals={withDeals}
          now={now}
          selected={selected}
          analysis={analysis}
          focus={focus}
          onFocus={setFocus}
          types={parts ? types : undefined}
          onType={setTypeChoice}
          typeName={typeName}
          itemRuleCount={itemRuleCount}
          formatExpiry={props.formatExpiry}
        />
      </div>
    </div>
  );
}

function Fact({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 border-l border-border px-[18px] text-sm text-muted-foreground first:border-l-0 first:pl-0 max-sm:border-l-0 max-sm:px-0 max-sm:text-xs">
      <AppIcon icon={icon} className="size-4 shrink-0" />
      <span>{children}</span>
    </span>
  );
}

/** On/off chip: its meaning's colour, a filled check for the empty ring, and weight. */
function ToggleChip({
  on,
  onToggle,
  tone,
  children,
}: {
  on: boolean;
  onToggle: () => void;
  tone: "deals" | "gaps";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "group inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-medium",
        on
          ? tone === "deals"
            ? "border-info/55 bg-info/14 font-semibold text-info-ink"
            : "border-warning/55 bg-warning/14 font-semibold text-warning-ink"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {on ? (
        <AppIcon icon="solar:check-circle-bold" className="size-[18px]" />
      ) : (
        <i
          aria-hidden
          className="m-px size-4 shrink-0 rounded-full border-[1.5px] border-input group-hover:border-muted-foreground"
        />
      )}
      {children}
    </button>
  );
}

/** Loading shape: the facts line, the toolbar, then the two columns. */
export function MarkupCoverageSkeleton() {
  return (
    <div className="grid gap-5" aria-hidden>
      <div className="h-12 animate-pulse rounded-[14px] bg-muted" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="hidden h-10 w-64 animate-pulse rounded-full bg-muted sm:block" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="h-[420px] animate-pulse rounded-[14px] bg-muted" />
        <div className="h-[420px] animate-pulse rounded-[14px] bg-muted" />
      </div>
    </div>
  );
}

