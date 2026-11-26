import type { UploaderSummary } from "../types/upload-analytics";

/**
 * Client-side sort options for the management table. The `/analytics/uploaders`
 * endpoint only sorts by today's total and offers no search, so the management
 * page slices in memory (fine for the current staff count — see the backend
 * asks doc for the pagination/sort roadmap item).
 *
 * Each label names its metric. There is no "today" sort: "Today" is a period,
 * and a sort with the same name did something else.
 */
export type UploaderSort = "total" | "target" | "name";

export const UPLOADER_SORTS: readonly { id: UploaderSort; label: string }[] = [
  { id: "total", label: "Most work in period" },
  { id: "target", label: "Furthest behind today's target" },
  { id: "name", label: "Name A–Z" },
];

export const DEFAULT_UPLOADER_SORT: UploaderSort = "total";

/** The `?sort=` value, or the default when it is missing, old (`today`) or unknown. */
export function parseUploaderSort(value: string | null): UploaderSort {
  return UPLOADER_SORTS.find((s) => s.id === value)?.id ?? DEFAULT_UPLOADER_SORT;
}

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
    case "target":
      // Furthest behind target first — the people who need attention.
      return out.sort(
        (a, b) => a.percentOfDailyTarget - b.percentOfDailyTarget,
      );
    case "name":
      return out.sort((a, b) => a.staff.name.localeCompare(b.staff.name));
    case "total":
    default:
      return out.sort((a, b) => b.totals.total - a.totals.total);
  }
}
