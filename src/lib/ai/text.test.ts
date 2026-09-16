/**
 * Tests for the deterministic smart-paste helpers.
 *
 * These are the rules we took away from the model — slugs, price tokens, listing
 * boundaries — so they need to be pinned tightly: a false positive in
 * `extractPriceTokens` would zero out prices the model got right.
 */

import { describe, expect, it } from "vitest";
import {
  assignUniqueSlugs,
  chunkListings,
  extractPriceTokens,
  hasPriceToken,
  priceMatchesRawText,
  slugify,
} from "@/lib/ai/text";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Dell Pro 14 PC14250")).toBe("dell-pro-14-pc14250");
  });

  it("collapses punctuation runs and trims the edges", () => {
    expect(slugify('HP 15 -- 14" FHD+ (1920x1200), IPS')).toBe(
      "hp-15-14-fhd-1920x1200-ips",
    );
  });

  it("strips accents rather than dropping the letters", () => {
    expect(slugify("Café Wireless Mouse")).toBe("cafe-wireless-mouse");
  });

  it("never ends on a hyphen, even when the length cap lands on one", () => {
    const slug = slugify("a".repeat(118) + " tail");
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns empty for a name with no alphanumerics", () => {
    expect(slugify("--- ***")).toBe("");
  });
});

describe("assignUniqueSlugs", () => {
  it("derives the slug from the name, ignoring anything the model sent", () => {
    const items = [{ name: "Dell Pro 14", slug: "whatever-the-model-said" }];
    expect(assignUniqueSlugs(items)[0].slug).toBe("dell-pro-14");
  });

  it("suffixes collisions so a batch upload can't trip a unique constraint", () => {
    const items: { name: string; slug?: string }[] = [
      { name: "Dell Pro 14" },
      { name: "Dell Pro 14" },
      { name: "Dell Pro 14" },
    ];
    expect(assignUniqueSlugs(items).map((i) => i.slug)).toEqual([
      "dell-pro-14",
      "dell-pro-14-2",
      "dell-pro-14-3",
    ]);
  });

  it("falls back to a placeholder for an unslugabble name", () => {
    const items: { name: string; slug?: string }[] = [{ name: "***" }];
    expect(assignUniqueSlugs(items)[0].slug).toBe("item");
  });
});

describe("extractPriceTokens", () => {
  it("expands the M and k shorthands", () => {
    expect(extractPriceTokens("Win 11 Pro @1.1M Sold out")).toEqual([1_100_000]);
    expect(extractPriceTokens("Charger @45k")).toEqual([45_000]);
  });

  it("strips thousands commas", () => {
    expect(extractPriceTokens("#970,000")).toEqual([970_000]);
  });

  it("reads every marker form the prompt documents", () => {
    expect(extractPriceTokens("@1k #2k ₦3k N4k")).toEqual([
      1_000, 2_000, 3_000, 4_000,
    ]);
  });

  it("ignores an N that is part of a code, not a price", () => {
    expect(extractPriceTokens("Part PN12345 fits all")).toEqual([]);
  });

  it("returns empty for text with no price markers", () => {
    expect(extractPriceTokens("16 GB RAM, 256 GB SSD")).toEqual([]);
  });
});

describe("priceMatchesRawText", () => {
  const tokens = extractPriceTokens("@1.1M and #970,000");

  it("accepts a price the paste states", () => {
    expect(priceMatchesRawText(1_100_000, tokens)).toBe(true);
    expect(priceMatchesRawText(970_000, tokens)).toBe(true);
  });

  it("rejects a shifted decimal place", () => {
    expect(priceMatchesRawText(110_000, tokens)).toBe(false);
  });
});

describe("hasPriceToken", () => {
  it("is stateless across calls despite the shared global regex", () => {
    // A /g regex carries lastIndex between calls; the helper must reset it or
    // every other call silently returns false.
    expect(hasPriceToken("Win 11 Pro @1.1M")).toBe(true);
    expect(hasPriceToken("Win 11 Pro @1.1M")).toBe(true);
    expect(hasPriceToken("16 GB RAM")).toBe(false);
  });
});

describe("chunkListings", () => {
  /** n listings, each a name line plus a price line. */
  function paste(n: number, header?: string): string {
    const lines = header ? [header] : [];
    for (let i = 1; i <= n; i += 1) lines.push(`Item ${i}`, `@${i}k`);
    return lines.join("\n");
  }

  it("returns the text untouched at or below the threshold", () => {
    const text = paste(3);
    expect(chunkListings(text, 3)).toEqual([text]);
  });

  it("splits above the threshold, preserving every listing", () => {
    const chunks = chunkListings(paste(7), 3);
    expect(chunks.length).toBeGreaterThan(1);
    const rejoined = chunks.join("\n");
    for (let i = 1; i <= 7; i += 1) {
      expect(rejoined).toContain(`Item ${i}`);
    }
  });

  it("carries the sourcing header onto later chunks", () => {
    // Rule 5b reads sourcing from the top of the paste, so chunk 2 would
    // otherwise silently default every product to OUTSOURCED.
    const chunks = chunkListings(paste(6, "IN HOUSE"), 2);
    expect(chunks.length).toBe(3);
    for (const chunk of chunks) expect(chunk).toContain("IN HOUSE");
  });

  it("does not repeat the carried header inside a chunk", () => {
    const chunks = chunkListings(paste(6, "IN HOUSE"), 2);
    for (const chunk of chunks) {
      expect(chunk.split("IN HOUSE").length - 1).toBe(1);
    }
  });

  it("attaches trailing lines to the last chunk rather than a listing-less one", () => {
    const chunks = chunkListings(paste(4) + "\nStray trailing note", 2);
    expect(chunks).toHaveLength(2);
    expect(chunks[chunks.length - 1]).toContain("Stray trailing note");
  });
});
