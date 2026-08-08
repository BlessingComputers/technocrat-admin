import {
  formatNaira,
  parseNairaNullable,
  slugify,
} from "../../schemas/part-form";
import type {
  BulkCreatePartsDto,
  CreatePartDto,
  UploadedImageMeta,
} from "../../types/parts";

/** One image on a bulk row — a local file pre-upload, CDN metadata after. */
export interface BulkPartImage {
  id: string;
  key: string;
  /** Present only before upload (a freshly selected local File). */
  file?: File;
  /** Object URL (local) or CDN URL (after upload) for the thumbnail. */
  preview: string;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string;
  /** Set once the image is uploaded (Step 1); persisted in the draft. */
  uploaded?: UploadedImageMeta;
}

/** One editable part row in the bulk grid. Prices are naira-formatted strings. */
export interface BulkPartRow {
  id: string;
  name: string;
  partNumber: string;
  partTypeId: string;
  categoryId: string;
  brandId: string;
  ownerSku: string;
  description: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stockQuantity: number;
  isInStock: boolean;
  isActive: boolean;
  isFeatured: boolean;
  specifications: { name: string; value: string }[];
  images: BulkPartImage[];
}

export function newBulkPartRow(partial?: Partial<BulkPartRow>): BulkPartRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    partNumber: "",
    partTypeId: "",
    categoryId: "",
    brandId: "",
    ownerSku: "",
    description: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stockQuantity: 0,
    isInStock: true,
    isActive: false, // uploads land as drafts; staff activate after pricing
    isFeatured: false,
    specifications: [],
    images: [],
    ...partial,
  };
}

/** Selling price = cost + markup%. */
export function applySellMarkup(cost: number, pct: number): number {
  return Math.round(cost * (1 + pct / 100));
}

/** Part numbers worth flagging — those that appear on more than one row. */
export function findDuplicatePartNumbers(rows: BulkPartRow[]): Set<string> {
  const seen = new Map<string, number>();
  for (const r of rows) {
    const pn = r.partNumber.trim();
    if (pn) seen.set(pn, (seen.get(pn) ?? 0) + 1);
  }
  return new Set([...seen].filter(([, n]) => n > 1).map(([pn]) => pn));
}

/** Returns a list of human-readable problems with a row (empty = ready). */
export function validateBulkPartRow(
  row: BulkPartRow,
  duplicatePartNumbers: Set<string>,
): string[] {
  const errors: string[] = [];
  if (row.name.trim().length < 3) errors.push("Name is too short");
  if (!row.categoryId) errors.push("Category required");
  if (!row.brandId) errors.push("Brand required");
  if (!row.partTypeId) errors.push("Part type required");
  if (row.partNumber.trim() && duplicatePartNumbers.has(row.partNumber.trim()))
    errors.push("Duplicate part number");
  return errors;
}

/** Release blob: object URLs for images still held locally (pre-upload). */
export function revokeLocalImagePreviews(rows: BulkPartRow[]): void {
  for (const r of rows) {
    for (const img of r.images) {
      if (img.file && img.preview.startsWith("blob:")) {
        URL.revokeObjectURL(img.preview);
      }
    }
  }
}

function rowToCreatePart(row: BulkPartRow): CreatePartDto {
  const images: Record<
    string,
    { key: string; altText?: string; isPrimary: boolean; sortOrder?: number }
  > = {};
  for (const img of row.images) {
    if (!img.uploaded) continue; // only reference images that made it to the CDN
    images[img.key] = {
      key: img.key,
      altText: img.altText,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    };
  }

  return {
    name: row.name.trim(),
    slug: slugify(row.name),
    partNumber: row.partNumber.trim() || undefined,
    partTypeId: row.partTypeId || undefined,
    categoryId: row.categoryId,
    brandId: row.brandId,
    ownerSku: row.ownerSku.trim() || undefined,
    description: row.description.trim() || undefined,
    price: parseNairaNullable(row.price),
    compareAtPrice: parseNairaNullable(row.compareAtPrice),
    costPrice: parseNairaNullable(row.costPrice),
    stockQuantity: row.stockQuantity,
    isInStock: row.isInStock,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    sortOrder: 0,
    specifications: row.specifications
      .filter((s) => s.name && s.value)
      .map((s, i) => ({ name: s.name, value: s.value, sortOrder: i })),
    images: Object.keys(images).length ? images : undefined,
  } as CreatePartDto;
}

/** Assemble the two-step bulk payload (Step 2 body). */
export function buildBulkPartsPayload(rows: BulkPartRow[]): BulkCreatePartsDto {
  const uploadedImages: Record<string, UploadedImageMeta> = {};
  for (const r of rows) {
    for (const img of r.images) {
      if (img.uploaded) uploadedImages[img.key] = img.uploaded;
    }
  }
  return {
    idempotencyKey: crypto.randomUUID(),
    uploadedImages,
    parts: rows.map(rowToCreatePart),
  };
}

export { formatNaira };
