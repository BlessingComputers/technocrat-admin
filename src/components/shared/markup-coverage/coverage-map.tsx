"use client";

import { memo, useMemo } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils/cn";
import {
  cellKey,
  cellPreviewPct,
  familyCounts,
  familyOf,
  isLive,
  ownCategoryRule,
  ruleAfterDeal,
  type CoverageCell,
  type CoverageKind,
  type CoverageModel,
  type CoverageRule,
  type MapFamily,
  type MapView,
  type RuleAnalysis,
} from "@/lib/utils/markup-coverage";

import type { CellQuery } from "./cell-items";
import type { TierInfo } from "./rule-lanes";
import {
  HATCH,
  HATCH_DENSE,
  PANEL,
  SCROLL_COLUMN,
  TONE,
  familyTone,
  pct,
  plural,
  shortDate,
} from "./tone";

export interface MapFocus {
  categoryId: string;
  brandId: string | null;
}

export interface CoverageMapProps {
  id: string;
  kind: CoverageKind;
  model: CoverageModel;
  view: MapView;
  tiers: readonly TierInfo[];
  /** Every rule, for the brand column headers. */
  rules: readonly CoverageRule[];
  withDeals: boolean;
  now: number;
  selected: CoverageRule | null;
  analysis: RuleAnalysis | null;
  focus: MapFocus | null;
  /** The clicked cell (null closes its "Why this price" popover). */
  onFocus: (focus: MapFocus | null) => void;
  /** Parts: the types that have a rule. */
  types?: { id: string; name: string; count: number }[];
  onType?: (typeId: string | null) => void;
  typeName: string | null;
  itemRuleCount: number;
  /** The slice's long expiry format ("20 Nov 2026, 11:59 pm"). */
  formatExpiry: (iso: string) => string;
  /** The clicked cell's items, from the slice's preview query. */
  renderCellItems?: (query: CellQuery) => React.ReactNode;
}

const SHORT_TIER: Record<string, string> = {
  categoryBrandType: "Cat, brand & type",
  categoryBrand: "Category & brand",
  brandType: "Brand & type",
  categoryType: "Category & type",
  brand: "Brand",
  category: "Category",
  type: "Type",
  all: "Fallback",
};

type CellState = "win" | "lost" | "out" | "";

export function CoverageMap(props: CoverageMapProps) {
  const { id, kind, model, view, analysis, selected, focus, types, typeName } = props;
  const parts = kind === "parts";
  const noun = parts ? "part" : "product";
  const brandNames = useMemo(() => new Map(model.brands.map((b) => [b.id, b.name])), [model]);
  const rowNames = useMemo(() => new Map(model.rows.map((r) => [r.id, r.name])), [model]);
  const brandName = (b: string | null) => (b ? (brandNames.get(b) ?? b) : "Other brands");
  const rowName = (c: string) => rowNames.get(c) ?? c;
  // Draw one layout only: the hidden one still cost a full render per click.
  const phone = useMediaQuery("(max-width: 639px)");

  const stateOf = (c: CoverageCell): CellState => {
    if (!analysis) return "";
    const k = cellKey(c.categoryId, c.brandId);
    return analysis.wins.has(k) ? "win" : analysis.lost.has(k) ? "lost" : "out";
  };

  const familyLabel: Record<MapFamily, string> = {
    categoryBrand: parts ? "Category & brand (+ type)" : "Category & brand",
    brand: parts ? "Brand (+ type)" : "Brand",
    category: parts ? "Category (+ type)" : "Category",
    type: "Type",
    all: "Fallback",
    deal: "Running deal",
    gap: "No rule: base price",
  };
  const counts = familyCounts(model);
  const total = model.rows.length * model.columns.length;
  const typeLabel = typeName ? `${typeName} parts` : "parts of other types";

  // A brand header says why the brand is a column: the rules that name it.
  const colHead = (b: string | null) => {
    if (!b) {
      return (
        <th key="base" scope="col" className={cn("rounded-t-lg px-1.5 pt-1 pb-1.5 text-left align-bottom font-normal", PANEL)}>
          <b className="block font-semibold">Other brands</b>
          <span className="block max-w-[150px] text-xs leading-snug text-muted-foreground">
            The baseline: brands with no rule
          </span>
        </th>
      );
    }
    const rs = props.rules.filter(
      (r) =>
        r.brandId === b && !r.itemId && isLive(r, props.now) && (props.withDeals || !r.isDeal),
    );
    const own = rs.find((r) => !r.categoryId && !r.typeId);
    const rest = rs.filter((r) => r !== own);
    const what = rest.every((r) => r.isDeal)
      ? rest.length === 1
        ? "deal"
        : "deals"
      : rest.length === 1
        ? "rule"
        : "rules";
    return (
      <th key={b} scope="col" className="px-1.5 pt-1 pb-1.5 text-left align-bottom font-normal">
        <b className="block font-semibold">{brandName(b)}</b>
        <span className="block max-w-[150px] text-xs leading-snug text-muted-foreground tabular-nums">
          {own && (
            <>
              Brand rule{" "}
              <span className={cn("font-semibold", TONE[familyOf(own)].ink)}>{pct(own.pct)}</span>
            </>
          )}
          {rest.length > 0 &&
            `${own ? " + " : ""}${rest.length} ${what}: ${rest
              .map((r) => [r.categoryName, r.typeName].filter(Boolean).join(" · "))
              .join(", ")}`}
        </span>
      </th>
    );
  };

  const cellButton = (c: CoverageCell, line: boolean) => {
    const s = stateOf(c);
    return (
      <MapCellButton
        key={cellKey(c.categoryId, c.brandId)}
        cell={c}
        s={s}
        isFocus={focus?.categoryId === c.categoryId && focus.brandId === c.brandId}
        line={line}
        selectedPct={s === "lost" ? selected?.pct : undefined}
        brandLabel={brandName(c.brandId)}
        rowLabel={rowName(c.categoryId)}
        onFocus={props.onFocus}
      />
    );
  };

  return (
    <section
      aria-labelledby={`${id}-map`}
      className={cn("min-w-0 rounded-[14px] border border-border/60 bg-card shadow-soft", SCROLL_COLUMN)}
    >
      <div className="px-5 pt-4 pb-3 max-sm:px-3.5">
        <h3 id={`${id}-map`} className="text-base font-semibold">
          Coverage map
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          What {parts ? "a part" : "an item"} in each category and brand sells at. Click a cell to see
          why.
        </p>
      </div>

      {parts && types && (
        <div role="group" aria-label="Part type" className="flex flex-wrap items-center gap-1 px-5 pb-3 max-sm:px-3.5">
          <span className="mr-1.5 text-xs font-medium text-muted-foreground">Part type</span>
          {[...types, { id: "", name: "Other types", count: 0 }].map((t) => {
            const on = (props.model.typeId ?? "") === t.id;
            return (
              <button
                key={t.id || "other"}
                type="button"
                aria-pressed={on}
                onClick={() => props.onType?.(t.id || null)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
                  on ? "border-foreground/35 bg-accent font-semibold" : "border-border bg-card hover:bg-accent",
                )}
              >
                {t.name}
                {t.count > 0 && (
                  <small className="text-xs font-normal text-muted-foreground tabular-nums">{t.count}</small>
                )}
              </button>
            );
          })}
        </div>
      )}

      <figure
        aria-labelledby={`${id}-chart`}
        className={cn("mx-5 mb-3.5 grid gap-2.5 rounded-[11px] border border-border px-3.5 py-3 max-sm:mx-3", PANEL)}
      >
        <figcaption id={`${id}-chart`} className="flex items-baseline justify-between gap-3">
          <b className="font-semibold">Who wins the map</b>
          <span className="text-xs text-muted-foreground tabular-nums">
            {plural(total, "cell")}
            {parts ? `, ${typeLabel}` : ""}
          </span>
        </figcaption>
        <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
          {counts.map(({ family, count }) => (
            <i
              key={family}
              title={`${familyLabel[family]}: ${plural(count, "cell")}`}
              style={{ flexGrow: count, ...(family === "gap" ? HATCH : {}) }}
              className={cn("block min-w-1", familyTone(family)?.dot ?? "bg-card")}
            />
          ))}
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-4 gap-y-1 tabular-nums max-sm:grid-cols-1">
          {counts.map(({ family, count }) => (
            <li key={family} className="grid grid-cols-[10px_minmax(0,1fr)_auto_36px] items-center gap-2 text-sm">
              <i
                aria-hidden
                style={family === "gap" ? HATCH_DENSE : undefined}
                className={cn(
                  "size-2.5 rounded-full",
                  familyTone(family)?.dot ?? "border border-dashed border-muted-foreground",
                )}
              />
              <span className="truncate">{familyLabel[family]}</span>
              <b className="text-right font-semibold">{count}</b>
              <span className="text-right text-xs text-muted-foreground">
                {Math.round((count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <i aria-hidden className={cn("h-3 w-4 shrink-0 rounded-[5px] border", TONE.category.soft)} />
          A lighter tint in a cell means the value comes from the parent category.
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="w-4 shrink-0 text-center text-base font-medium text-muted-foreground/60">
            =
          </span>
          A brand cell with &ldquo;=&rdquo; has the same price as &ldquo;Other brands&rdquo; in its row.
          Only the cells where a brand differs stay strong.
        </p>
      </figure>

      {analysis && (
        <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 px-5 pb-3 text-xs text-muted-foreground max-sm:px-3.5">
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden className="h-3 w-4 rounded-[5px] border-[1.5px] border-success bg-success/13" />
            Selected rule wins
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i aria-hidden className="h-3 w-4 rounded-[5px] border-[1.5px] border-dashed border-success/60 bg-card" />
            Selected rule loses (its % struck)
          </span>
          <span>Faded: outside its scope</span>
        </div>
      )}

      {props.itemRuleCount > 0 && (
        <div className={cn("mx-5 mb-3 flex items-start gap-2.5 rounded-[11px] border border-border px-3 py-2.5 text-sm max-sm:mx-3", PANEL)}>
          <AppIcon icon="solar:box-minimalistic-linear" className="mt-0.5 size-[18px] shrink-0 text-muted-foreground" />
          <span>
            <b className="font-semibold tabular-nums">{plural(props.itemRuleCount, `one-${noun} rule`)}</b>{" "}
            sit above this map.
            <small className="block text-xs text-muted-foreground">
              Each beats every cell for its own {noun}. They have no category or brand, so they have
              no cell.
            </small>
          </span>
        </div>
      )}

      {/* Desktop and tablet: the grid. */}
      {!phone && (
      <div className="overflow-x-auto px-3 pb-3">
        <table className="w-full min-w-[560px] border-separate border-spacing-1 tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="w-[200px] px-1.5 pt-1 pb-1.5 text-left align-bottom font-normal">
                <b className="block font-semibold">Category</b>
                <span className="block text-xs text-muted-foreground">
                  {model.fallback ? `Fallback ${pct(model.fallback.pct)}` : "No fallback rule"}
                </span>
              </th>
              {view.columns.map(colHead)}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((r) => {
              const own = ownCategoryRule(model, r.id);
              return (
                <tr key={r.id}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 bg-card py-1 pr-2.5 pl-1 text-left align-middle font-normal",
                      r.parentId && "pl-[22px]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-1.5 font-medium whitespace-nowrap",
                        r.parentId &&
                          "before:-ml-3.5 before:size-2.5 before:-translate-y-1 before:rounded-bl-[5px] before:border-b-[1.5px] before:border-l-[1.5px] before:border-border before:content-['']",
                      )}
                    >
                      {r.name}
                    </span>
                    <span className="block text-xs whitespace-nowrap text-muted-foreground">
                      {plural(r.count, noun)}
                      {own && (
                        <>
                          {" · "}
                          <span className={cn("font-semibold", TONE[familyOf(own)].ink)}>{pct(own.pct)}</span>
                        </>
                      )}
                    </span>
                  </th>
                  {view.columns.map((b) => (
                    <td key={b ?? "base"} className="min-w-[104px] p-0">
                      {cellButton(model.cell(r.id, b), false)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {view.rows.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No categories match the filters.</p>
        )}
      </div>

      )}

      {/* Phone: one card per category, the baseline and only the brands that differ. */}
      {phone && (
      <div className="grid gap-2.5 px-3 pb-3">
        {view.rows.map((r) => {
          const own = ownCategoryRule(model, r.id);
          const cells = view.columns.map((b) => model.cell(r.id, b));
          const shownCells = cells.filter((c) => !c.sameAsBaseline || ["win", "lost"].includes(stateOf(c)));
          const same = cells.filter((c) => c.sameAsBaseline && !["win", "lost"].includes(stateOf(c)));
          const parent = r.parentId ? model.rows.find((x) => x.id === r.parentId) : null;
          return (
            <article key={r.id} className={cn("grid gap-2 rounded-[11px] border border-border p-3", r.parentId && "ml-3.5")}>
              <header className="flex items-baseline justify-between gap-2">
                <span>
                  <b className="font-semibold">{r.name}</b>
                  <small className="block text-xs text-muted-foreground tabular-nums">
                    {parent ? `In ${parent.name} · ` : ""}
                    {plural(r.count, noun)}
                  </small>
                </span>
                {own && (
                  <Badge variant="muted" className="rounded-full tabular-nums">
                    <i aria-hidden className={cn("size-2 rounded-full", TONE[familyOf(own)].dot)} />
                    Own rule {pct(own.pct)}
                  </Badge>
                )}
              </header>
              <div className="grid gap-1.5">{shownCells.map((c) => cellButton(c, true))}</div>
              {same.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  = Same as other brands: {same.map((c) => brandName(c.brandId)).join(", ")}
                </p>
              )}
            </article>
          );
        })}
      </div>
      )}

      {/* "Why this price" opens in a sheet on the right. Not modal, so the map
          stays usable: clicking another cell switches the sheet to it. At the
          bottom of the card the answer sat out of view and a click looked
          like it did nothing. */}
      <Sheet modal={false} open={!!focus} onOpenChange={(open) => !open && props.onFocus(null)}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto border-border bg-card shadow-soft-lg sm:max-w-md"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if ((e.target as Element | null)?.closest?.("[data-map-cell]")) e.preventDefault();
          }}
        >
          {focus && (
            <WhyThisPrice
              {...props}
              cell={model.cell(focus.categoryId, focus.brandId)}
              rowName={rowName}
              brandName={brandName}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

/** "Why this price": the ladder and the items for the clicked cell, in the sheet. */
function WhyThisPrice({
  kind,
  model,
  tiers,
  renderCellItems,
  cell: c,
  typeName,
  formatExpiry,
  rowName,
  brandName,
}: CoverageMapProps & {
  cell: CoverageCell;
  rowName: (c: string) => string;
  brandName: (b: string | null) => string;
}) {
  const parts = kind === "parts";
  const w = c.winner;
  const cat = rowName(c.categoryId);
  const where = `${cat} × ${brandName(c.brandId)}${parts ? ` × ${typeName ?? "other types"}` : ""}`;
  const who = `${parts ? (typeName ? `A ${typeName.toLowerCase()} part` : "A part of another type") : "An item"} in ${cat} from ${
    c.brandId ? brandName(c.brandId) : "a brand with no rule"
  }`;

  let sentence: React.ReactNode;
  if (!w) {
    sentence = (
      <>
        {who} sells at <b className="font-semibold">base price</b>. No rule covers it.
      </>
    );
  } else if (w.isDeal) {
    const after = ruleAfterDeal(c);
    sentence = (
      <>
        {who} sells at <b className="font-semibold">base {pct(w.pct)}</b>
        {w.expiresAt ? ` until ${formatExpiry(w.expiresAt)}` : ""}. Then{" "}
        {after ? (
          <>
            <b className="font-semibold">
              {after.label} {pct(after.pct)}
            </b>{" "}
            takes over
          </>
        ) : (
          <>
            it goes back to <b className="font-semibold">base price</b>
          </>
        )}
        .
      </>
    );
  } else {
    const inherited = !!w.categoryId && w.categoryId !== c.categoryId;
    sentence = (
      <>
        {who} sells at <b className="font-semibold">base {pct(w.pct)}</b>, from{" "}
        <b className="font-semibold">{w.label}</b>.
        {inherited ? ` ${cat} has no rule of its own, so it uses its parent's.` : ""}
      </>
    );
  }

  return (
    <>
      <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
        <SheetTitle className="text-base">Why this price</SheetTitle>
        <SheetDescription>{where}</SheetDescription>
      </SheetHeader>
      <div className="grid gap-4 px-5 pt-4 pb-6">
        <p className="text-sm tabular-nums">{sentence}</p>
        <ol className="relative grid gap-0.5 before:absolute before:top-3.5 before:bottom-3.5 before:left-[11px] before:w-[1.5px] before:bg-border">
          {tiers.map((t) => {
            const isItem = t.key === "product" || t.key === "part";
            const r = isItem ? undefined : c.candidates.find((x) => x.tier === t.key);
            const won = !!r && r === w;
            const tone = r ? TONE[familyOf(r)] : null;
            let sub: React.ReactNode;
            let rel = "";
            if (isItem) {
              sub = `Can beat this for single ${parts ? "parts" : "products"}`;
              rel = "Not on the map";
            } else if (!r) {
              sub = "No rule";
            } else {
              const fromParent = r.categoryId && r.categoryId !== c.categoryId ? `, from ${r.categoryName ?? rowName(r.categoryId)}` : "";
              sub = `${r.label} ${pct(r.pct)}${r.isDeal && r.expiresAt ? `, deal to ${formatExpiry(r.expiresAt)}` : ""}${fromParent}`;
              rel = won ? "Wins" : "Loses";
            }
            return (
              <li
                key={t.key}
                className={cn(
                  "relative grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-transparent py-[5px] pr-2",
                  won && tone?.tint,
                )}
              >
                <span aria-hidden className="z-10 grid size-6 place-items-center">
                  <span
                    className={cn(
                      "rounded-full border-[1.5px]",
                      won && tone
                        ? cn("size-[11px]", tone.dot, tone.line)
                        : cn("size-[9px] bg-card", r && tone ? tone.line : "border-dashed border-muted-foreground"),
                    )}
                  />
                </span>
                <span className={cn("min-w-0 text-sm", !r && "text-muted-foreground", won && "font-semibold")}>
                  {t.label}
                  <small
                    className={cn(
                      "block text-xs font-normal text-muted-foreground tabular-nums",
                      r && !won && "line-through",
                    )}
                  >
                    {sub}
                  </small>
                </span>
                <span
                  className={cn(
                    "text-right text-xs whitespace-nowrap text-muted-foreground",
                    won && tone && cn("font-semibold", tone.ink),
                  )}
                >
                  {rel}
                </span>
              </li>
            );
          })}
        </ol>
        {renderCellItems?.({
          categoryId: c.categoryId,
          brandId: c.brandId,
          typeId: model.typeId,
          previewPct: cellPreviewPct(w),
          winner: w,
          hasChildren: model.rows.some((r) => r.parentId === c.categoryId),
        })}
      </div>
    </>
  );
}

/**
 * One map cell. Memoised: a map holds hundreds of cells (707 in the Blessing
 * catalogue), and a click on one cell must not re-render the rest.
 */
const MapCellButton = memo(function MapCellButton({
  cell: c,
  s,
  isFocus,
  line,
  selectedPct,
  brandLabel,
  rowLabel,
  onFocus,
}: {
  cell: CoverageCell;
  s: CellState;
  isFocus: boolean;
  line: boolean;
  /** The selected rule's %, shown struck where it loses. */
  selectedPct: number | undefined;
  brandLabel: string;
  rowLabel: string;
  onFocus: (focus: MapFocus | null) => void;
}) {
    const w = c.winner;
    const lostPct =
      s === "lost" && selectedPct !== undefined ? (
        <s className="text-xs font-normal text-muted-foreground">{pct(selectedPct)}</s>
      ) : null;
    const mark =
      s === "win" ? (
        <span className={cn("text-success-ink", line ? "row-span-2" : "absolute top-[5px] right-1.5")}>
          <AppIcon icon="solar:check-circle-bold" className="size-3.5" />
        </span>
      ) : null;
    const name = line ? <span className="font-medium">{brandLabel}</span> : null;

    let look: string;
    let style: React.CSSProperties | undefined;
    let body: React.ReactNode;
    if (c.sameAsBaseline) {
      look = s === "win" ? "bg-success/13" : "border-transparent bg-transparent hover:border-border";
      body = (
        <span className="flex items-baseline gap-1.5">
          <span aria-hidden className="text-base font-medium text-muted-foreground/60">=</span>
          {lostPct}
        </span>
      );
    } else if (!w) {
      look = "border-dashed bg-card";
      style = HATCH;
      body = (
        <>
          <span className="flex items-baseline gap-1.5 font-medium text-muted-foreground">
            Base{lostPct}
          </span>
          <span className="truncate text-xs text-muted-foreground">No rule</span>
        </>
      );
    } else {
      const inherited = !!w.categoryId && w.categoryId !== c.categoryId;
      const tone = TONE[familyOf(w)];
      look = s === "win" ? "bg-success/13" : inherited ? tone.soft : tone.tint;
      let src: React.ReactNode;
      if (w.isDeal) {
        const after = ruleAfterDeal(c);
        src = `Deal${w.expiresAt ? ` · ends ${shortDate(w.expiresAt)}` : ""} · then ${
          after ? pct(after.pct) : "base"
        }`;
      } else if (inherited) {
        src = (
          <>
            <AppIcon icon="solar:arrow-up-linear" className="size-3 shrink-0" />
            From {w.categoryName ?? w.categoryId}
          </>
        );
      } else {
        src = SHORT_TIER[w.tier] ?? "";
      }
      body = (
        <>
          <span
            className={cn(
              "flex items-baseline gap-1.5 font-semibold tabular-nums",
              familyOf(w) === "all" && "font-medium",
              s === "win" ? "text-success-ink" : tone.ink,
              familyOf(w) === "all" && s !== "win" && "text-foreground",
            )}
          >
            {pct(w.pct)}
            {lostPct}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">{src}</span>
        </>
      );
    }

    const where = `${rowLabel}, ${c.brandId ? brandLabel : "other brands"}`;
    const rel = s === "win" ? ", selected rule wins" : s === "lost" ? ", selected rule loses here" : "";
    const same = c.sameAsBaseline ? ", same as other brands" : "";
    const label = w
      ? `${where}: ${pct(w.pct)} from ${w.label}${w.isDeal ? " deal" : ""}${same}${rel}`
      : `${where}: base price, no rule${same}${rel}`;

    return (
      <button
        type="button"
        data-map-cell
        aria-label={label}
        aria-pressed={isFocus}
        aria-haspopup="dialog"
        onClick={() => onFocus({ categoryId: c.categoryId, brandId: c.brandId })}
        style={style}
        className={cn(
          "relative grid w-full content-center rounded-lg border px-2.5 py-1.5 text-left text-sm transition-[background-color,border-color,opacity] hover:border-foreground/25 motion-reduce:transition-none",
          line ? "min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5" : "min-h-[54px]",
          look,
          s === "win" &&
            "-translate-y-px border-[1.5px] border-success shadow-[0_8px_20px_-8px_rgb(0_0_0/0.14)] hover:border-success dark:shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)]",
          s === "lost" && "border-[1.5px] border-dashed border-success/60",
          s === "out" && "opacity-40 hover:opacity-80",
          isFocus && "ring-2 ring-foreground/45 ring-offset-2 ring-offset-card",
        )}
      >
        {line ? (
          <>
            <span className="grid min-w-0">
              {name}
              {body}
            </span>
            {mark}
          </>
        ) : (
          <>
            {body}
            {mark}
          </>
        )}
      </button>
    );
});
