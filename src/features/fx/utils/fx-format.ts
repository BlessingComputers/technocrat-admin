import type { FxAppliesTo, FxCategoryNode, FxLog, FxStandingLink } from "../types/fx";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

/** Prisma Decimals arrive as strings; anything unreadable is null. */
export function toNum(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** "₦1,550.25", or "—" when there is no rate. */
export function formatRate(value: number | string | null | undefined): string {
  const n = toNum(value);
  if (n == null) return "—";
  return `₦${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "+2.10%", "-0.50%", or "—". */
export function formatChange(value: number | string | null | undefined): string {
  const n = toNum(value);
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const STATUS: Record<string, { label: string; tone: Tone }> = {
  QUEUED: { label: "Queued", tone: "info" },
  PENDING_APPROVAL: { label: "Waiting for approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "info" },
  APPLYING: { label: "Applying", tone: "info" },
  APPLIED: { label: "Applied", tone: "success" },
  INITIALIZED: { label: "Set up", tone: "success" },
  SKIPPED: { label: "Skipped", tone: "muted" },
  HELD: { label: "Held", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "muted" },
  SUPERSEDED: { label: "Replaced", tone: "muted" },
  FAILED: { label: "Failed", tone: "danger" },
  // A scheduled check while auto-update is off: nothing was repriced.
  RECORDED: { label: "Recorded only", tone: "info" },
};

export function statusMeta(status: string): { label: string; tone: Tone } {
  return STATUS[status] ?? { label: status, tone: "muted" };
}

const WOULD_DO: Record<string, string> = {
  INITIALIZE: "set up dollar anchors",
  APPLY: "reprice linked items",
  SKIPPED: "skip",
  PENDING_APPROVAL: "wait for approval",
};

/**
 * The one line under a log row. A `RECORDED` row says what the rules would
 * have done; a failure shows its error; anything else shows its reason.
 */
export function logDetail(log: FxLog): string | null {
  const reason = typeof log.summary?.reason === "string" ? log.summary.reason : null;
  if (log.status === "RECORDED") {
    const head = "Auto-update is off, so nothing changed.";
    // The backend reason already says what would have happened; `wouldDo`
    // is only the fallback when a row has no reason.
    if (reason) return `${head} ${capitalise(reason)}.`;
    const would = log.summary?.wouldDo;
    const what = typeof would === "string" ? (WOULD_DO[would] ?? would) : null;
    return what ? `${head} It would ${what}.` : head;
  }
  if (log.status === "FAILED" && log.errorMessage) return log.errorMessage;
  return reason ? `${capitalise(reason)}.` : null;
}

function capitalise(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export const APPLIES_TO_LABELS: Record<FxAppliesTo, string> = {
  ALL: "Products and parts",
  PRODUCTS: "Products only",
  PARTS: "Parts only",
};

/** "Laptops + HP", "All of HP", "Laptops". A deleted name shows as such. */
export function scopeLabel(link: Pick<FxStandingLink, "categories" | "brands">): string {
  const cats = link.categories.map((c) => c.name ?? "Deleted category").join(", ");
  const brands = link.brands.map((b) => b.name ?? "Deleted brand").join(", ");
  if (cats && brands) return `${cats} + ${brands}`;
  return cats || brands || "No scope";
}

/**
 * The category tree as picker rows, each root followed by its children. The
 * backend links a category's subcategories too, so a root covers its subtree.
 */
export function flattenCategories(
  roots: readonly FxCategoryNode[],
): Array<{ id: string; name: string; depth: number }> {
  const rows: Array<{ id: string; name: string; depth: number }> = [];
  const walk = (list: readonly FxCategoryNode[], depth: number) => {
    for (const c of list) {
      rows.push({ id: c.id, name: c.name, depth });
      if (c.children?.length && depth < 3) walk(c.children, depth + 1);
    }
  };
  walk(roots, 0);
  return rows;
}

/** Whole-number share, "0%" for an empty catalogue. */
export function coveragePercent(linked: number, total: number): number {
  return total > 0 ? Math.round((linked / total) * 100) : 0;
}
