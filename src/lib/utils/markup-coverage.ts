// Coverage map maths for /pricing/markup (ask 41, part 2).
//
// The map answers "what does an item in this category and brand sell at, and
// which rule decides it". It mirrors the backend's in-memory pickers, which it
// MUST stay in step with:
//   products: modules/products/application/markupRuleSet.ts (pickProductRule)
//   parts:    modules/parts/application/partMarkupRuleSet.ts (pickPartRule)
// Same tier order, same category walk-up (self + up to 5 ancestors), and the
// same "first rule per scope wins" over rules loaded oldest first.
//
// Deals are negative rules on their own scope in the SAME tiers, so a deal can
// lose to a stronger markup. One-item rules carry no category or brand, so
// they have no cell: the page lists them in their lane only.
//
// Each slice maps its own rule type into `CoverageRule` (this file may not
// import features).

export type CoverageKind = "products" | "parts";

/** A rule in the shape the map needs. */
export interface CoverageRule {
  /** DB id: what path params and previews take. */
  id: string;
  /** Human reference, e.g. MKP-0049. */
  ruleId: string;
  /** Scope label, e.g. "Apple · Phones". */
  label: string;
  /** The slice's resolver tier key (its `tierOf`). */
  tier: string;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  /** Part type. Always null for products. */
  typeId: string | null;
  typeName: string | null;
  /** Exact product or part. */
  itemId: string | null;
  pct: number;
  /** A negative rule: a deal, hunt or flash sale (managed on /pricing/deals). */
  isDeal: boolean;
  dealId: string | null;
  /** Second line of a lane row: the deal name, or what the rule applies to. */
  meta: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string | null;
}

/** One map row: a category. */
export interface CoverageRow {
  id: string;
  name: string;
  parentId: string | null;
  /** Products or parts in it, from the category tree. */
  count: number;
}

/** Same depth as the backend's categoryChain: self + up to 5 ancestors. */
export const MAX_ANCESTORS = 5;

// ── Colour families ───────────────────────────────────────────────────

/** A tier family shares one colour; parts fold the "+ type" tiers in. */
export type CoverageFamily =
  | "item"
  | "categoryBrand"
  | "brand"
  | "category"
  | "type"
  | "all"
  | "deal";

/** What can win a cell, plus "no rule". */
export type MapFamily = Exclude<CoverageFamily, "item"> | "gap";

const TIER_FAMILY: Record<string, CoverageFamily> = {
  product: "item",
  part: "item",
  categoryBrandType: "categoryBrand",
  categoryBrand: "categoryBrand",
  brandType: "brand",
  brand: "brand",
  categoryType: "category",
  category: "category",
  type: "type",
  all: "all",
};

export const tierFamily = (tier: string): CoverageFamily => TIER_FAMILY[tier] ?? "all";

export const familyOf = (rule: Pick<CoverageRule, "isDeal" | "tier">): CoverageFamily =>
  rule.isDeal ? "deal" : tierFamily(rule.tier);

/** The chart key's reading order: broad tiers, narrower ones, then the rest. */
export const FAMILY_ORDER: readonly MapFamily[] = [
  "category",
  "brand",
  "categoryBrand",
  "deal",
  "type",
  "all",
  "gap",
];

// ── Live rules and the index ──────────────────────────────────────────

/**
 * Prices something right now. A passed expiry does not clear `isActive` until
 * the backend's sweep runs, so the expiry is the real signal.
 */
export function isLive(
  rule: Pick<CoverageRule, "isActive" | "expiresAt">,
  now: number,
): boolean {
  if (!rule.isActive) return false;
  if (!rule.expiresAt) return true;
  const at = new Date(rule.expiresAt).getTime();
  return Number.isNaN(at) || at > now;
}

const scopeKey = (c: string | null, b: string | null, t: string | null) =>
  `${c ?? "-"}:${b ?? "-"}:${t ?? "-"}`;

export const cellKey = (categoryId: string, brandId: string | null) =>
  `${categoryId}|${brandId ?? ""}`;

/** Live scope rules by scope, first (oldest) per scope, as the backend keeps them. */
export function buildIndex(
  rules: readonly CoverageRule[],
  { now, withDeals }: { now: number; withDeals: boolean },
): Map<string, CoverageRule> {
  const live = rules
    .filter((r) => !r.itemId && isLive(r, now) && (withDeals || !r.isDeal))
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const index = new Map<string, CoverageRule>();
  for (const r of live) {
    const k = scopeKey(r.categoryId, r.brandId, r.typeId);
    if (!index.has(k)) index.set(k, r);
  }
  return index;
}

/** The category and its ancestors, nearest first, capped like the backend. */
export function categoryChain(
  parents: ReadonlyMap<string, string | null>,
  categoryId: string | null,
): string[] {
  if (!categoryId) return [];
  const chain = [categoryId];
  let current = categoryId;
  for (let i = 0; i < MAX_ANCESTORS; i++) {
    const parent = parents.get(current);
    if (!parent) break;
    chain.push(parent);
    current = parent;
  }
  return chain;
}

/**
 * Every rule that matches the cell, strongest first, in the backend's tier
 * order. The first one wins; the rest are what it beats.
 */
export function candidates(
  index: ReadonlyMap<string, CoverageRule>,
  parents: ReadonlyMap<string, string | null>,
  kind: CoverageKind,
  categoryId: string | null,
  brandId: string | null,
  typeId: string | null,
): CoverageRule[] {
  const chain = categoryChain(parents, categoryId);
  const out: CoverageRule[] = [];
  const hit = (c: string | null, b: string | null, t: string | null) => {
    const r = index.get(scopeKey(c, b, t));
    if (r) out.push(r);
  };
  const b = brandId;
  if (kind === "products") {
    if (b) {
      chain.forEach((c) => hit(c, b, null)); // category + brand
      hit(null, b, null); // brand
    }
    chain.forEach((c) => hit(c, null, null)); // category
    hit(null, null, null); // all products
    return out;
  }
  const t = typeId;
  if (t && b) chain.forEach((c) => hit(c, b, t)); // category + brand + type
  if (b) chain.forEach((c) => hit(c, b, null)); // category + brand
  if (t && b) hit(null, b, t); // brand + type
  if (t) chain.forEach((c) => hit(c, null, t)); // category + type
  if (b) hit(null, b, null); // brand
  chain.forEach((c) => hit(c, null, null)); // category
  if (t) hit(null, null, t); // type
  hit(null, null, null); // all parts
  return out;
}

// ── The map ───────────────────────────────────────────────────────────

export interface CoverageCell {
  categoryId: string;
  /** null = the "Other brands" baseline column. */
  brandId: string | null;
  candidates: CoverageRule[];
  winner: CoverageRule | null;
  /** A brand cell won by the same rule (or no rule) as the baseline in its row. */
  sameAsBaseline: boolean;
}

export interface CoverageModel {
  kind: CoverageKind;
  typeId: string | null;
  rows: CoverageRow[];
  parents: Map<string, string | null>;
  index: Map<string, CoverageRule>;
  /** Brands a live rule names, by name. */
  brands: { id: string; name: string }[];
  /** "Other brands" (null) first, then each brand. */
  columns: (string | null)[];
  /** The store-wide markup, when there is one. */
  fallback: CoverageRule | null;
  cell: (categoryId: string, brandId: string | null) => CoverageCell;
}

export function buildCoverage({
  kind,
  rules,
  rows,
  typeId = null,
  withDeals,
  now,
}: {
  kind: CoverageKind;
  rules: readonly CoverageRule[];
  rows: CoverageRow[];
  typeId?: string | null;
  withDeals: boolean;
  now: number;
}): CoverageModel {
  const index = buildIndex(rules, { now, withDeals });
  const parents = new Map(rows.map((r) => [r.id, r.parentId]));
  const t = kind === "parts" ? typeId : null;

  const brandNames = new Map<string, string>();
  for (const r of index.values()) {
    if (r.brandId) brandNames.set(r.brandId, r.brandName ?? r.brandId);
  }
  const brands = [...brandNames]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cache = new Map<string, CoverageCell>();
  const winnerAt = (c: string, b: string | null) =>
    candidates(index, parents, kind, c, b, t)[0] ?? null;
  const cell = (categoryId: string, brandId: string | null): CoverageCell => {
    const k = cellKey(categoryId, brandId);
    const hit = cache.get(k);
    if (hit) return hit;
    const cands = candidates(index, parents, kind, categoryId, brandId, t);
    const winner = cands[0] ?? null;
    const made: CoverageCell = {
      categoryId,
      brandId,
      candidates: cands,
      winner,
      sameAsBaseline: brandId !== null && winner === winnerAt(categoryId, null),
    };
    cache.set(k, made);
    return made;
  };

  const all = index.get(scopeKey(null, null, null));
  return {
    kind,
    typeId: t,
    rows,
    parents,
    index,
    brands,
    columns: [null, ...brands.map((b) => b.id)],
    fallback: all && !all.isDeal ? all : null,
    cell,
  };
}

/** The category's own rule (no brand, no type), for the row header. */
export const ownCategoryRule = (model: CoverageModel, categoryId: string): CoverageRule | null =>
  model.index.get(scopeKey(categoryId, null, null)) ?? null;

/** Every cell of the map, over all rows and columns (no filters). */
export function allCells(model: CoverageModel): CoverageCell[] {
  return model.rows.flatMap((r) => model.columns.map((b) => model.cell(r.id, b)));
}

export const countGaps = (model: CoverageModel): number =>
  allCells(model).filter((c) => !c.winner).length;

/**
 * What takes over a deal cell when the deal ends: the next markup in the
 * cell, or null for base price. Undefined when no deal wins the cell.
 */
export function ruleAfterDeal(cell: CoverageCell): CoverageRule | null | undefined {
  if (!cell.winner?.isDeal) return undefined;
  return cell.candidates.slice(1).find((r) => !r.isDeal) ?? null;
}

/** Cells per winning colour, in the chart key's order, zeros left out. */
export function familyCounts(model: CoverageModel): { family: MapFamily; count: number }[] {
  const counts = new Map<MapFamily, number>();
  for (const c of allCells(model)) {
    const f: MapFamily = c.winner ? (familyOf(c.winner) as MapFamily) : "gap";
    counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  return FAMILY_ORDER.filter((f) => counts.get(f)).map((family) => ({
    family,
    count: counts.get(family)!,
  }));
}

// ── The selected rule ─────────────────────────────────────────────────

export interface RuleAnalysis {
  /** Cell keys where it wins. */
  wins: Set<string>;
  /** Cell keys in its scope where another rule wins. */
  lost: Set<string>;
  /** Rules it beats, with the number of cells, most first. */
  beats: [CoverageRule, number][];
  /** Rules that beat it, with the number of cells, most first. */
  beatenBy: [CoverageRule, number][];
}

/** Where a rule wins and loses over the whole map (this part type). */
export function analyzeRule(model: CoverageModel, ruleId: string): RuleAnalysis {
  const wins = new Set<string>();
  const lost = new Set<string>();
  const beats = new Map<CoverageRule, number>();
  const beatenBy = new Map<CoverageRule, number>();
  const bump = (m: Map<CoverageRule, number>, r: CoverageRule) => m.set(r, (m.get(r) ?? 0) + 1);
  for (const c of allCells(model)) {
    const i = c.candidates.findIndex((r) => r.id === ruleId);
    if (i < 0) continue;
    const k = cellKey(c.categoryId, c.brandId);
    if (i === 0) {
      wins.add(k);
      c.candidates.slice(1).forEach((r) => bump(beats, r));
    } else {
      lost.add(k);
      bump(beatenBy, c.candidates[0]);
    }
  }
  const sorted = (m: Map<CoverageRule, number>) => [...m].sort((a, b) => b[1] - a[1]);
  return { wins, lost, beats: sorted(beats), beatenBy: sorted(beatenBy) };
}

// ── Search and filters ────────────────────────────────────────────────

export interface MapView {
  rows: CoverageRow[];
  columns: (string | null)[];
  /** Brand columns kept by the search; 0 = no brand matched. */
  brandHits: number;
}

/**
 * The rows and columns to draw. A brand match keeps the baseline column and
 * every row, so you see that brand across the store. A category match (and no
 * brand match) keeps those categories, their parents and their children.
 */
export function filterMap(
  model: CoverageModel,
  { query, gapsOnly }: { query: string; gapsOnly: boolean },
): MapView {
  const q = query.trim().toLowerCase();
  const brandHits = q ? model.brands.filter((b) => b.name.toLowerCase().includes(q)) : [];
  const columns = brandHits.length ? [null, ...brandHits.map((b) => b.id)] : model.columns;
  let rows = model.rows;
  const catHits = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : [];
  if (catHits.length && !brandHits.length) {
    const keep = new Set(catHits.flatMap((c) => categoryChain(model.parents, c.id)));
    for (const c of catHits) for (const r of rows) if (r.parentId === c.id) keep.add(r.id);
    rows = rows.filter((r) => keep.has(r.id));
  }
  if (gapsOnly) {
    rows = rows.filter((r) => columns.some((b) => !model.cell(r.id, b).winner));
  }
  return { rows, columns, brandHits: brandHits.length };
}

/** The lanes' rules: status, the deals toggle and the search on the scope label. */
export function filterRules(
  rules: readonly CoverageRule[],
  { query, activeOnly, withDeals }: { query: string; activeOnly: boolean; withDeals: boolean },
): CoverageRule[] {
  const q = query.trim().toLowerCase();
  return rules.filter(
    (r) =>
      (!activeOnly || r.isActive) &&
      (withDeals || !r.isDeal) &&
      (!q || r.label.toLowerCase().includes(q)),
  );
}

/** Rules in one lane: on before off, markups before deals, else as given. */
export function laneOrder(rules: CoverageRule[]): CoverageRule[] {
  return [...rules].sort(
    (a, b) => Number(b.isActive) - Number(a.isActive) || Number(a.isDeal) - Number(b.isDeal),
  );
}

/** Part types a live rule names, with the number of such rules. */
export function ruledTypes(
  rules: readonly CoverageRule[],
  now: number,
): { id: string; name: string; count: number }[] {
  const out = new Map<string, { id: string; name: string; count: number }>();
  for (const r of rules) {
    if (!r.typeId || !isLive(r, now)) continue;
    const t = out.get(r.typeId) ?? { id: r.typeId, name: r.typeName ?? r.typeId, count: 0 };
    t.count += 1;
    out.set(r.typeId, t);
  }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The category tree (roots with `children`, as `GET /products/categories`
 * sends it) as map rows: each root, then its children.
 */
export function flattenCategoryTree<T extends { id: string; name: string; children?: unknown }>(
  roots: readonly T[],
  count: (category: T) => number,
): CoverageRow[] {
  const rows: CoverageRow[] = [];
  const walk = (list: readonly T[], parentId: string | null, depth: number) => {
    for (const c of list) {
      rows.push({ id: c.id, name: c.name, parentId, count: count(c) });
      const kids = Array.isArray(c.children)
        ? (c.children as unknown[]).filter((k): k is T => typeof k === "object" && k !== null)
        : [];
      if (kids.length && depth < MAX_ANCESTORS) walk(kids, c.id, depth + 1);
    }
  };
  walk(roots, null, 0);
  return rows;
}
