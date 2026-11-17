import type { CoverageFamily, MapFamily } from "@/lib/utils/markup-coverage";

/**
 * One colour per tier family, used for the lane dots, the % in a rule row,
 * the "beats / beaten by" dots, the chart and the map cells. DESIGN.md
 * "Markup tiers": teal = category, --scope-brand = brand (orange-red here),
 * violet = category & brand,
 * blue = running deal, navy = part type, grey = fallback. Green is NOT here:
 * on this page it means "selected" and nothing else.
 *
 * Full class strings, so Tailwind sees them.
 */
export interface Tone {
  dot: string;
  ink: string;
  /** A cell the tier wins on its own category. */
  tint: string;
  /** A cell it wins from a parent category: a weaker tint. */
  soft: string;
  /** The lane dot's halo when the lane holds the selected rule. */
  halo: string;
  /** The tier colour as a line (dashed dots, ladder nodes). */
  line: string;
}

export const TONE: Record<CoverageFamily, Tone> = {
  item: {
    dot: "bg-foreground",
    ink: "text-foreground",
    tint: "bg-foreground/10 border-foreground/30",
    soft: "bg-foreground/5 border-foreground/20",
    halo: "ring-foreground/20",
    line: "border-foreground",
  },
  categoryBrand: {
    dot: "bg-scope-combo",
    ink: "text-scope-combo-ink",
    tint: "bg-scope-combo/14 border-scope-combo/40",
    soft: "bg-scope-combo/6 border-scope-combo/28",
    halo: "ring-scope-combo/22",
    line: "border-scope-combo",
  },
  brand: {
    dot: "bg-scope-brand",
    ink: "text-scope-brand-ink",
    tint: "bg-scope-brand/14 border-scope-brand/40",
    soft: "bg-scope-brand/6 border-scope-brand/28",
    halo: "ring-scope-brand/22",
    line: "border-scope-brand",
  },
  category: {
    dot: "bg-scope-category",
    ink: "text-scope-category-ink",
    tint: "bg-scope-category/14 border-scope-category/40",
    soft: "bg-scope-category/6 border-scope-category/28",
    halo: "ring-scope-category/22",
    line: "border-scope-category",
  },
  type: {
    dot: "bg-type-tone",
    ink: "text-secondary-ink",
    tint: "bg-type-tone/14 border-type-tone/40",
    soft: "bg-type-tone/6 border-type-tone/28",
    halo: "ring-type-tone/22",
    line: "border-type-tone",
  },
  all: {
    dot: "bg-muted-foreground",
    ink: "text-muted-foreground",
    tint: "bg-background/60 border-border",
    soft: "bg-background/60 border-border",
    halo: "ring-muted-foreground/22",
    line: "border-muted-foreground",
  },
  deal: {
    dot: "bg-info",
    ink: "text-info-ink",
    tint: "bg-info/14 border-info/40",
    soft: "bg-info/6 border-info/28",
    halo: "ring-info/22",
    line: "border-info",
  },
};

/**
 * From lg up the lanes and the map sit side by side and scroll on their own:
 * each sticks to the top of the app's scrolling <main> and is capped at the
 * window height left under the topbar (4rem) and main's padding.
 */
export const SCROLL_COLUMN =
  "lg:sticky lg:top-0 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-y-contain";

/** The quiet surface behind the baseline column, the chart and the callout. */
export const PANEL = "bg-background/60";

/** Hatching for "no rule" cells and the chart's gap segment. */
export const HATCH = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in oklab, var(--muted-foreground) 12%, transparent) 6px 7px)",
} as const;

export const HATCH_DENSE = {
  backgroundImage:
    "repeating-linear-gradient(135deg, transparent 0 2px, color-mix(in oklab, var(--muted-foreground) 50%, transparent) 2px 3px)",
} as const;

export const familyTone = (f: MapFamily): Tone | null => (f === "gap" ? null : TONE[f]);

/** "+15%" / "−15%" (a real minus sign). */
export const pct = (p: number) => `${p > 0 ? "+" : "−"}${Math.abs(p)}%`;

export const plural = (n: number, word: string, many = `${word}s`) =>
  `${n.toLocaleString("en-GB")} ${n === 1 ? word : many}`;

/** "20 Nov", for badges and cell source lines. */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
