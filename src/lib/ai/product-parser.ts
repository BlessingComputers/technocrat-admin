/**
 * Product parsing from raw pasted text (AI smart-paste).
 *
 * The LLM call sits behind the `ChatCompleter` seam: production passes the Claude
 * adapter (Haiku 4.5, plain REST — see `./llm`); the prompt-building and
 * response-parsing are pure. Lives in `lib/` because the app route imports it
 * (app → lib is allowed); the client never imports this — it calls
 * `/api/admin/products/ai-parse`.
 */

import {
  AiParseError,
  createFallbackCompleter,
  type ChatCompleter,
  type ChatMessage,
} from "./llm";

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

const SYSTEM_PROMPT = `
You are a Product Data Architect for Blessing Computers, an electronics retailer.
Your task is to parse raw supplier listings into structured JSON for a bulk upload editor.

INSTRUCTIONS:
1. EACH LISTING IS ITS OWN PRODUCT (critical):
   - A listing is a block of lines describing one configuration, ending with a
     price (a token starting with @, #, ₦, or N, e.g. "@1.1M" or "#970,000").
   - Produce ONE product per listing. NEVER group or merge configurations into
     a shared "base" product, even when the brand and model family match. A
     different processor, RAM, storage, colour, or part number is a DIFFERENT
     product.

2. Product "name" — include ALL specifications (this is the key rule):
   - Format: [Brand] [Model + Part Number] - [every spec, comma-separated].
   - Include EVERYTHING in the listing EXCEPT: the price token (@1.1M, #…, ₦…,
     N…), leading decorative emoji/bullets (🎈🌱• etc.), and availability words
     ("Sold out", "SOLD OUT", "(4unit)"). Do NOT truncate or summarise specs —
     every spec line must be represented in the name.
   - Example input:
       🎈Dell Pro 14 PC14250
       Intel Core Ultra 5 235u VPro
       16 GB RAM, 256 GB SSD
       14" FHD+ (1920x1200), anti-glare IPS, English US Backlit Copilot Keyboard 79-key
       Win 11 Pro @1.1M Sold out
     Example name:
       "Dell Pro 14 PC14250 - Intel Core Ultra 5 235u VPro, 16 GB RAM, 256 GB SSD, 14\\" FHD+ (1920x1200) anti-glare IPS, English US Backlit Copilot Keyboard 79-key, Win 11 Pro"

3. Generate a URL-friendly slug from the name, lowercase, hyphens only.

4. "price": numeric supplier price. Strip @, #, ₦, N, commas, spaces, and expand
   shorthand: "@1.1M" becomes 1100000, "#970,000" becomes 970000.

5. "stockQuantity":
   - "SOLD OUT" / "Sold out" → stockQuantity 0.
   - A count like "(4unit)" → that number.
   - Otherwise → stockQuantity 10.

5b. "isActive" — ALWAYS false. Every uploaded product starts inactive (a draft).
   Staff activate it later, once the selling price/markup has been set. Never
   output true, regardless of stock.

6. "sku" — set it to the product's PART NUMBER (the model/part code in the
   listing, e.g. "PC14250", "BD4A6EA"). Every product MUST have a part number;
   if a listing has none, still output the product but leave "sku" null so a
   human can fix it (the editor blocks upload until it has one).

6b. "sourcingType" — read it from the TOP of the input. If the first line(s)
   state the source for the whole list — "in house" / "in-house" / "inhouse" →
   "INHOUSE"; "outsourced" / "outsource" → "OUTSOURCED" — apply that value to
   EVERY product. If it is not specified anywhere, default to "OUTSOURCED".

7. "specifications": extract ALL specs as { "name", "value" } pairs — Processor,
   RAM, Storage, Display, Keyboard, OS, Colour, Warranty, etc. Do NOT add a
   "Part Number" spec — the part number belongs in "sku" (rule 6) and is shown
   as the part number automatically. Specifications must mirror the name.

8. Generate a rich product description (2-3 sentences) highlighting key selling
   points.

9. Categorization (two steps — order matters):
   - Use the provided CATEGORIES list. Match each product to the MOST LIKELY Category ID by comparing the product type to category names.
   - If no category matches, return null for categoryId AND null for subcategoryId.
   - Then pick subcategoryId ONLY from the matched category's own "subcategories" array. NEVER use a subcategory id from a different category. If none clearly fits (or the category has no subcategories), return null for subcategoryId.

10. Branding:
   - Use the provided BRANDS list. Match each product to the correct Brand ID.
   - If no brand matches, return null for brandId.

11. Ignore section headers like "HP 15 LAPTOPS" — they are not products. Ignore
    decorative emoji/bullets (🌱 etc.) at the start of lines.

OUTPUT FORMAT:
Return a JSON object with a single "products" array:
{
  "products": [
    {
      "name": "string (Brand + Model + Part Number, then ALL specs)",
      "slug": "string (url-friendly)",
      "description": "string (2-3 sentence selling description)",
      "categoryId": "string | null",
      "subcategoryId": "string | null (must belong to categoryId, else null)",
      "brandId": "string | null",
      "isActive": false,
      "sourcingType": "INHOUSE | OUTSOURCED (default OUTSOURCED)",
      "sku": "string (the part number) | null",
      "price": number,
      "stockQuantity": number,
      "specifications": [{ "name": "string", "value": "string" }]
    }
  ]
}
`;

/**
 * Structured Outputs schema: the model's reply is constrained to this shape, so
 * `parseCompletionContent` never faces malformed JSON or missing keys. Objects
 * set `additionalProperties: false` and list every property in `required`;
 * optional fields use nullable types. Referential validity (a subcategory that
 * actually belongs to its category, an ID that exists in the provided lists) is
 * still enforced afterwards by `validateSubcategories` / `normalizeProducts` —
 * a schema can't express it.
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
          slug: { type: "string" },
          description: { type: "string" },
          categoryId: { type: ["string", "null"] },
          subcategoryId: { type: ["string", "null"] },
          brandId: { type: ["string", "null"] },
          isActive: { type: "boolean" },
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
          "slug",
          "description",
          "categoryId",
          "subcategoryId",
          "brandId",
          "isActive",
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

/** Pure: assemble the system + user messages for a parse request. */
export function buildParseMessages(input: ParseProductInput): ChatMessage[] {
  const userPrompt = `
CATEGORIES (use these IDs for matching):
${JSON.stringify(input.categories)}

BRANDS (use these IDs for matching):
${JSON.stringify(input.brands)}

RAW PRODUCT TEXT TO PARSE:
${input.rawText}
`;

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
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

/** Production ChatCompleter: Groq primary, Claude (Haiku 4.5) fallback on 429. */
export const parseCompleter: ChatCompleter = createFallbackCompleter({
  schema: PRODUCTS_SCHEMA,
});

/**
 * Parse raw product text into structured products. The `complete` seam defaults
 * to the Groq→Claude fallback adapter; tests can pass an in-memory fake.
 */
export async function parseProductText(
  input: ParseProductInput,
  complete: ChatCompleter = parseCompleter,
): Promise<ParseProductResult> {
  const messages = buildParseMessages(input);
  const content = await complete(messages);
  const result = parseCompletionContent(content);
  return {
    products: normalizeProducts(
      validateSubcategories(result.products, input.categories),
    ),
  };
}

/**
 * Defense against shape drift: coerce each product's price/stock to numbers and
 * keep only well-formed specifications. A price-less product is kept (price 0)
 * and a part-number-less product keeps a null sku — both surface as invalid in
 * the editor for a human to fix, rather than vanishing.
 */
function normalizeProducts(products: AiParsedProduct[]): AiParsedProduct[] {
  for (const p of products) {
    p.sourcingType = p.sourcingType === "INHOUSE" ? "INHOUSE" : "OUTSOURCED";
    // Every uploaded product starts inactive — staff activate once pricing is
    // set. Enforced here so a stray `true` from the model can't slip through.
    p.isActive = false;
    p.sku = typeof p.sku === "string" && p.sku.trim() ? p.sku.trim() : null;
    p.price = typeof p.price === "number" && p.price > 0 ? p.price : 0;
    p.stockQuantity =
      typeof p.stockQuantity === "number" && p.stockQuantity >= 0
        ? p.stockQuantity
        : 0;
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
