/** Bulk-link grouping for product-scoped part uploads. */

import { describe, expect, it } from "vitest";
import { createdPartIdChunks } from "./bulk-part-helpers";
import type { PartBulkBatchStatusRow } from "../../types/parts";

describe("createdPartIdChunks", () => {
  it("keeps only created parts, in groups of 50", () => {
    const results: PartBulkBatchStatusRow[] = Array.from({ length: 120 }, (_, i) => ({
      row: i + 1,
      success: true,
      partId: `p${i}`,
    }));
    results.push({ row: 121, success: false, partId: "failed" });
    results.push({ row: 122, success: true });

    const chunks = createdPartIdChunks(results);

    expect(chunks.map((c) => c.length)).toEqual([50, 50, 20]);
    expect(chunks.flat()).not.toContain("failed");
    expect(chunks[0][0]).toBe("p0");
  });

  it("returns no groups when nothing was created", () => {
    expect(createdPartIdChunks(undefined)).toEqual([]);
  });
});
