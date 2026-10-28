/**
 * Product parsing from raw pasted text (AI smart-paste).
 *
 * The LLM call sits behind the `ChatCompleter` seam: production passes the
 * Claude adapter (see `./llm`); the prompt-building and
 * response-parsing are pure. Lives in `lib/` because the app route imports it
 * (app -> lib is allowed); the client never imports this — it calls
 * `/api/admin/products/ai-parse`.
 *
 * What the model is NOT asked to do: slugs and duplicate resolution are derived
 * in code (`./text`), and prices are cross-checked against the raw text. Those
 * are deterministic rules, so spending prompt budget and trusting a model with
 * them only adds a failure mode.
 */

import {
  AiParseError,
  createClaudeCompleter,
  type ChatCompleter,
  type ChatMessage,
} from "./llm";
import {
  assignUniqueSlugs,
  chunkListings,
  extractPriceTokens,
  priceMatchesRawText,
} from "./text";

// Re-exported so existing import sites (routes, tests) keep resolving these
// from the parser module after the shared-adapter extraction.
export { AiParseError };
export type { ChatCompleter, ChatMessage };

/**
 * One parsed product — one supplier line becomes one product (variants are no
 * longer grouped). Price is the numeric supplier (cost) price.
 */
export interface AiParsedProduct {
  name?: string;
  /** Derived in code from `name`, not returned by the model. */
  slug?: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  brandId?: string | null;
  description?: string;
  isActive?: boolean;
  /** Sourcing for the product; defaults to OUTSOURCED when unspecified. */
  sourcingType?: "INHOUSE" | "OUTSOURCED";
  /** The product's part number — used as its SKU. Required to be uploadable. */
  sku?: string | null;
  /** Numeric supplier (cost) price. */
  price?: number;
  stockQuantity?: number;
  /** All specifications (the part number lives in `sku`, not here). */
  specifications?: { name: string; value: string }[];
}

/** A category plus its subcategories, so the model can match both in one pass. */
export interface ParseCategory {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
}

export interface ParseProductInput {
  rawText: string;
  categories: ParseCategory[];
  brands: { id: string; name: string }[];
}

export interface ParseProductResult {
  products: AiParsedProduct[];
}

/**
 * Listings per LLM call. A single call for a very long paste both risks
 * truncating the JSON mid-array and thins the model's attention, which shows up
 * as dropped specs on the later listings. Pastes at or under this size are sent
 * as one call, exactly as before.
 */
export const MAX_LISTINGS_PER_CALL = 15;

const SYSTEM_PROMPT = `
You are a Product Data Architect for an electronics retailer.
Your task is to parse raw supplier listings into structured JSON for a bulk upload editor.

INSTRUCTIONS:
1. Each listing is its own product:
   - A listing is a block of lines describing one configuration, ending with a
     price (a token starting with @, #, ₦, or N, e.g. "@1.1M" or "#970,000").
   - Produce one product per listing, even when the brand and model family
     match: a different processor, RAM, storage, colour, or part number is a
     different product with its own price and stock, so configurations are not
     merged into a shared "base" product.

2. Product "name" — include every specification:
   - Format: [Brand] [Model + Part Number] - [every spec, comma-separated].
   - Include EVERYTHING in the listing EXCEPT: the price token (@1.1M, #…, ₦…,
     N…), leading decorative emoji/bullets (🎈🌱• etc.), and availability words
     ("Sold out", "SOLD OUT", "(4unit)"). Staff tell configurations apart by
     name, so represent every spec line rather than summarising.
   - Example input:
       🎈Dell Pro 14 PC14250
       Intel Core Ultra 5 235u VPro
       16 GB RAM, 256 GB SSD
       14" FHD+ (1920x1200), anti-glare IPS, English US Backlit Copilot Keyboard 79-key
       Win 11 Pro @1.1M Sold out
     Example name:
       "Dell Pro 14 PC14250 - Intel Core Ultra 5 235u VPro, 16 GB RAM, 256 GB SSD, 14\\" FHD+ (1920x1200) anti-glare IPS, English US Backlit Copilot Keyboard 79-key, Win 11 Pro"

3. "price": numeric supplier price. Strip @, #, ₦, N, commas, spaces, and expand
   shorthand: "@1.1M" becomes 1100000, "#970,000" becomes 970000. Copy the digits
   exactly — never round, and never shift the decimal place.

4. "stockQuantity":
   - "SOLD OUT" / "Sold out" → stockQuantity 0.
   - A count like "(4unit)" → that number.
   - Otherwise → stockQuantity 10.

5. "sku" — set it to the product's PART NUMBER (the model/part code in the
   listing, e.g. "PC14250", "BD4A6EA"). If a listing has none, still output the
   product with "sku" null; the editor blocks upload until a human adds one.

5b. "sourcingType" — read it from the TOP of the input. If the first line(s)
   state the source for the whole list — "in house" / "in-house" / "inhouse" →
   "INHOUSE"; "outsourced" / "outsource" → "OUTSOURCED" — apply that value to
   EVERY product. If it is not specified anywhere, default to "OUTSOURCED".

6. "specifications": extract ALL specs as { "name", "value" } pairs — Processor,
   RAM, Storage, Display, Keyboard, OS, Colour, Warranty, etc. Do NOT add a
   "Part Number" spec — the part number belongs in "sku" (rule 5) and is shown
   as the part number automatically. Specifications must mirror the name.

7. Generate a rich product description (2-3 sentences) highlighting key selling
   points.

8. Categorization (two steps — order matters):
   - Use the CATEGORIES list given below. Match each product to the MOST LIKELY Category ID by comparing the product type to category names.
   - Use ONLY ids that appear in that list. Never invent an id, and never put a name where an id is asked for.
   - If no category matches, return null for categoryId AND null for subcategoryId.
   - Then pick subcategoryId from the matched category's own "subcategories" array only. If none clearly fits (or the category has no subcategories), return null for subcategoryId.

9. Branding:
   - Use the BRANDS list given below. Match each product to the correct Brand ID.
   - Use ONLY ids that appear in that list. If no brand matches, return null for brandId.

10. Ignore section headers like "HP 15 LAPTOPS" — they are not products. Ignore
    decorative emoji/bullets (🌱 etc.) at the start of lines.

Return one entry per listing in the "products" array.
`;

/**
 * Structured Outputs schema: the model's reply is constrained to this shape, so
 * `parseCompletionContent` never faces malformed JSON or missing keys. Objects
 * set `additionalProperties: false` and list every property in `required`;
 * optional fields use nullable types. Anthropic enforces it via
 * `output_config`.
 *
 * Referential validity — an id that exists in the provided lists, a subcategory
 * that actually belongs to its category — is still enforced afterwards by
 * `normalizeProducts` / `validateSubcategories`, because a schema can't express
 * it. `slug` is absent by design: it is derived from `name` in code.
 */
const PRODUCTS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          categoryId: { type: ["string", "null"] },
          subcategoryId: { type: ["string", "null"] },
          brandId: { type: ["string", "null"] },
          sourcingType: { type: "string", enum: ["INHOUSE", "OUTSOURCED"] },
          sku: { type: ["string", "null"] },
          price: { type: "number" },
          stockQuantity: { type: "number" },
          specifications: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                value: { type: "string" },
              },
              required: ["name", "value"],
            },
          },
        },
        required: [
          "name",
          "description",
          "categoryId",
          "subcategoryId",
          "brandId",
          "sourcingType",
          "sku",
          "price",
          "stockQuantity",
          "specifications",
        ],
      },
    },
  },
  required: ["products"],
};

/**
 * Pure: assemble the system + user messages for a parse request.
 *
 * The CATEGORIES and BRANDS lists go in the SYSTEM message, not the user one.
 * They are near-static and by far the largest part of the prompt, and the Claude
 * leg marks the whole system block `cache_control: ephemeral` — so putting them
 * here lets a bulk-upload session (and every chunk of one paste) re-read them
 * from cache instead of paying full price on every call.
 */
export function buildParseMessages(input: ParseProductInput): ChatMessage[] {
  const reference = `
CATEGORIES (use these IDs for matching):
${JSON.stringify(input.categories)}

BRANDS (use these IDs for matching):
${JSON.stringify(input.brands)}
`;

  return [
    { role: "system", content: `${SYSTEM_PROMPT}${reference}` },
    { role: "user", content: `RAW PRODUCT TEXT TO PARSE:\n${input.rawText}` },
  ];
}

/** Pure: turn the model's reply content into the products array. */
export function parseCompletionContent(content: string): ParseProductResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiParseError("Failed to parse AI response as JSON", 500);
  }

  const products = (parsed as { products?: unknown }).products;
  if (!Array.isArray(products)) {
    throw new AiParseError("AI response did not contain a products array", 500);
  }

  return { products: products as AiParsedProduct[] };
}

/** Production ChatCompleter: Claude Haiku 4.5. */
export const parseCompleter: ChatCompleter = createClaudeCompleter({
  schema: PRODUCTS_SCHEMA,
});

/**
 * Parse raw product text into structured products. The `complete` seam defaults
 * to the Claude adapter; tests can pass an in-memory fake.
 *
 * Long pastes are split into chunks and sent as separate calls, then merged.
 * Chunks run sequentially on purpose: the first call writes the cached system
 * prompt (the reference lists) and every later chunk reads it back. In parallel
 * they would all miss the cache and each pay full price for the lists.
 */
export async function parseProductText(
  input: ParseProductInput,
  complete: ChatCompleter = parseCompleter,
): Promise<ParseProductResult> {
  const chunks = chunkListings(input.rawText, MAX_LISTINGS_PER_CALL);
  const products: AiParsedProduct[] = [];

  for (const rawText of chunks) {
    const messages = buildParseMessages({ ...input, rawText });
    const content = await complete(messages);
    products.push(...parseCompletionContent(content).products);
  }

  // Normalize and de-duplicate across the WHOLE paste, not per chunk, so slug
  // uniqueness holds for everything the user is about to upload.
  return {
    products: assignUniqueSlugs(
      validateSubcategories(
        normalizeProducts(products, input),
        input.categories,
      ),
    ),
  };
}

/**
 * Defense against shape drift and hallucination: coerce price/stock to numbers,
 * force draft status, keep only well-formed specifications, and null any
 * category or brand id that isn't in the lists we supplied.
 *
 * A product that fails a check is kept in a visibly-invalid state (price 0, null
 * sku, empty category) rather than dropped — the editor blocks upload on those
 * and a human fixes them, which beats a row silently vanishing from a paste.
 */
function normalizeProducts(
  products: AiParsedProduct[],
  input: ParseProductInput,
): AiParsedProduct[] {
  const categoryIds = new Set(input.categories.map((c) => c.id));
  const brandIds = new Set(input.brands.map((b) => b.id));
  // Prices the paste actually states. Empty means this paste uses a format the
  // extractor doesn't recognise, in which case the cross-check is skipped
  // entirely rather than zeroing prices that are probably fine.
  const priceTokens = extractPriceTokens(input.rawText);

  for (const p of products) {
    p.sourcingType = p.sourcingType === "INHOUSE" ? "INHOUSE" : "OUTSOURCED";
    // Every uploaded product starts inactive — staff activate once pricing is
    // set. Enforced here so a stray `true` from the model can't slip through.
    p.isActive = false;
    p.sku = typeof p.sku === "string" && p.sku.trim() ? p.sku.trim() : null;
    p.price = typeof p.price === "number" && p.price > 0 ? p.price : 0;
    // A price the paste never states means the model dropped or shifted a
    // digit. Zero it so the editor flags the row, instead of uploading a laptop
    // at a tenth of its cost.
    if (
      p.price > 0 &&
      priceTokens.length > 0 &&
      !priceMatchesRawText(p.price, priceTokens)
    ) {
      p.price = 0;
    }
    p.stockQuantity =
      typeof p.stockQuantity === "number" && p.stockQuantity >= 0
        ? p.stockQuantity
        : 0;
    if (!p.categoryId || !categoryIds.has(p.categoryId)) p.categoryId = null;
    if (!p.brandId || !brandIds.has(p.brandId)) p.brandId = null;
    p.specifications = Array.isArray(p.specifications)
      ? p.specifications.filter((s) => s && s.name && s.value)
      : [];
  }
  return products;
}

/**
 * Defense against hallucination: drop any `subcategoryId` the model returned that
 * doesn't actually belong to the product's matched category (wrong category,
 * made-up id, or no category). Mirrors the "null when unsure" rule for category
 * and brand — a bad guess degrades to an empty field the human picks, never bad data.
 */
function validateSubcategories(
  products: AiParsedProduct[],
  categories: ParseCategory[],
): AiParsedProduct[] {
  const subsByCategory = new Map(
    categories.map((c) => [c.id, new Set(c.subcategories.map((s) => s.id))]),
  );
  for (const p of products) {
    const valid =
      p.categoryId != null &&
      p.subcategoryId != null &&
      subsByCategory.get(p.categoryId)?.has(p.subcategoryId);
    if (!valid) p.subcategoryId = null;
  }
  return products;
}
