import { describe, expect, it } from "vitest";
import { filterSortUploaders, parseUploaderSort } from "./filter-sort-uploaders";
import type { UploaderSummary } from "../types/upload-analytics";

function uploader(name: string, total: number, percent: number): UploaderSummary {
  return {
    staff: { id: name, name, staffId: `STF-${name}` },
    totals: { total },
    percentOfDailyTarget: percent,
  } as unknown as UploaderSummary;
}

const list = [uploader("Bola", 5, 80), uploader("Ada", 12, 20), uploader("Chi", 9, 150)];
const names = (out: UploaderSummary[]) => out.map((u) => u.staff.name);

describe("filterSortUploaders", () => {
  it("sorts by period total, most first", () => {
    expect(names(filterSortUploaders(list, "", "total"))).toEqual(["Ada", "Chi", "Bola"]);
  });

  it("sorts furthest behind today's target first", () => {
    expect(names(filterSortUploaders(list, "", "target"))).toEqual(["Ada", "Bola", "Chi"]);
  });

  it("sorts by name", () => {
    expect(names(filterSortUploaders(list, "", "name"))).toEqual(["Ada", "Bola", "Chi"]);
  });

  it("filters by name or staff id", () => {
    expect(names(filterSortUploaders(list, "stf-chi", "total"))).toEqual(["Chi"]);
  });
});

describe("parseUploaderSort", () => {
  it("keeps a known sort", () => {
    expect(parseUploaderSort("name")).toBe("name");
  });

  it("falls back to the period total for the removed today sort and junk", () => {
    expect(parseUploaderSort("today")).toBe("total");
    expect(parseUploaderSort(null)).toBe("total");
  });
});
