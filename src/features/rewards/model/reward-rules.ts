import { ApiError } from "@/lib/api/error";
import { formatPrice } from "@/lib/utils/format";
import type { RewardRow } from "../types/rewards";

/** Tabs on `/rewards/team`. "My rewards" is its own page (`/rewards`). */
export type TeamTab = "uploaders" | "rates";

export const TEAM_TAB_LABELS: Record<TeamTab, string> = {
  uploaders: "Uploaders",
  rates: "Rates",
};

const MONTH_RE = /^(\d{4})-(\d{2})$/;

function parseMonth(month: string): { year: number; index: number } | null {
  const m = MONTH_RE.exec(month);
  if (!m) return null;
  const index = Number(m[2]) - 1;
  if (index < 0 || index > 11) return null;
  return { year: Number(m[1]), index };
}

/** "2026-12" → "December 2026". Reward months are UTC calendar months. */
export function formatRewardMonth(month: string): string {
  const p = parseMonth(month);
  if (!p) return month;
  return new Date(Date.UTC(p.year, p.index, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The day the backend closes `month`: "1 December". December rolls to January. */
export function closesOnLabel(month: string): string {
  const p = parseMonth(month);
  if (!p) return "";
  return new Date(Date.UTC(p.year, p.index + 1, 1)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

/** "3 Dec 2026", read in UTC so a date-only value never shifts a day. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function paidOnLabel(paidAt: string): string {
  return `Paid on ${shortDate(paidAt)}`;
}

export function uploadsOf(row: Pick<RewardRow, "products" | "parts">): number {
  return row.products + row.parts;
}

export function staffName(row: {
  staff: { firstName: string; lastName: string };
}): string {
  return `${row.staff.firstName} ${row.staff.lastName}`.trim();
}

/** Adjust and Mark paid need a closed month (id set) and an unpaid row. */
export function isOpenForAction(row: Pick<RewardRow, "id" | "paidAt">): boolean {
  return row.id !== null && row.paidAt === null;
}

export function monthTotal(rows: Pick<RewardRow, "finalAmount">[]): number {
  return rows.reduce((sum, r) => sum + r.finalAmount, 0);
}

export function formatAdjustment(amount: number): string {
  return amount > 0 ? `+${formatPrice(amount)}` : formatPrice(amount);
}

/** An empty field is NaN, never 0, so it cannot pass as "no change". */
export function parseWholeNaira(input: string): number {
  const trimmed = input.trim();
  return trimmed === "" ? Number.NaN : Number(trimmed);
}

/** The dialog preview: null until the input is a whole number. */
export function previewFinalAmount(computed: number, input: string): number | null {
  const n = parseWholeNaira(input);
  return Number.isInteger(n) ? computed + n : null;
}

/** An empty list means no access: the team page shows the "No access" card. */
export function visibleTeamTabs(perms: {
  can: (name: string) => boolean;
  canAnyInGroup: (groups: string[]) => boolean;
}): TeamTab[] {
  if (!perms.canAnyInGroup(["rewards"])) return [];
  return perms.can("rewards:manage") ? ["uploaders", "rates"] : ["uploaders"];
}

/** DOM id of an uploader's row, so `?staff=<id>` can scroll it into view. */
export function rewardRowId(staffId: string): string {
  return `reward-row-${staffId}`;
}

/** 409 = another manager adjusted or paid the row first. */
export function isAlreadyPaidError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409;
}

/** Today as `YYYY-MM-DD` in the browser's time zone (Lagos for staff). */
export function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}
