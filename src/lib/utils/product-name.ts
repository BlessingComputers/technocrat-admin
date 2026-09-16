/**
 * Supplier product names are spec dumps. These split one into the part that
 * names the product and the part that lists what is inside it.
 *
 * This is the storefront's treatment, ported so staff read the same product
 * identity customers do (customer app: `src/shared/utils/product-name.ts`).
 * The two copies are deliberate — the apps ship separately and share nothing at
 * the filesystem level — so keep them in step when either changes.
 */

/**
 * Where a supplier name stops describing the product and starts listing its
 * specs. Real catalog names look like:
 *
 *   "HP Laptop 15-fd0100nia - Intel Core 5-120U Processor, 8GB DDR5 RAM, …"
 *
 * Rendered whole, that is a four-line page title and a truncated table cell.
 * Split at the first dash-like separator, or failing that the first comma.
 */
const NAME_SPLIT = /\s+[-–—]\s+|,\s+/;

/** Specs worth putting in the one-line summary, most decisive first. */
const SPEC_LINE_PRIORITY = [
  /^process|^cpu\b/i,
  /^ram\b|^memory\b/i,
  /^storage\b|^ssd\b|^hdd\b|^drive\b/i,
  /^graphic|^gpu\b/i,
  /^display\b|^screen\b/i,
];

const SPEC_LINE_MAX = 4;

/** Specs never worth showing in the summary line. */
const SPEC_LINE_EXCLUDE = /^part\s*number$|^sku$/i;

/**
 * The product name with the supplier's trailing spec dump removed — what a
 * page title or a table row should say. Falls back to the full name when there
 * is no separator, because a truncated product name is a wrong product name.
 */
export function getProductTitle(name: string | undefined | null): string {
  const full = (name ?? "").trim();
  if (!full) return "";

  const [head] = full.split(NAME_SPLIT);
  const title = head?.trim();

  // A separator that leaves almost nothing behind ("HP, Laptop 15-fd…") means
  // we split on the wrong thing. Keep the full name instead.
  return title && title.length >= 8 ? title : full;
}

/**
 * The scannable one-line summary shown under the title, e.g.
 * `Intel Core 5-120U · 8GB DDR5 RAM · 512GB PCIe NVMe SSD`.
 *
 * Prefers the structured `specifications[]` because those are curated. Falls
 * back to the tail of the product name, which is where suppliers put the same
 * information when the structured specs are missing — and which is all a list
 * row has, since `ProductSummary` carries no specifications.
 */
export function getProductSpecLine(product: {
  name?: string | null;
  specifications?: Array<{ name: string; value: string; sortOrder?: number }>;
}): string {
  const specs = (product.specifications ?? []).filter(
    (s) => s?.value?.trim() && !SPEC_LINE_EXCLUDE.test(s.name?.trim() ?? ""),
  );

  if (specs.length > 0) {
    const picked: string[] = [];

    for (const pattern of SPEC_LINE_PRIORITY) {
      const match = specs.find((s) => pattern.test(s.name.trim()));
      if (match) picked.push(match.value.trim());
      if (picked.length === SPEC_LINE_MAX) break;
    }

    // Nothing matched the priority list — fall back to the first few specs in
    // the order the merchandiser set.
    if (picked.length === 0) {
      picked.push(
        ...[...specs]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .slice(0, SPEC_LINE_MAX)
          .map((s) => s.value.trim()),
      );
    }

    if (picked.length > 0) return picked.join(" · ");
  }

  // No usable specs: recover the summary from the tail of the name.
  const full = (product.name ?? "").trim();
  const title = getProductTitle(full);
  if (!full || title === full) return "";

  return full
    .slice(title.length)
    .replace(/^(\s+[-–—]\s+|,\s+)/, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, SPEC_LINE_MAX)
    .join(" · ");
}
