import type { AiParsedProduct } from "@/lib/ai/product-parser";
import type {
  BulkProductImageRef,
  CreateProductDto,
  UploadedImageMeta,
} from "../../types/products";
import { formatNaira, parseNaira, slugify } from "../../schemas/product-form";

/**
 * The pricing/inventory carrier for a bulk row. Each product has exactly one
 * (named "Default"); the variant concept is no longer exposed. Prices are
 * formatted-naira strings, like the form. `sku` is the product's part number
 * and is required before the row can be uploaded.
 */
export interface BulkVariant {
  id: string;
  name: string;
  price: string;
  costPrice: string;
  compareAtPrice: string;
  /** The part number — used as the SKU. Required to upload. */
  sku: string;
  condition: "NEW" | "REFURBISHED" | "USED" | "OPEN_BOX";
  sourcingType: "INHOUSE" | "OUTSOURCED";
  stockQuantity: number;
  lowStockThreshold: number;
  weight: string;
  imageUrl: string;
  isActive: boolean;
}

export interface BulkSpec {
  id: string;
  name: string;
  value: string;
}

/**
 * One gallery image attached to a bulk row. Two-step flow: the file is held
 * locally until import, pre-uploaded via POST /products/images/bulk-upload,
 * then referenced by `key` in the bulk-create payload.
 */
export interface BulkImage {
  id: string;
  /** Present until uploaded; absent on images restored from a draft/cache. */
  file?: File;
  /** Unique key within the batch ([a-zA-Z0-9_-] only). */
  key: string;
  isPrimary: boolean;
  sortOrder: number;
  altText: string;
  /** Object URL for local files; the CDN URL once uploaded. */
  preview: string;
  /** Set after a successful Step-1 upload — reused on retry, never re-uploaded. */
  uploaded?: UploadedImageMeta;
}

/** One product in the bulk-upload review (full parity: variants + specs). */
export interface BulkRow {
  id: string;
  name: string;
  categoryId: string;
  subcategoryId: string; // optional; "" when none
  brandId: string;
  description: string;
  isActive: boolean;
  isFeatured: boolean;
  variants: BulkVariant[];
  specifications: BulkSpec[];
  images: BulkImage[];
}

export function newBulkVariant(name = "Default"): BulkVariant {
  return {
    id: crypto.randomUUID(),
    name,
    price: "",
    costPrice: "",
    compareAtPrice: "",
    sku: "",
    condition: "NEW",
    sourcingType: "OUTSOURCED",
    stockQuantity: 0,
    lowStockThreshold: 5,
    weight: "",
    imageUrl: "",
    // The variant is always active — the product-level `isActive: false` draft
    // flag is what keeps the listing off the storefront. An inactive variant is
    // excluded from price/availability and the detail `variants` array, which
    // makes a bulk-created product look like it has no variant (no price, and
    // the edit form's "missing default variant" path fires).
    isActive: true,
  };
}

/**
 * Selling price from a supplier (cost) price and the view's top-level markup
 * percentage. Rounded UP to the next whole naira.
 */
export function applySellMarkup(cost: number, markupPct: number): number {
  return Math.ceil(cost * (1 + markupPct / 100));
}

export function newBulkSpec(): BulkSpec {
  return { id: crypto.randomUUID(), name: "", value: "" };
}

/** Wrap a local file as a BulkImage with a batch-unique, API-safe key. */
export function newBulkImage(
  file: File,
  productName: string,
  opts: { isPrimary: boolean; sortOrder: number },
): BulkImage {
  const id = crypto.randomUUID().slice(0, 8);
  const slug =
    (productName || "product")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "product";
  return {
    id,
    file,
    key: `${slug}-img-${id}`,
    isPrimary: opts.isPrimary,
    sortOrder: opts.sortOrder,
    altText: "",
    preview: URL.createObjectURL(file),
  };
}

export function newBulkRow(): BulkRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    categoryId: "",
    subcategoryId: "",
    brandId: "",
    description: "",
    isActive: false,
    isFeatured: false,
    variants: [newBulkVariant()],
    specifications: [],
    images: [],
  };
}

/**
 * Map an AI-parsed product to an editable row. The parsed price is the SUPPLIER
 * (cost) price; on upload the selling price is set EQUAL to the cost — profit is
 * activated later via the markup engine, not at upload. Any non-zero `markupPct`
 * still applies on top (default is 0, so selling == cost). Products start
 * inactive (drafts). Each product carries a single "Default" variant.
 */
export function aiProductToRow(p: AiParsedProduct, markupPct: number): BulkRow {
  const variant = newBulkVariant("Default");
  const cost = p.price ?? 0;
  variant.costPrice = cost > 0 ? formatNaira(cost) : "";
  variant.price = cost > 0 ? formatNaira(applySellMarkup(cost, markupPct)) : "";
  variant.sku = p.sku ?? "";
  variant.sourcingType = p.sourcingType ?? "OUTSOURCED";
  variant.stockQuantity = p.stockQuantity ?? 0;
  // Variant stays active; the product (below) is the draft. See newBulkVariant.
  return {
    id: crypto.randomUUID(),
    name: p.name ?? "",
    categoryId: p.categoryId ?? "",
    subcategoryId: p.subcategoryId ?? "",
    brandId: p.brandId ?? "",
    description: p.description ?? "",
    isActive: false,
    isFeatured: false,
    variants: [variant],
    specifications: (p.specifications ?? []).map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      value: s.value,
    })),
    // Recovery of uploaded images lives in the draft store (whole-batch
    // persistence), not a per-name cache — a fresh parse starts with none.
    images: [],
  };
}

/** SKUs (part numbers, case-insensitive) used by more than one row in the batch. */
export function findDuplicateSkus(rows: BulkRow[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const row of rows) {
    const sku = row.variants[0]?.sku.trim().toUpperCase();
    if (!sku) continue;
    if (seen.has(sku)) dupes.add(sku);
    else seen.add(sku);
  }
  return dupes;
}

/**
 * Per-row validation; empty array means the row is importable. The SKU is the
 * part number — required, and unique across the batch (the backend rejects
 * duplicates). Pass the batch's `findDuplicateSkus` result to flag collisions.
 */
export function validateBulkRow(
  row: BulkRow,
  duplicateSkus?: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  if (row.name.trim().length < 3) errors.push("Name too short");
  if (!row.categoryId) errors.push("Category required");
  if (!row.brandId) errors.push("Brand required");
  const price = parseNaira(row.variants[0]?.price);
  const costPrice = parseNaira(row.variants[0]?.costPrice);
  if (price <= 0) errors.push("Price required");
  // Cost is variant-required by the backend (must be positive and ≤ price). A
  // blank Cost sends costPrice: 0, which the backend rejects — failing the
  // variant insert while the product may still be created.
  if (costPrice <= 0) errors.push("Cost price required");
  else if (price > 0 && costPrice > price)
    errors.push("Cost price exceeds price");
  const sku = row.variants[0]?.sku.trim();
  if (!sku) errors.push("Part number required");
  else if (duplicateSkus?.has(sku.toUpperCase()))
    errors.push(`Duplicate part number: ${sku}`);
  return errors;
}

/**
 * Turn a raw per-row bulk error (frequently a raw Prisma/DB message) into a
 * human-readable line for the results UI. The backend worker currently stores
 * the raw `err.message`, so a duplicate part number arrives as
 * "Unique constraint failed on the fields: (`sku`)".
 *
 * The canonical fix is server-side (translate Prisma P2002 before returning);
 * this is the frontend safety net so ORM internals never reach an admin and
 * common failures read plainly. Unmapped, non-technical messages pass through.
 */
export function humanizeBulkRowError(raw?: string): string {
  const message = (raw ?? "").trim();
  if (!message) return "Unknown error";

  // Prisma unique-constraint violation → name the colliding field in plain terms.
  if (/unique constraint/i.test(message)) {
    const fields =
      /fields?:\s*\(?`?([a-z0-9_,\s`]+?)`?\)?\s*$/i
        .exec(message)?.[1]
        ?.toLowerCase() ?? "";
    if (fields.includes("sku"))
      return "A product with this part number (SKU) already exists.";
    if (fields.includes("slug") || fields.includes("name"))
      return "A product with this name already exists.";
    return "This product duplicates one that already exists.";
  }

  // Any remaining raw ORM/DB text is scrubbed so internals never surface.
  if (/prisma|invocation|\bdatabase\b|constraint|\bsql\b/i.test(message)) {
    return "Couldn't save this product. Please check the row and try again.";
  }

  return message;
}

/**
 * Release the object URLs behind file-backed image previews. Call whenever
 * rows leave the editor without going through the image section's own remove
 * button (row delete, post-upload pruning, page unmount) — otherwise the
 * blobs pin the original File bytes until a hard navigation.
 */
export function revokeLocalImagePreviews(rows: BulkRow[]): void {
  for (const row of rows) {
    for (const img of row.images) {
      if (img.file) URL.revokeObjectURL(img.preview);
    }
  }
}

/** A row's gallery block: only images with CDN metadata, keyed for the API. */
function buildImagesBlock(row: BulkRow): Record<string, BulkProductImageRef> {
  return Object.fromEntries(
    row.images
      .filter((img) => img.uploaded)
      .map((img) => [
        img.key,
        {
          key: img.key,
          isPrimary: img.isPrimary,
          sortOrder: img.sortOrder,
          ...(img.altText.trim() ? { altText: img.altText.trim() } : {}),
        },
      ]),
  );
}

/** Build the bulk-create payload from valid rows (images must be pre-uploaded). */
export function buildBulkPayload(rows: BulkRow[]): {
  idempotencyKey: string;
  uploadedImages: Record<string, UploadedImageMeta>;
  products: CreateProductDto[];
} {
  // Batch-wide key→metadata map (required by the API; {} when no images).
  const uploadedImages: Record<string, UploadedImageMeta> = {};
  for (const row of rows) {
    for (const img of row.images) {
      if (img.uploaded) uploadedImages[img.key] = img.uploaded;
    }
  }
  return {
    idempotencyKey: crypto.randomUUID(),
    uploadedImages,
    products: rows.map((row) => ({
      name: row.name.trim(),
      slug: slugify(row.name),
      categoryId: row.categoryId,
      // Optional — only sent when chosen (backend accepts it omitted).
      ...(row.subcategoryId ? { subcategoryId: row.subcategoryId } : {}),
      brandId: row.brandId,
      isActive: row.isActive,
      isFeatured: row.isFeatured,
      description: row.description || undefined,
      specifications: row.specifications
        .filter((s) => s.name.trim() && s.value.trim())
        .map((s, idx) => ({
          name: s.name.trim(),
          value: s.value.trim(),
          sortOrder: idx,
        })),
      ...(row.images.some((img) => img.uploaded)
        ? { images: buildImagesBlock(row) }
        : {}),
      variants: row.variants.map((v) => ({
        name: v.name.trim() || "Default",
        sku: v.sku.trim() || undefined,
        condition: v.condition,
        sourcingType: v.sourcingType,
        price: parseNaira(v.price),
        costPrice: parseNaira(v.costPrice),
        compareAtPrice: v.compareAtPrice ? parseNaira(v.compareAtPrice) : undefined,
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        weight: v.weight ? Number(v.weight) : undefined,
        imageUrl: v.imageUrl.trim() || undefined,
        isActive: v.isActive,
      })),
    })),
  };
}
