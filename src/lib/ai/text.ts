/**
 * Deterministic text helpers shared by the product and part smart-paste parsers.
 *
 * These cover the parts of a supplier listing that are pure string rules rather
 * than judgement: the URL slug (fully determined by the name), the price tokens
 * (a documented set of shorthand forms), and where one listing ends and the next
 * begins. Doing them in code instead of in the prompt costs no output tokens,
 * removes a class of model slip, and stays testable without an API call.
 */

/** Longest slug we emit. Long enough for a full spec-laden product name. */
const MAX_SLUG_LENGTH = 120;

/**
 * Turn a name into a URL-friendly slug: lowercase, ASCII, hyphen-separated.
 * Returns "" for a name with no alphanumerics, which `assignUniqueSlugs`
 * substitutes for.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, ""); // the slice may have left a trailing hyphen
}

/**
 * Give every item in a batch a slug derived from its name, unique within the
 * batch. Two listings whose names collide would otherwise produce the same slug
 * and the second upload would fail a duplicate constraint; here they become
 * `dell-pro-14` and `dell-pro-14-2`.
 *
 * Runs across the whole merged batch (all chunks), not per call, so uniqueness
 * holds for the paste as a whole.
 */
export function assignUniqueSlugs<T extends { name?: string; slug?: string }>(
  items: T[],
): T[] {
  const used = new Map<string, number>();
  for (const item of items) {
    const base = slugify(item.name ?? "") || "item";
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    item.slug = seen === 0 ? base : `${base}-${seen + 1}`;
  }
  return items;
}

/**
 * Price tokens as suppliers write them: a currency marker (@ # N or naira)
 * followed by digits, optionally with thousands commas, a decimal part, and a
 * k/M shorthand suffix. The marker must start a word so the bare-N form cannot
 * match the N inside a code like "PN12345".
 *
 * Held as a source string rather than one shared literal because a /g regex
 * carries `lastIndex` between uses: a single shared instance would let a
 * `hasPriceToken` call during chunking leave the cursor mid-string, and the
 * `extractPriceTokens` call that follows would start from there and find
 * nothing. `matchAll` inherits `lastIndex` too, so it is not immune.
 */
const PRICE_TOKEN_SOURCE =
  "(?<=^|[\\s(\\[])[@#₦N]\\s*([\\d,]*\\d(?:\\.\\d+)?)\\s*([kKmM])?";

/** Non-global, so `test` never advances a cursor. Safe to share. */
const PRICE_TOKEN_TEST_RE = new RegExp(PRICE_TOKEN_SOURCE, "mu");

/** Does this line carry a price? Used to find listing boundaries for chunking. */
export function hasPriceToken(line: string): boolean {
  return PRICE_TOKEN_TEST_RE.test(line);
}

/**
 * Every price the raw text states, in naira. "@1.1M" gives 1100000, "@45k"
 * gives 45000, "#970,000" gives 970000. Used to sanity-check what the model
 * returned: a decimal slip that turns 1,100,000 into 110,000 is invisible in the
 * editor but obvious against this list.
 */
export function extractPriceTokens(rawText: string): number[] {
  // A fresh instance per call — see PRICE_TOKEN_SOURCE on why not a shared one.
  const scanner = new RegExp(PRICE_TOKEN_SOURCE, "gmu");
  const prices: number[] = [];
  for (const match of rawText.matchAll(scanner)) {
    const digits = match[1].replace(/,/g, "");
    const value = Number.parseFloat(digits);
    if (!Number.isFinite(value)) continue;
    const suffix = match[2]?.toLowerCase();
    const multiplier = suffix === "m" ? 1_000_000 : suffix === "k" ? 1_000 : 1;
    prices.push(value * multiplier);
  }
  return prices;
}

/**
 * Is `price` one of the prices the raw text actually states?
 *
 * Deliberately conservative: callers must skip the check when `tokens` is empty,
 * so a paste using a price format this extractor does not know degrades to the
 * old behaviour (trust the model) rather than zeroing every row. The tolerance
 * absorbs float error from the k/M multipliers only.
 */
export function priceMatchesRawText(price: number, tokens: number[]): boolean {
  return tokens.some((token) => Math.abs(token - price) < 0.5);
}

/** Lines like "IN HOUSE" / "outsourced" that set sourcing for the whole paste. */
const SOURCING_HEADER_RE = /^\W*(in[\s-]?house|outsourced?)\W*$/i;
/** How far into the paste we look for that header. */
const SOURCING_HEADER_SCAN_LINES = 3;

/**
 * Split a paste into chunks of at most `maxListings` listings, treating a line
 * that carries a price token as the end of a listing.
 *
 * Why: one call for a 60-listing paste both risks silent output truncation and
 * spreads the model's attention thin, which shows up as dropped specs on the
 * later listings. At or below the threshold this returns the text unchanged, so
 * the common single-call case behaves exactly as it did before.
 *
 * The sourcing header ("in house" / "outsourced") governs every product but
 * appears only at the top, so it is carried onto each later chunk. Lines
 * trailing the final price token ride along with the last chunk.
 */
export function chunkListings(rawText: string, maxListings: number): string[] {
  const lines = rawText.split(/\r?\n/);
  const listingCount = lines.filter(hasPriceToken).length;
  if (listingCount <= maxListings) return [rawText];

  const header = lines
    .slice(0, SOURCING_HEADER_SCAN_LINES)
    .find((line) => SOURCING_HEADER_RE.test(line));

  const chunks: string[] = [];
  let current: string[] = [];
  /** Lines we seeded into `current` (the carried header), not the paste's own. */
  let seeded = 0;
  let listingsInChunk = 0;

  for (const line of lines) {
    current.push(line);
    if (!hasPriceToken(line)) continue;
    listingsInChunk += 1;
    if (listingsInChunk < maxListings) continue;
    chunks.push(current.join("\n"));
    current = header ? [header] : [];
    seeded = current.length;
    listingsInChunk = 0;
  }

  // Whatever trails the final price token (a short last listing, or stray lines)
  // joins the previous chunk rather than forming a chunk with no listing in it.
  // The carried header is dropped first so it is not repeated mid-chunk.
  const tailLines = current.slice(seeded);
  const tail = tailLines.join("\n");
  if (tail.trim()) {
    if (chunks.length) chunks[chunks.length - 1] += "\n" + tail;
    else chunks.push(tail);
  }

  return chunks;
}
