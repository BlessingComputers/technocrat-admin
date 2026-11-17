/**
 * The admin's mirror of the storefront's banner slots.
 *
 * **The storefront file is the source of truth**
 * (`technocrat/storefront/src/features/promotions/placements.ts`, spec
 * `docs/superpowers/specs/2026-11-09-promotion-banners-design.md` there).
 * The template sizes and the five keys are copied from it; change them there
 * first. Everything under "Admin-only additions" is derived, never retyped.
 *
 * Until 2026-11-09 this file held Blessing's thirteen slots, copied when the
 * admin was cloned. None of them rendered on the Technocrat storefront.
 *
 * The backend stores `placement` as a plain string and never validates it
 * against a key list (`CONTRACT.md` §1). This file is that list on our side.
 */

export type TemplateKey = "band" | "strip";

export type PlacementGroup = "home" | "listings";

export type PlacementKey =
  // Home page, in page order.
  | "home-after-categories"
  | "home-after-shelf"
  | "home-after-value"
  | "home-before-bike"
  // Product listings.
  | "listing-top";

export interface TemplateSpec {
  /** Desktop export size in pixels, at 1×. */
  desktop: { w: number; h: number };
  /** Mobile export size, or `null` when one file serves both breakpoints. */
  mobile: { w: number; h: number } | null;
  shape: TemplateKey;
  /** Always false on Technocrat: nothing moves on its own (home rule R6). */
  autoplay: boolean;
  /** Slides past this are dropped by the storefront. */
  maxSlides: number;
}

export const TEMPLATES: Record<TemplateKey, TemplateSpec> = {
  band: {
    desktop: { w: 2400, h: 1000 },
    mobile: { w: 1200, h: 900 },
    shape: "band",
    autoplay: false,
    maxSlides: 5,
  },
  strip: {
    desktop: { w: 2400, h: 600 },
    mobile: { w: 1200, h: 600 },
    shape: "strip",
    autoplay: false,
    maxSlides: 3,
  },
};

export interface PlacementSpec {
  /** Staff-facing copy: names the real neighbours on the page. */
  label: string;
  group: PlacementGroup;
  /** Page order within the group; drives the grouped list. */
  order: number;
  template: TemplateKey;
  aboveFold?: boolean;
  /** Slots that appear on many pages accept an optional category scope. */
  targetable?: boolean;
}

export const PLACEMENTS: Record<PlacementKey, PlacementSpec> = {
  "home-after-categories": {
    label: "Home — between Categories and the shelf",
    group: "home",
    order: 0,
    template: "band",
  },
  "home-after-shelf": {
    label: 'Home — between the shelf and "Three middlemen"',
    group: "home",
    order: 1,
    template: "band",
  },
  "home-after-value": {
    label: 'Home — between "Three middlemen" and After you pay',
    group: "home",
    order: 2,
    template: "band",
  },
  "home-before-bike": {
    label: "Home — between Procurement and the bike section",
    group: "home",
    order: 3,
    template: "band",
  },
  "listing-top": {
    label: "Product listings — above the results",
    group: "listings",
    order: 0,
    template: "strip",
    targetable: true,
  },
};

/** Backend default for rows created without a placement is "home-after-hero", which renders nowhere; the form always sends this instead. */
export const DEFAULT_PLACEMENT: PlacementKey = "home-after-categories";

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
 * consts above.                                                       *
 * ------------------------------------------------------------------ */

export const GROUP_ORDER: readonly PlacementGroup[] = ["home", "listings"];

/** Surface names for the grouped select and the grouped list headers. */
export const GROUP_LABEL: Record<PlacementGroup, string> = {
  home: "Home page",
  listings: "Product listings",
};

export const TEMPLATE_LABEL: Record<TemplateKey, string> = {
  band: "Band",
  strip: "Strip",
};

/**
 * Banner count per surface before the admin warns. Nothing is blocked. Home
 * has four slots; a listing banner shows on every listing page, so one is
 * already a lot.
 */
export const DENSITY_THRESHOLD: Record<PlacementGroup, number> = {
  home: 4,
  listings: 1,
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

/** "2400 × 1000" — a multiplication sign, not a lowercase x. */
export function formatSize(size: { w: number; h: number }): string {
  return `${size.w} × ${size.h}`;
}

/** The staff-facing export guidance for a template. */
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
