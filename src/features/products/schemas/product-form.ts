import { z } from "zod";
import type { CreateProductDto, ProductDetail } from "../types/products";

/**
 * Form input schema (ADR-0006: Zod owns request/form inputs; responses come from
 * codegen). Prices are edited as formatted naira strings and parsed to numbers
 * on submit.
 */
// The single pricing/inventory record behind every product. The variant
// concept is no longer exposed: `name` is always "Default". The SKU is the
// product's part number and is required.
export const variantFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().trim().min(1, "Part number is required"),
  condition: z.enum(["NEW", "REFURBISHED", "USED", "OPEN_BOX"]),
  sourcingType: z.enum(["INHOUSE", "OUTSOURCED"]),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string().optional(),
  stockQuantity: z.number().min(0),
  lowStockThreshold: z.number().min(0),
});

export const productFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(500),
  slug: z.string().min(2, "Slug is required"),
  categoryId: z.string().min(1, "Select a category"),
  subcategoryId: z.string().optional(), // optional; must belong to categoryId
  brandId: z.string().min(1, "Select a brand"),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .optional()
    .or(z.literal("")),
  // Always exactly one record (the variant concept is hidden); kept as an array
  // because the backend create/update DTO is still variant-keyed.
  variants: z.array(variantFormSchema).length(1),
  specifications: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      value: z.string().min(1, "Value is required"),
      sortOrder: z.number(),
    }),
  ),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type VariantFormValues = z.infer<typeof variantFormSchema>;

// ── Naira formatting helpers ────────────────────────────────────────────

export function formatNaira(value: string | number | undefined): string {
  if (value === undefined || value === "") return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  const formatted = new Intl.NumberFormat("en-NG")
    .format(Number(digits))
    .replace(/,/g, " ");
  return `₦${formatted}`;
}

export function parseNaira(formatted: string | undefined): number {
  if (!formatted) return 0;
  return Number(formatted.replace(/[^0-9]/g, "")) || 0;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ── Mapping helpers ─────────────────────────────────────────────────────

const EMPTY_VARIANT: VariantFormValues = {
  name: "Default",
  sku: "",
  condition: "NEW",
  sourcingType: "OUTSOURCED",
  price: "₦0",
  costPrice: "₦0",
  stockQuantity: 0,
  lowStockThreshold: 5,
};

/** Build RHF default values from an existing product (edit) or blank (create). */
export function toFormDefaults(initial?: ProductDetail): ProductFormValues {
  return {
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    categoryId: initial?.categoryId ?? "",
    subcategoryId: initial?.subcategoryId ?? "",
    brandId: initial?.brandId ?? "",
    isActive: initial?.isActive ?? true,
    isFeatured: initial?.isFeatured ?? false,
    description: initial?.description ?? "",
    specifications:
      initial?.specifications?.map((s) => ({
        name: s.name,
        value: s.value,
        sortOrder: s.sortOrder ?? 0,
      })) ?? [],
    // Each product has a single pricing record; edit only the first.
    variants: [
      initial?.variants?.[0]
        ? {
            id: initial.variants[0].id,
            name: initial.variants[0].name || "Default",
            sku: initial.variants[0].sku ?? "",
            condition:
              (initial.variants[0]
                .condition as VariantFormValues["condition"]) || "NEW",
            sourcingType:
              (initial.variants[0]
                .sourcingType as VariantFormValues["sourcingType"]) ||
              "OUTSOURCED",
            price: formatNaira(initial.variants[0].price),
            costPrice: formatNaira(initial.variants[0].costPrice),
            stockQuantity: Number(initial.variants[0].stockQuantity) || 0,
            lowStockThreshold:
              Number(initial.variants[0].lowStockThreshold) || 5,
          }
        : initial
          ? // Editing a product whose only variant is inactive — the detail
            // endpoint hides it, so it loads as if it had none (see
            // VariantsSection). The variant fields are disabled in that state,
            // and this placeholder is NEVER persisted (updateProduct skips
            // id-less variants), but it must satisfy the schema so product-level
            // edits can still be saved. The variant itself is repaired by the
            // backfill, not here.
            { ...EMPTY_VARIANT, sku: "—" }
          : { ...EMPTY_VARIANT },
    ],
  };
}

export { EMPTY_VARIANT };

/** Map validated form values to the create/update DTO. */
export function toCreateDto(values: ProductFormValues): CreateProductDto {
  return {
    name: values.name,
    slug: values.slug,
    categoryId: values.categoryId,
    // Optional — only sent when chosen (backend accepts it omitted).
    subcategoryId: values.subcategoryId || undefined,
    brandId: values.brandId,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    description: values.description || undefined,
    specifications: values.specifications.map((s, idx) => ({
      name: s.name,
      value: s.value,
      sortOrder: s.sortOrder || idx,
    })),
    variants: values.variants.map((v) => ({
      id: v.id,
      name: v.name || "Default",
      sku: v.sku.trim() || undefined,
      price: parseNaira(v.price),
      costPrice: parseNaira(v.costPrice),
      stockQuantity: Number(v.stockQuantity),
      lowStockThreshold: Number(v.lowStockThreshold),
      condition: v.condition,
      sourcingType: v.sourcingType,
    })),
  };
}
