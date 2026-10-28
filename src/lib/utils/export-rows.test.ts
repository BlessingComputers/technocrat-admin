import { describe, expect, it } from "vitest";
import { toCsv, type ExportColumn } from "./export-rows";

type Row = { name: string; spent: number; verified: boolean; joined: Date | null };

const columns: ExportColumn<Row>[] = [
  { header: "Name", value: (r) => r.name },
  { header: "Spent", value: (r) => r.spent },
  { header: "Verified", value: (r) => r.verified },
  { header: "Joined", value: (r) => r.joined },
];

describe("toCsv", () => {
  it("starts with a BOM, quotes awkward cells, and formats dates and booleans", () => {
    const csv = toCsv(
      [
        { name: 'Ade "Tunde", Jr', spent: 1500, verified: true, joined: new Date("2026-10-01T10:00:00Z") },
        { name: "Ngozi", spent: 0, verified: false, joined: null },
      ],
      columns,
    );
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "Name,Spent,Verified,Joined",
      '"Ade ""Tunde"", Jr",1500,Yes,2026-10-01',
      "Ngozi,0,No,",
    ]);
  });
});
