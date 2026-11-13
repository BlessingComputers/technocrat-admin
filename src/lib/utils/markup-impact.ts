/**
 * Pure helpers behind the markup rule dialog's "Where it sits" ladder and its
 * live Impact ledger. Products and parts share them; each slice maps its own
 * rules and preview rows onto these shapes (features may not import each
 * other, so the shared logic lives here).
 */

// ── Impact ledger ─────────────────────────────────────────────────────

/** One preview row, normalised across products (variants) and parts. */
export interface ImpactRow {
  id: string;
  name: string;
  /** Variant name or part number; `undefined` when there is nothing to add. */
  detail?: string;
  /** Price today. Parts can have none. */
  current: number | null;
  /** Price under the previewed rule, if this rule wins the item. */
  projected: number | null;
  /** A more specific rule prices this item, so the rule leaves it alone. */
  covered: boolean;
}

/**
 * What the save does to one row.
 *
 * - `up` / `down`: the price moves.
 * - `same`: this rule wins the item, but the price is already right.
 * - `kept`: another rule keeps the item, so its price does not move.
 *
 * With `replace` on, a covered row is NOT kept: the rule that covers it is
 * one of the markups being turned off, so the item moves to this rule. (The
 * preview does not say which rule covers a row. A deal-covered row reads the
 * same as a markup-covered one, so this over-counts by the deal items.)
 */
export type ImpactKind = "up" | "down" | "same" | "kept";

export function impactKind(row: ImpactRow, replace: boolean): ImpactKind {
  if (row.covered && !replace) return "kept";
  if (row.projected == null) return "same";
  if (row.current == null) return "up";
  if (row.projected > row.current) return "up";
  if (row.projected < row.current) return "down";
  return "same";
}

/** Signed price change for a row that moves, else `null`. */
export function impactDelta(row: ImpactRow, replace: boolean): number | null {
  const kind = impactKind(row, replace);
  if (kind !== "up" && kind !== "down") return null;
  if (row.current == null || row.projected == null) return null;
  return row.projected - row.current;
}

export interface ImpactSummary {
  total: number;
  up: number;
  down: number;
  same: number;
  kept: number;
  /** Rows that change hands because a covering rule turns off (replace on). */
  takenOver: number;
  /** Mean rise over the `up` rows that had a price, rounded to ₦1. */
  avgUp: number;
  /** Mean fall (a positive number) over the `down` rows, rounded to ₦1. */
  avgDown: number;
}

export function summarizeImpact(
  rows: ImpactRow[],
  replace: boolean,
): ImpactSummary {
  const s = { total: rows.length, up: 0, down: 0, same: 0, kept: 0, takenOver: 0 };
  let upSum = 0;
  let upPriced = 0;
  let downSum = 0;
  for (const row of rows) {
    const kind = impactKind(row, replace);
    s[kind] += 1;
    if (replace && row.covered) s.takenOver += 1;
    const delta = impactDelta(row, replace);
    if (delta == null) continue;
    if (delta > 0) {
      upSum += delta;
      upPriced += 1;
    } else {
      downSum -= delta;
    }
  }
  return {
    ...s,
    avgUp: upPriced ? Math.round(upSum / upPriced) : 0,
    avgDown: s.down ? Math.round(downSum / s.down) : 0,
  };
}

const KIND_ORDER: Record<ImpactKind, number> = { up: 0, down: 0, same: 1, kept: 2 };

/**
 * Ledger order: rows whose price moves first, then unchanged, then kept by
 * another rule. Stable inside each group, so the server's name order holds.
 */
export function sortImpactRows(rows: ImpactRow[], replace: boolean): ImpactRow[] {
  return rows
    .map((row, i) => ({ row, i, rank: KIND_ORDER[impactKind(row, replace)] }))
    .sort((a, b) => a.rank - b.rank || a.i - b.i)
    .map((x) => x.row);
}

const count = (n: number) => n.toLocaleString("en-NG");

/**
 * The Impact summary as three pieces: a bold lead, the rest of the sentence,
 * and a muted sub-line (or `null`). `noun` is plural ("variants", "parts");
 * `one` is its singular.
 */
export function impactSentence(
  s: ImpactSummary,
  noun: { one: string; many: string },
  formatMoney: (n: number) => string,
  replace: boolean,
): { lead: string; rest: string; sub: string | null } {
  const n = (k: number) => `${count(k)} ${k === 1 ? noun.one : noun.many}`;
  const moving = s.up + s.down;
  const subs: string[] = [];
  if (replace && s.takenOver > 0) {
    subs.push(`${count(s.takenOver)} of them ${s.takenOver === 1 ? "is" : "are"} priced by a rule you turn off.`);
  }
  if (s.kept > 0) subs.push(`${count(s.kept)} keep${s.kept === 1 ? "s" : ""} another rule.`);
  if (s.same > 0) subs.push(`${count(s.same)} already sell${s.same === 1 ? "s" : ""} at this price.`);
  const sub = subs.length ? subs.join(" ") : null;

  if (moving === 0) return { lead: "No prices change.", rest: "", sub };
  if (s.down === 0) {
    return {
      lead: n(s.up),
      rest: ` go${s.up === 1 ? "es" : ""} up${s.avgUp ? `, by ${formatMoney(s.avgUp)} on average` : ""}.`,
      sub,
    };
  }
  if (s.up === 0) {
    return {
      lead: n(s.down),
      rest: ` go${s.down === 1 ? "es" : ""} down, by ${formatMoney(s.avgDown)} on average.`,
      sub,
    };
  }
  return {
    lead: n(moving),
    rest: ` change price: ${count(s.up)} go up, ${count(s.down)} go down.`,
    sub,
  };
}

/** The footer's one-line impact on a phone, e.g. "148 go up · 23 keep another rule". */
export function impactShort(s: ImpactSummary): string[] {
  const out: string[] = [];
  if (s.up) out.push(`${count(s.up)} go up`);
  if (s.down) out.push(`${count(s.down)} go down`);
  if (s.kept) out.push(`${count(s.kept)} keep another rule`);
  if (!out.length) out.push("No prices change");
  return out;
}

// ── Priority ladder ───────────────────────────────────────────────────

export interface LadderTier<K extends string = string> {
  key: K;
  /** e.g. "Category & brand". */
  label: string;
}

/** An active markup, reduced to what the ladder prints. */
export interface LadderRule<K extends string = string> {
  tier: K;
  /** Scope label, e.g. "Apple" or "Phones · Apple". */
  label: string;
  percentage: number;
}

export interface LadderRow<K extends string = string> {
  key: K;
  label: string;
  /** Where this tier sits against the rule in the dialog. */
  relation: "above" | "self" | "below";
  /** Active markups at this tier, the rule itself left out. */
  activeCount: number;
  /** With replace on: the rules at this tier that turn off. */
  turnsOff: LadderRule<K>[];
}

/**
 * The ladder, strongest tier first.
 *
 * `rules` must already exclude the rule being edited. With `replace` on, every
 * rule above is listed under `turnsOff` (the dialog only offers replace on the
 * lowest tier, so "above" is "every other markup").
 */
export function ladderRows<K extends string>(
  tiers: readonly LadderTier<K>[],
  selfTier: K,
  rules: LadderRule<K>[],
  replace: boolean,
): LadderRow<K>[] {
  const selfIndex = tiers.findIndex((t) => t.key === selfTier);
  return tiers.map((tier, i) => {
    const here = rules.filter((r) => r.tier === tier.key);
    const relation = i < selfIndex ? "above" : i === selfIndex ? "self" : "below";
    return {
      key: tier.key,
      label: tier.label,
      relation,
      activeCount: here.length,
      turnsOff: replace && relation === "above" ? here : [],
    };
  });
}

/**
 * Fold a long ladder (parts has 9 tiers) to the rule's own tier, one either
 * side, and any tier with rules that turn off. `hidden` is how many rows the
 * fold dropped; 0 means there is nothing to expand.
 */
export function foldLadder<K extends string>(
  rows: LadderRow<K>[],
  expanded: boolean,
): { visible: LadderRow<K>[]; hidden: number } {
  if (expanded) return { visible: rows, hidden: 0 };
  const self = rows.findIndex((r) => r.relation === "self");
  const visible = rows.filter(
    (r, i) => Math.abs(i - self) <= 1 || r.turnsOff.length > 0,
  );
  return { visible, hidden: rows.length - visible.length };
}
