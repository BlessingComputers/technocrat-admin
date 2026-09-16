/**
 * Product smart-paste parser tests.
 *
 * The LLM is replaced by an in-memory `ChatCompleter`, so these pin the parts we
 * control: what goes into the prompt, and every guard that stands between a
 * model's reply and the bulk-upload editor. The guards matter more than the
 * happy path — their whole job is to catch a model that got something wrong.
 */

import { describe, expect, it, vi } from "vitest";
import {
  buildParseMessages,
  parseCompletionContent,
  parseProductText,
  MAX_LISTINGS_PER_CALL,
  type AiParsedProduct,
  type ChatCompleter,
  type ParseProductInput,
} from "@/lib/ai/product-parser";

const CATEGORIES = [
  {
    id: "cat-laptops",
    name: "Laptops",
    subcategories: [{ id: "sub-business", name: "Business" }],
  },
  {
    id: "cat-phones",
    name: "Phones",
    subcategories: [{ id: "sub-android", name: "Android" }],
  },
];
const BRANDS = [
  { id: "brand-dell", name: "Dell" },
  { id: "brand-hp", name: "HP" },
];

function input(rawText: string): ParseProductInput {
  return { rawText, categories: CATEGORIES, brands: BRANDS };
}

/** A completer that replies with the given products, ignoring the prompt. */
function replyWith(...products: Partial<AiParsedProduct>[]): ChatCompleter {
  return async () => JSON.stringify({ products });
}

/** A well-formed product the guards should leave alone. */
function validProduct(): Partial<AiParsedProduct> {
  return {
    name: "Dell Pro 14 PC14250",
    description: "A laptop.",
    categoryId: "cat-laptops",
    subcategoryId: "sub-business",
    brandId: "brand-dell",
    isActive: false,
    sourcingType: "OUTSOURCED",
    sku: "PC14250",
    price: 1_100_000,
    stockQuantity: 10,
    specifications: [{ name: "RAM", value: "16 GB" }],
  };
}

const RAW = "Dell Pro 14 XZ990\n16 GB RAM @1.1M";

describe("buildParseMessages", () => {
  it("puts the reference lists in the system message so caching covers them", () => {
    const [system, user] = buildParseMessages(input(RAW));

    expect(system.role).toBe("system");
    expect(system.content).toContain("cat-laptops");
    expect(system.content).toContain("brand-dell");
    // The raw text is the only part that changes per call; keeping it out of the
    // cached prefix is the whole point of the split.
    expect(system.content).not.toContain("XZ990");
    expect(user.content).toContain(RAW);
  });

  it("no longer asks the model for a slug", () => {
    const [system] = buildParseMessages(input(RAW));
    expect(system.content).toContain("Do NOT output a slug");
  });
});

describe("parseCompletionContent", () => {
  it("rejects non-JSON", () => {
    expect(() => parseCompletionContent("not json")).toThrow(/as JSON/);
  });

  it("rejects JSON without a products array", () => {
    expect(() => parseCompletionContent('{"items":[]}')).toThrow(
      /products array/,
    );
  });
});

describe("parseProductText guards", () => {
  it("keeps a well-formed product intact", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith(validProduct()),
    );

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      categoryId: "cat-laptops",
      subcategoryId: "sub-business",
      brandId: "brand-dell",
      sku: "PC14250",
      price: 1_100_000,
    });
  });

  it("nulls a category id that isn't in the supplied list", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), categoryId: "cat-invented" }),
    );

    expect(products[0].categoryId).toBeNull();
    // A subcategory can't outlive its category.
    expect(products[0].subcategoryId).toBeNull();
  });

  it("nulls a brand id that isn't in the supplied list", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), brandId: "brand-invented" }),
    );

    expect(products[0].brandId).toBeNull();
  });

  it("nulls a category name returned where an id was asked for", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), categoryId: "Laptops" }),
    );

    expect(products[0].categoryId).toBeNull();
  });

  it("drops a subcategory belonging to a different category", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), subcategoryId: "sub-android" }),
    );

    expect(products[0].categoryId).toBe("cat-laptops");
    expect(products[0].subcategoryId).toBeNull();
  });

  it("zeroes a price the paste never states", async () => {
    // 110,000 is a shifted decimal on the pasted @1.1M — plausible-looking, and
    // invisible in the editor without this check.
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), price: 110_000 }),
    );

    expect(products[0].price).toBe(0);
  });

  it("keeps the price when the paste has no recognisable price token", async () => {
    // No marker means the extractor can't judge, so it must not judge.
    const { products } = await parseProductText(
      input("Dell Pro 14, price on request"),
      replyWith({ ...validProduct(), price: 1_100_000 }),
    );

    expect(products[0].price).toBe(1_100_000);
  });

  it("forces every product to a draft", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), isActive: true }),
    );

    expect(products[0].isActive).toBe(false);
  });

  it("defaults an unrecognised sourcingType to OUTSOURCED", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({
        ...validProduct(),
        sourcingType: "MADE_UP" as AiParsedProduct["sourcingType"],
      }),
    );

    expect(products[0].sourcingType).toBe("OUTSOURCED");
  });

  it("keeps a product with no part number instead of dropping it", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({ ...validProduct(), sku: "   " }),
    );

    expect(products).toHaveLength(1);
    expect(products[0].sku).toBeNull();
  });

  it("discards malformed specification entries", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith({
        ...validProduct(),
        specifications: [
          { name: "RAM", value: "16 GB" },
          { name: "", value: "orphan" },
        ] as AiParsedProduct["specifications"],
      }),
    );

    expect(products[0].specifications).toEqual([
      { name: "RAM", value: "16 GB" },
    ]);
  });

  it("derives slugs in code and de-duplicates them", async () => {
    const { products } = await parseProductText(
      input(RAW),
      replyWith(
        { ...validProduct(), slug: "model-supplied" },
        { ...validProduct(), slug: "model-supplied" },
      ),
    );

    expect(products.map((p) => p.slug)).toEqual([
      "dell-pro-14-pc14250",
      "dell-pro-14-pc14250-2",
    ]);
  });
});

describe("parseProductText chunking", () => {
  /** n listings, each a name line plus a price line, all priced 1k. */
  function longPaste(n: number): string {
    const lines: string[] = [];
    for (let i = 1; i <= n; i += 1) lines.push(`Item ${i}`, "@1k");
    return lines.join("\n");
  }

  it("makes a single call for a paste at the threshold", async () => {
    const complete = vi.fn(replyWith(validProduct()));

    await parseProductText(input(longPaste(MAX_LISTINGS_PER_CALL)), complete);

    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("splits a longer paste and merges every chunk's products", async () => {
    const complete = vi.fn(replyWith(validProduct()));

    const { products } = await parseProductText(
      input(longPaste(MAX_LISTINGS_PER_CALL * 2 + 1)),
      complete,
    );

    expect(complete.mock.calls.length).toBeGreaterThan(1);
    // One product per chunk, all merged into one result.
    expect(products).toHaveLength(complete.mock.calls.length);
  });

  it("de-duplicates slugs across chunk boundaries, not just within a chunk", async () => {
    const complete = vi.fn(replyWith(validProduct()));

    const { products } = await parseProductText(
      input(longPaste(MAX_LISTINGS_PER_CALL * 2 + 1)),
      complete,
    );

    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });
});
