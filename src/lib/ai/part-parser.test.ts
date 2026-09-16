/**
 * Part smart-paste parser tests. Same shape as the product parser's: the LLM is
 * an in-memory fake, and the assertions cover the guards between a model's reply
 * and the bulk-upload editor.
 */

import { describe, expect, it, vi } from "vitest";
import {
  buildParseMessages,
  parseCompletionContent,
  parsePartText,
  MAX_LISTINGS_PER_CALL,
  type AiParsedPart,
  type ChatCompleter,
  type ParsePartInput,
} from "@/lib/ai/part-parser";

const CATEGORIES = [{ id: "cat-accessories", name: "Accessories" }];
const BRANDS = [{ id: "brand-dell", name: "Dell" }];
const PART_TYPES = [{ id: "type-charger", name: "Charger" }];

function input(rawText: string): ParsePartInput {
  return {
    rawText,
    categories: CATEGORIES,
    brands: BRANDS,
    partTypes: PART_TYPES,
  };
}

function replyWith(...parts: Partial<AiParsedPart>[]): ChatCompleter {
  return async () => JSON.stringify({ parts });
}

function validPart(): Partial<AiParsedPart> {
  return {
    name: "Dell 65W USB-C Charger",
    description: "A charger.",
    categoryId: "cat-accessories",
    brandId: "brand-dell",
    partTypeId: "type-charger",
    partNumber: "DA65NM",
    ownerSku: null,
    isActive: false,
    price: 45_000,
    costPrice: 45_000,
    stockQuantity: 10,
    specifications: [{ name: "Wattage", value: "65W" }],
  };
}

const RAW = "Dell 65W USB-C Charger DA65NM @45k";

describe("buildParseMessages", () => {
  it("puts all three reference lists in the cached system message", () => {
    const [system, user] = buildParseMessages(input(RAW));

    expect(system.role).toBe("system");
    expect(system.content).toContain("cat-accessories");
    expect(system.content).toContain("type-charger");
    expect(system.content).toContain("brand-dell");
    expect(user.content).toContain(RAW);
  });
});

describe("parseCompletionContent", () => {
  it("rejects JSON without a parts array", () => {
    expect(() => parseCompletionContent('{"items":[]}')).toThrow(/parts array/);
  });
});

describe("parsePartText guards", () => {
  it("keeps a well-formed part intact", async () => {
    const { parts } = await parsePartText(input(RAW), replyWith(validPart()));

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({
      categoryId: "cat-accessories",
      brandId: "brand-dell",
      partTypeId: "type-charger",
      price: 45_000,
    });
  });

  it("nulls every id that isn't in its supplied list", async () => {
    const { parts } = await parsePartText(
      input(RAW),
      replyWith({
        ...validPart(),
        categoryId: "nope",
        brandId: "nope",
        partTypeId: "nope",
      }),
    );

    expect(parts[0].categoryId).toBeNull();
    expect(parts[0].brandId).toBeNull();
    expect(parts[0].partTypeId).toBeNull();
  });

  it("nulls a price the paste never states", async () => {
    const { parts } = await parsePartText(
      input(RAW),
      replyWith({ ...validPart(), price: 4_500, costPrice: 4_500 }),
    );

    expect(parts[0].price).toBeNull();
    expect(parts[0].costPrice).toBeNull();
  });

  it("keeps the price when the paste has no recognisable price token", async () => {
    const { parts } = await parsePartText(
      input("Dell charger, price on request"),
      replyWith({ ...validPart() }),
    );

    expect(parts[0].price).toBe(45_000);
  });

  it("falls back to price when costPrice is missing", async () => {
    const { parts } = await parsePartText(
      input(RAW),
      replyWith({ ...validPart(), costPrice: null }),
    );

    expect(parts[0].costPrice).toBe(45_000);
  });

  it("forces every part to a draft", async () => {
    const { parts } = await parsePartText(
      input(RAW),
      replyWith({ ...validPart(), isActive: true }),
    );

    expect(parts[0].isActive).toBe(false);
  });

  it("derives slugs in code and de-duplicates them", async () => {
    const { parts } = await parsePartText(
      input(RAW),
      replyWith(
        { ...validPart(), slug: "model-supplied" },
        { ...validPart(), slug: "model-supplied" },
      ),
    );

    expect(parts.map((p) => p.slug)).toEqual([
      "dell-65w-usb-c-charger",
      "dell-65w-usb-c-charger-2",
    ]);
  });
});

describe("parsePartText chunking", () => {
  function longPaste(n: number): string {
    const lines: string[] = [];
    for (let i = 1; i <= n; i += 1) lines.push(`Part ${i}`, "@1k");
    return lines.join("\n");
  }

  it("makes a single call for a paste at the threshold", async () => {
    const complete = vi.fn(replyWith(validPart()));

    await parsePartText(input(longPaste(MAX_LISTINGS_PER_CALL)), complete);

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("splits a longer paste and merges every chunk's parts", async () => {
    const complete = vi.fn(replyWith(validPart()));

    const { parts } = await parsePartText(
      input(longPaste(MAX_LISTINGS_PER_CALL * 2 + 1)),
      complete,
    );

    expect(complete.mock.calls.length).toBeGreaterThan(1);
    expect(parts).toHaveLength(complete.mock.calls.length);
  });
});
