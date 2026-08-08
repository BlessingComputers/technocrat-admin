import type { UploaderSummary } from "../types/upload-analytics";

/**
 * Client-side sort options for the management table. The `/analytics/uploaders`
 * endpoint only sorts by today's total and offers no search, so the management
 * page slices in memory (fine for the current staff count — see the backend
 * asks doc for the pagination/sort roadmap item).
 */
export type UploaderSort = "today" | "total" | "target" | "name";

export function filterSortUploaders(
  list: UploaderSummary[],
  search: string,
  sort: UploaderSort,
): UploaderSummary[] {
  const q = search.trim().toLowerCase();
  const out = q
    ? list.filter(
        (u) =>
          u.staff.name.toLowerCase().includes(q) ||
          u.staff.staffId.toLowerCase().includes(q),
      )
    : [...list];

  switch (sort) {
    case "total":
      return out.sort((a, b) => b.totals.total - a.totals.total);
    case "target":
      // Furthest behind target first — the people who need attention.
      return out.sort(
        (a, b) => a.percentOfDailyTarget - b.percentOfDailyTarget,
      );
    case "name":
      return out.sort((a, b) => a.staff.name.localeCompare(b.staff.name));
    case "today":
    default:
      return out.sort((a, b) => b.todayStat.total - a.todayStat.total);
  }
}
