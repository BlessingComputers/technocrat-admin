/**
 * Part parsing from raw pasted text (AI smart-paste for the parts bulk view).
 *
 * Shares the provider adapter with the product parser via `./llm`, and the
 * deterministic slug/price/chunking helpers via `./text`. The prompt-building
 * and response-parsing are pure; the LLM call sits behind the `ChatCompleter`
 * seam so tests can pass an in-memory fake.
 */

import {
  AiParseError,
  createFallbackCompleter,
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

/** One parsed part — one supplier line becomes one part (parts have no variants). */
export interface AiParsedPart {
  name?: string;
  /** Derived in code from `name`, not returned by the model. */
  slug?: string;
  partNumber?: string | null;
  partTypeId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  ownerSku?: string | null;
  description?: string;
  price?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  isActive?: boolean;
  specifications?: { name: string; value: string }[];
}

export interface ParsePartInput {
  rawText: string;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  partTypes: { id: string; name: string }[];
}

export interface ParsePartResult {
  parts: AiParsedPart[];
}

/** Listings per LLM call. See the product parser for the reasoning. */
export const MAX_LISTINGS_PER_CALL = 15;

const SYSTEM_PROMPT = `
You are a Parts Data Architect for Technocrat Nigeria, an electronics retailer.
Your task is to parse raw supplier listings of PARTS (components like chargers,
keyboards, screens, batteries) into structured JSON for a bulk upload editor.

INSTRUCTIONS:
1. EACH LISTING IS ITS OWN PART:
   - A listing is a block of lines describing one part, usually ending with a
     price (a token starting with @, #, ₦, or N, e.g. "@45k" or "#55,000").
   - Produce ONE part per listing. Never merge listings.

2. "name" — a clear part name: [Brand] [Part type] [model/compat], plus key
   specs. Exclude the price token and decorative emoji/bullets.

3. "price": numeric supplier price. Strip @, #, ₦, N, commas, spaces, and expand
   shorthand: "@45k" → 45000, "#55,000" → 55000. Copy the digits exactly — never
   round, and never shift the decimal place. Put it in BOTH "price" and
   "costPrice" (selling price is adjusted later via markup). If no price, null.

4. "stockQuantity": "SOLD OUT" → 0; a count like "(4 units)" → that number;
   otherwise 10.

5. "isActive" — ALWAYS false (uploads start as drafts).

6. "partNumber" — the manufacturer/supplier part code if present, else null.

7. "ownerSku" — the SKU of the product this part belongs to, if the listing
   states it; else null.

8. Categorization (match against the lists given below, return the matched ID).
   Use ONLY ids that appear in those lists — never invent an id, and never put a
   name where an id is asked for:
   - "categoryId": MOST LIKELY Category ID by comparing the part to category
     names; null if none matches.
   - "partTypeId": MOST LIKELY Part Type ID (charger, keyboard, screen, battery,
     …); null if none matches.
   - "brandId": correct Brand ID; null if none matches.

9. "specifications": extract specs as { "name", "value" } pairs (Material,
   Capacity, Compatibility, Connector, …). Don't duplicate the part number here.

10. Write a short "description" (1-2 sentences).

11. Do NOT output a slug. The system generates it from the name.

OUTPUT FORMAT — a JSON object with a single "parts" array:
{
  "parts": [
    {
      "name": "string",
      "partNumber": "string | null",
      "partTypeId": "string | null",
      "categoryId": "string | null",
      "brandId": "string | null",
      "ownerSku": "string | null",
      "description": "string",
      "price": number | null,
      "costPrice": number | null,
      "stockQuantity": number,
      "isActive": false,
      "specifications": [{ "name": "string", "value": "string" }]
    }
  ]
}
`;

/**
 * Structured Outputs schema: constrains the reply so `parseCompletionContent`
 * never faces malformed JSON. Enforced on both providers (Anthropic via
 * `output_config`, Groq via strict `json_schema`). ID validity against the
 * provided lists is still enforced afterwards by `normalizeParts` — a schema
 * can't express it. `slug` is absent by design: it is derived from `name`.
 */
const PARTS_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    parts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          partNumber: { type: ["string", "null"] },
          partTypeId: { type: ["string", "null"] },
          categoryId: { type: ["string", "null"] },
          brandId: { type: ["string", "null"] },
          ownerSku: { type: ["string", "null"] },
          description: { type: "string" },
          price: { type: ["number", "null"] },
          costPrice: { type: ["number", "null"] },
          stockQuantity: { type: "number" },
          isActive: { type: "boolean" },
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
          "partNumber",
          "partTypeId",
          "categoryId",
          "brandId",
          "ownerSku",
          "description",
          "price",
          "costPrice",
          "stockQuantity",
          "isActive",
          "specifications",
        ],
      },
    },
  },
  required: ["parts"],
};

/**
 * Pure: assemble the system + user messages.
 *
 * The reference lists sit in the SYSTEM message so the Claude leg's
 * `cache_control` covers them — see the product parser for the full reasoning.
 */
export function buildParseMessages(input: ParsePartInput): ChatMessage[] {
  const reference = `
CATEGORIES (use these IDs):
${JSON.stringify(input.categories)}

PART TYPES (use these IDs):
${JSON.stringify(input.partTypes)}

BRANDS (use these IDs):
${JSON.stringify(input.brands)}
`;

  return [
    { role: "system", content: `${SYSTEM_PROMPT}${reference}` },
    { role: "user", content: `RAW PART TEXT TO PARSE:\n${input.rawText}` },
  ];
}

/** Pure: turn the model's reply into the parts array. */
export function parseCompletionContent(content: string): ParsePartResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiParseError("Failed to parse AI response as JSON", 500);
  }
  const parts = (parsed as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) {
    throw new AiParseError("AI response did not contain a parts array", 500);
  }
  return { parts: parts as AiParsedPart[] };
}

/** Production ChatCompleter: Groq primary, Claude (Haiku 4.5) fallback. */
export const parseCompleter: ChatCompleter = createFallbackCompleter({
  schema: PARTS_SCHEMA,
  schemaName: "parts",
});

/**
 * Defense against shape drift: coerce numbers, force draft status, validate the
 * matched IDs against the provided lists (a hallucinated id degrades to null),
 * and check each price against the prices the paste actually states.
 */
function normalizeParts(
  parts: AiParsedPart[],
  input: ParsePartInput,
): AiParsedPart[] {
  const catIds = new Set(input.categories.map((c) => c.id));
  const brandIds = new Set(input.brands.map((b) => b.id));
  const typeIds = new Set(input.partTypes.map((t) => t.id));
  // Empty means this paste uses a price format the extractor doesn't recognise,
  // in which case the cross-check is skipped rather than nulling good prices.
  const priceTokens = extractPriceTokens(input.rawText);

  for (const p of parts) {
    p.isActive = false;
    p.partNumber =
      typeof p.partNumber === "string" && p.partNumber.trim()
        ? p.partNumber.trim()
        : null;
    p.ownerSku =
      typeof p.ownerSku === "string" && p.ownerSku.trim()
        ? p.ownerSku.trim()
        : null;
    p.price = typeof p.price === "number" && p.price > 0 ? p.price : null;
    // A price the paste never states means the model dropped or shifted a
    // digit. Null it so the editor flags the row rather than shipping it.
    if (
      p.price != null &&
      priceTokens.length > 0 &&
      !priceMatchesRawText(p.price, priceTokens)
    ) {
      p.price = null;
    }
    p.costPrice =
      typeof p.costPrice === "number" && p.costPrice > 0
        ? p.costPrice
        : (p.price ?? null);
    if (
      p.costPrice != null &&
      priceTokens.length > 0 &&
      !priceMatchesRawText(p.costPrice, priceTokens)
    ) {
      p.costPrice = p.price ?? null;
    }
    p.stockQuantity =
      typeof p.stockQuantity === "number" && p.stockQuantity >= 0
        ? p.stockQuantity
        : 0;
    if (!p.categoryId || !catIds.has(p.categoryId)) p.categoryId = null;
    if (!p.brandId || !brandIds.has(p.brandId)) p.brandId = null;
    if (!p.partTypeId || !typeIds.has(p.partTypeId)) p.partTypeId = null;
    p.specifications = Array.isArray(p.specifications)
      ? p.specifications.filter((s) => s && s.name && s.value)
      : [];
  }
  return parts;
}

/**
 * Parse raw part text into structured parts. Long pastes are chunked into
 * separate sequential calls and merged, then normalized and de-duplicated across
 * the whole batch — see the product parser for why sequential.
 */
export async function parsePartText(
  input: ParsePartInput,
  complete: ChatCompleter = parseCompleter,
): Promise<ParsePartResult> {
  const chunks = chunkListings(input.rawText, MAX_LISTINGS_PER_CALL);
  const parts: AiParsedPart[] = [];

  for (const rawText of chunks) {
    const messages = buildParseMessages({ ...input, rawText });
    const content = await complete(messages);
    parts.push(...parseCompletionContent(content).parts);
  }

  return { parts: assignUniqueSlugs(normalizeParts(parts, input)) };
}
