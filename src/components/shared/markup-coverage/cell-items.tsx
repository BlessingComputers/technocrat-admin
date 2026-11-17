"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { cellItems, type CoverageRule, type PreviewItem } from "@/lib/utils/markup-coverage";

import { plural } from "./tone";

/** What a slice needs to load the items of one clicked cell. */
export interface CellQuery {
  categoryId: string;
  brandId: string | null;
  typeId: string | null;
  /** The cell's winning %, or 1% for a gap (the preview refuses 0). */
  previewPct: number;
  winner: CoverageRule | null;
  /** The row has subcategories, which the preview walks into. */
  hasChildren: boolean;
}

/** Cap on rows drawn in the sheet; the count above still says how many. */
const MAX_ROWS = 100;

/**
 * The items a rule prices, from a preview run at `previewPct`: each with
 * base → rule price, the difference, and a flag when it sells at another
 * price now (the rule is not applied to it yet). Used for a clicked map cell
 * and for a selected rule, both in the right-hand sheet.
 */
export function CellItemsList({
  loading,
  failed,
  rows,
  previewPct,
  winner,
  hasChildren = false,
  noun,
  title = "Items here",
}: {
  loading: boolean;
  failed: boolean;
  rows: PreviewItem[] | undefined;
  previewPct: number;
  /** The rule that prices them, or null for a gap. */
  winner: CoverageRule | null;
  /** The preview walked into subcategories. */
  hasChildren?: boolean;
  /** "variant" or "part". */
  noun: string;
  title?: string;
}) {
  const head = <h5 className="text-sm font-semibold">{title}</h5>;
  if (loading) {
    return (
      <section className="grid gap-2">
        {head}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            aria-hidden
            className="size-3.5 animate-spin rounded-full border-2 border-border border-t-muted-foreground motion-reduce:animate-none"
          />
          Loading {noun}s…
        </p>
      </section>
    );
  }
  if (failed || !rows) {
    return (
      <section className="grid gap-2">
        {head}
        <p className="text-sm text-muted-foreground">No active {noun}s match this cell.</p>
      </section>
    );
  }

  const { items, covered } = cellItems(rows, previewPct, winner);
  const notApplied = items.filter((i) => i.drift).length;
  return (
    <section className="grid gap-2">
      {head}
      <p className="text-sm text-muted-foreground tabular-nums">
        <b className="font-semibold text-foreground">{plural(items.length, noun)}</b>
        {notApplied > 0 && (
          <>
            , <b className="font-semibold text-warning-ink">{notApplied}</b> not at this price yet
          </>
        )}
        .{covered > 0 ? ` ${plural(covered, "other")} in this scope use a stronger rule and are left out.` : ""}
      </p>
      {hasChildren && (
        <p className="text-xs text-muted-foreground">
          Includes items in its subcategories that use the same rule.
        </p>
      )}
      {notApplied > 0 && !winner?.isDeal && (
        <p className="text-xs text-muted-foreground">
          To bring them in line, use Preview &amp; apply on the rule.
        </p>
      )}
      {items.length > 0 && (
        <ul className="grid divide-y divide-border/60 rounded-[11px] border border-border">
          {items.slice(0, MAX_ROWS).map((i) => (
            <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-3 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium" title={i.name}>
                  {i.name}
                </span>
                {i.detail && (
                  <span className="block truncate text-xs text-muted-foreground">{i.detail}</span>
                )}
              </span>
              <span className="text-right text-sm tabular-nums">
                <span className="block font-semibold">
                  {i.rulePrice !== null ? formatPrice(i.rulePrice) : "—"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {i.base !== null ? `Base ${formatPrice(i.base)}` : "At cost floor"}
                  {i.diff ? ` · ${i.diff > 0 ? "+" : "−"}${formatPrice(Math.abs(i.diff))}` : ""}
                </span>
              </span>
              {i.drift && i.now !== null && (
                <span
                  className={cn(
                    "col-span-2 flex items-center gap-1.5 text-xs text-warning-ink tabular-nums",
                  )}
                >
                  <AppIcon icon="solar:danger-circle-linear" className="size-3.5 shrink-0" />
                  Sells at {formatPrice(i.now)} now
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {items.length > MAX_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing the first {MAX_ROWS} of {items.length}.
        </p>
      )}
    </section>
  );
}
