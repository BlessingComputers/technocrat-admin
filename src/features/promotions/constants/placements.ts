/**
 * The admin's mirror of the storefront's placement catalog.
 *
 * **The storefront file is the source of truth**
 * (`blessingcomputers/src/features/promotions/placements.ts`). `TEMPLATES` and
 * `PLACEMENTS` below are copied from it verbatim so a diff between the two
 * files is a plain diff, not a translation. Everything under the
 * "Admin-only additions" rule below is derived from them, never retyped.
 *
 * Why a copy rather than a shared package: the two apps ship separately and
 * neither depends on the other. Keeping the two consts identical is, per plan
 * §6.1, four numbers to check rather than eleven pairs — because ratios live on
 * templates, not on slots.
 *
 * The backend stores `placement` as a plain string and never validates it
 * against a key list (`CONTRACT.md` §1). This file is that list on our side.
 */

export type TemplateKey = "hero" | "wide" | "band" | "tile";

export type PlacementGroup = "landing" | "pdp" | "catalog" | "parts";

export type PlacementKey =
  // Homepage, in page order.
  | "hero-panel"
  | "home-after-hero"
  | "home-after-brands"
  | "home-after-featured"
  | "home-after-categories"
  | "home-before-service"
  | "home-after-shelves"
  | "home-after-preowned"
  | "home-before-reviews"
  | "home-after-value"
  // Shared surfaces.
  | "pdp-below-gallery"
  | "catalog-top"
  | "parts-top";

export interface TemplateSpec {
  /** Desktop export size in pixels, at 1×. */
  desktop: { w: number; h: number };
  /** Mobile export size, or `null` when one file serves both breakpoints. */
  mobile: { w: number; h: number } | null;
  shape: TemplateKey;
  autoplay: boolean;
  /** Slides past this are dropped by the storefront. */
  maxSlides: number;
}

/**
 * Frozen by the §3.1 measuring pass (see `docs/backend-sync-execution.md`,
 * phase 5). Changing any number here is a recut of every live banner on that
 * template, not a config tweak — and it must change in the storefront file
 * first.
 *
 * `hero` replaced `panel` on 2026-08-30, when the storefront hero went full
 * bleed: the banner is now the whole top of the home page, edge to edge, with
 * the header floating over it, rather than a 5:4 box beside a headline. It is
 * the only template measured against the viewport instead of the 96rem
 * container, which is why its desktop canvas is wider than every other one and
 * its mobile canvas is the only portrait export in the set.
 *
 * **Anything uploaded to the hero before that date was cut at 1200 × 960 and
 * needs a recut.** It will not break — the storefront cover-crops it — but a
 * 5:4 file shown at 16:7 keeps roughly its middle band and loses the rest.
 */
export const TEMPLATES: Record<TemplateKey, TemplateSpec> = {
  hero: {
    desktop: { w: 2560, h: 1280 },
    mobile: { w: 1200, h: 1500 },
    shape: "hero",
    autoplay: true,
    maxSlides: 5,
  },
  wide: {
    desktop: { w: 2400, h: 1350 },
    mobile: { w: 1200, h: 900 },
    shape: "wide",
    autoplay: true,
    maxSlides: 6,
  },
  band: {
    desktop: { w: 2400, h: 1000 },
    mobile: { w: 1200, h: 900 },
    shape: "band",
    autoplay: true,
    maxSlides: 5,
  },
  tile: {
    desktop: { w: 1200, h: 1200 },
    mobile: null,
    shape: "tile",
    autoplay: false,
    maxSlides: 6,
  },
};

export interface PlacementSpec {
  /** Staff-facing copy. The same words as the Figma frame name (§2.18). */
  label: string;
  group: PlacementGroup;
  /** Page order within the group; drives the grouped list. */
  order: number;
  template: TemplateKey;
  aboveFold?: boolean;
  /** Slots that appear on many pages accept an optional category scope (§2.11). */
  targetable?: boolean;
}

export const PLACEMENTS: Record<PlacementKey, PlacementSpec> = {
  "hero-panel": {
    label: "Home — the full-width hero",
    group: "landing",
    order: 0,
    template: "hero",
    aboveFold: true,
  },
  // Under the sale band, not under the hero, since 2026-09-04. The storefront's
  // "On sale now" product section took the position directly below the hero, so
  // a banner placed here now lands one position lower than it used to. The
  // label is what staff pick from, so it has to say where the banner actually
  // goes; the key and `order` are untouched, and nothing about existing rows
  // changes.
  //
  // `aboveFold` went with the move on the storefront side, where it is the flag
  // that lets the first slide claim a priority image. Nothing in this app reads
  // it, and it is dropped here only to keep the two copies of this file
  // readable side by side.
  "home-after-hero": {
    label: 'Home — under "On sale now"',
    group: "landing",
    order: 1,
    template: "wide",
  },
  "home-after-brands": {
    label: "Home — under Shop by Brand",
    group: "landing",
    order: 2,
    template: "band",
  },
  "home-after-featured": {
    label: "Home — under Featured Selection",
    group: "landing",
    order: 3,
    template: "band",
  },
  "home-after-categories": {
    label: "Home — under Category Explorer",
    group: "landing",
    order: 4,
    template: "tile",
  },
  // The six per-category product rows are new, and they are the longest
  // unbroken stretch of the page. Two slots break it: one before the Service
  // Centre that splits them, one under the last row.
  "home-before-service": {
    label: "Home — above the Service Centre",
    group: "landing",
    order: 5,
    template: "band",
  },
  "home-after-shelves": {
    label: "Home — under the category rows",
    group: "landing",
    order: 6,
    template: "band",
  },
  "home-after-preowned": {
    label: "Home — under Pre-owned",
    group: "landing",
    order: 7,
    template: "band",
  },
  "home-before-reviews": {
    label: "Home — above Customer Reviews",
    group: "landing",
    order: 8,
    template: "band",
  },
  // Last on the page, not third. The assurances band moved to the foot when
  // the home page was rebuilt around product, and this slot followed it — the
  // label still names the right neighbour, but `order` is what puts it at the
  // bottom of the admin's page-ordered list, where staff will now look for it.
  "home-after-value": {
    label: 'Home — under "Why Blessing"',
    group: "landing",
    order: 9,
    template: "band",
  },
  "pdp-below-gallery": {
    label: "Product page — under the gallery",
    group: "pdp",
    order: 0,
    template: "band",
    targetable: true,
  },
  "catalog-top": {
    label: "Catalog listing — above results",
    group: "catalog",
    order: 0,
    template: "band",
    targetable: true,
  },
  "parts-top": {
    label: "Parts catalog — top of page",
    group: "parts",
    order: 0,
    template: "band",
    targetable: true,
  },
};

/** Backend default for rows created before placements existed (§7). */
export const DEFAULT_PLACEMENT: PlacementKey = "home-after-hero";

export const PLACEMENT_KEYS = Object.keys(PLACEMENTS) as PlacementKey[];

export function isPlacementKey(
  value: string | null | undefined,
): value is PlacementKey {
  return (
    typeof value === "string" && (PLACEMENT_KEYS as string[]).includes(value)
  );
}

/* ------------------------------------------------------------------ *
 * Admin-only additions. Everything below is derived from the two      *
 * consts above and has no counterpart in the storefront file, so a    *
 * diff between the two files stops here.                              *
 * ------------------------------------------------------------------ */

export const GROUP_ORDER: readonly PlacementGroup[] = [
  "landing",
  "pdp",
  "catalog",
  "parts",
];

/** Surface names for the grouped select and the grouped list headers. */
export const GROUP_LABEL: Record<PlacementGroup, string> = {
  landing: "Landing page",
  pdp: "Product page",
  catalog: "Catalog",
  parts: "Parts",
};

/** The four template words, capitalised. Same vocabulary as Figma (§2.18). */
export const TEMPLATE_LABEL: Record<TemplateKey, string> = {
  hero: "Hero",
  wide: "Wide",
  band: "Band",
  tile: "Tile",
};

/**
 * Recommended banner count per surface before the admin warns (§2.17). Nothing
 * is blocked or hidden — this only names the cost. The plan's number for the
 * homepage is 3; a shared surface renders on hundreds of pages, so one banner
 * there is already a lot.
 */
export const DENSITY_THRESHOLD: Record<PlacementGroup, number> = {
  landing: 3,
  pdp: 1,
  catalog: 1,
  parts: 1,
};

/** Placements of one surface, already in page order. */
export const PLACEMENTS_BY_GROUP: Record<
  PlacementGroup,
  readonly PlacementKey[]
> = GROUP_ORDER.reduce(
  (acc, group) => {
    acc[group] = PLACEMENT_KEYS.filter((k) => PLACEMENTS[k].group === group).sort(
      (a, b) => PLACEMENTS[a].order - PLACEMENTS[b].order,
    );
    return acc;
  },
  {} as Record<PlacementGroup, PlacementKey[]>,
);

/** Every placement in one flat list: surface by surface, page order within. */
export const PLACEMENTS_IN_PAGE_ORDER: readonly PlacementKey[] =
  GROUP_ORDER.flatMap((group) => PLACEMENTS_BY_GROUP[group]);

/** "2400 × 1350" — a multiplication sign, not a lowercase x. */
export function formatSize(size: { w: number; h: number }): string {
  return `${size.w} × ${size.h}`;
}

/**
 * The staff-facing export guidance for a template. Two files for every
 * template but `tile`, which is square at both breakpoints and takes one
 * (§2.8).
 */
export function exportGuidance(template: TemplateKey): {
  desktop: string;
  mobile: string | null;
} {
  const spec = TEMPLATES[template];
  return {
    desktop: formatSize(spec.desktop),
    mobile: spec.mobile ? formatSize(spec.mobile) : null,
  };
}

/** Whether this template's slides take a second, mobile-specific file. */
export function takesMobileFile(template: TemplateKey): boolean {
  return TEMPLATES[template].mobile !== null;
}

export function aspectRatio(size: { w: number; h: number }): number {
  return size.w / size.h;
}

/** What a placement value the storefront no longer knows is grouped under. */
export const UNPLACED_LABEL = "Unplaced";

export function placementLabel(placement: string | null | undefined): string {
  return isPlacementKey(placement)
    ? PLACEMENTS[placement].label
    : UNPLACED_LABEL;
}

/**
 * The template a promotion's art must match, or `null` when its placement key
 * is unknown — an unplaced banner has no template to size against.
 */
export function templateFor(
  placement: string | null | undefined,
): TemplateKey | null {
  return isPlacementKey(placement) ? PLACEMENTS[placement].template : null;
}
