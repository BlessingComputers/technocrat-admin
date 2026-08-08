import { z } from "zod";
import type {
  CreatePartDto,
  PartDetail,
  UpdatePartDto,
} from "../types/parts";

/**
 * Part form input (ADR-0006: Zod owns request/form inputs). A part is flat —
 * pricing/stock live on the part itself, no variants. Prices are edited as
 * formatted naira strings and parsed on submit; an empty price means "price on
 * request" (the part's `price` is nullable) and maps to null, not 0.
 */
export const partFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(255),
  slug: z.string().min(2, "Slug is required"),
  partNumber: z.string().optional().or(z.literal("")),
  partTypeId: z.string().min(1, "Select a part type"),
  categoryId: z.string().min(1, "Select a category"),
  // Carried (usually inherited from the product), not a visible picker. Sent in
  // the payload when present. Cleared if the category changes.
  subcategoryId: z.string().optional(),
  brandId: z.string().min(1, "Select a brand"),
  ownerSku: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .optional()
    .or(z.literal("")),
  // Naira-formatted strings; empty `price` → null (price on request).
  price: z.string().optional().or(z.literal("")),
  compareAtPrice: z.string().optional().or(z.literal("")),
  costPrice: z.string().optional().or(z.literal("")),
  stockQuantity: z.number().min(0),
  isInStock: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().min(0),
  specifications: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      value: z.string().min(1, "Value is required"),
      sortOrder: z.number(),
    }),
  ),
});

export type PartFormValues = z.infer<typeof partFormSchema>;

// ── Naira formatting helpers (kept local — no cross-feature imports) ────

export function formatNaira(value: string | number | null | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  const formatted = new Intl.NumberFormat("en-NG")
    .format(Number(digits))
    .replace(/,/g, " ");
  return `₦${formatted}`;
}

/** Parse a naira string to a number, or null when blank (price on request). */
export function parseNairaNullable(
  formatted: string | undefined,
): number | null {
  if (!formatted) return null;
  const n = Number(formatted.replace(/[^0-9]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ── Mapping helpers ─────────────────────────────────────────────────────

const EMPTY_FORM: PartFormValues = {
  name: "",
  slug: "",
  partNumber: "",
  partTypeId: "",
  categoryId: "",
  subcategoryId: "",
  brandId: "",
  ownerSku: "",
  description: "",
  price: "",
  compareAtPrice: "",
  costPrice: "",
  stockQuantity: 0,
  isInStock: true,
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  specifications: [],
};

/**
 * Build form defaults from an existing part (edit) or blank (create).
 * `categoryId`/`brandId`/`costPrice` come up blank until the backend echoes them
 * on the part response (backend ask #1) — read defensively via `PartDetail`.
 */
export function toFormDefaults(initial?: PartDetail): PartFormValues {
  if (!initial) return { ...EMPTY_FORM };
  return {
    name: initial.name ?? "",
    slug: initial.slug ?? slugify(initial.name ?? ""),
    partNumber: initial.partNumber ?? "",
    partTypeId: initial.partTypeId ?? "",
    categoryId: initial.categoryId ?? "",
    subcategoryId: initial.subcategoryId ?? "",
    brandId: initial.brandId ?? "",
    ownerSku: initial.ownerSku ?? "",
    description: initial.description ?? "",
    price: formatNaira(initial.price),
    compareAtPrice: formatNaira(initial.compareAtPrice),
    costPrice: formatNaira(initial.costPrice),
    stockQuantity: Number(initial.stockQuantity) || 0,
    isInStock: initial.isInStock ?? true,
    isActive: initial.isActive ?? true,
    isFeatured: initial.isFeatured ?? false,
    sortOrder: Number(initial.sortOrder) || 0,
    specifications:
      initial.specifications?.map((s, idx) => ({
        name: s.name,
        value: s.value,
        sortOrder: s.sortOrder ?? idx,
      })) ?? [],
  };
}

/** Shared field mapping for create/update bodies. */
function toBaseDto(values: PartFormValues) {
  return {
    name: values.name,
    slug: values.slug,
    partNumber: values.partNumber || undefined,
    partTypeId: values.partTypeId || undefined,
    categoryId: values.categoryId,
    // subcategoryId isn't in CreatePartRequest yet (backend ask) — sent anyway;
    // the cast on the return keeps it out of the typed surface.
    subcategoryId: values.subcategoryId || undefined,
    brandId: values.brandId,
    ownerSku: values.ownerSku || undefined,
    description: values.description || undefined,
    price: parseNairaNullable(values.price),
    compareAtPrice: parseNairaNullable(values.compareAtPrice),
    costPrice: parseNairaNullable(values.costPrice),
    stockQuantity: Number(values.stockQuantity),
    isInStock: values.isInStock,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    sortOrder: Number(values.sortOrder),
    specifications: values.specifications.map((s, idx) => ({
      name: s.name,
      value: s.value,
      sortOrder: s.sortOrder || idx,
    })),
  };
}

export function toCreateDto(values: PartFormValues): CreatePartDto {
  return toBaseDto(values) as CreatePartDto;
}

export function toUpdateDto(values: PartFormValues): UpdatePartDto {
  return toBaseDto(values) as UpdatePartDto;
}

export { EMPTY_FORM };
