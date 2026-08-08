import type { QueryClient } from "@tanstack/react-query";
import type { AiParsedProduct, ParseCategory } from "@/lib/ai/product-parser";
import type { ProductBrand, ProductCategory } from "../types/products";
import { productKeys } from "./products.queries";
import { productsService } from "./products.service";

/**
 * Client helper that calls the AI parse route. Shared by the bulk-upload paste
 * panel and the single-product form fill, so the taxonomy assembly + request
 * shape live in one place.
 */

/**
 * Build the CATEGORIES payload (each category + its subcategories) the model
 * matches against. Best-effort: a category whose subcategories can't be loaded
 * is sent with an empty list rather than failing the whole parse.
 */
async function buildParseTaxonomy(
  queryClient: QueryClient,
  categories: ProductCategory[],
): Promise<ParseCategory[]> {
  const results = await Promise.allSettled(
    categories.map((c) =>
      queryClient.fetchQuery({
        queryKey: [...productKeys.subcategories, c.id, undefined],
        queryFn: () => productsService.getSubcategories(c.id),
        staleTime: 5 * 60 * 1000,
      }),
    ),
  );
  return categories.map((c, i) => {
    const r = results[i];
    const subs = r.status === "fulfilled" ? r.value : [];
    return {
      id: c.id,
      name: c.name,
      subcategories: subs.map((s) => ({ id: s.id, name: s.name })),
    };
  });
}

/** Parse raw supplier text into products. Throws with a user-facing message. */
export async function parseProductsViaAi(params: {
  rawText: string;
  categories: ProductCategory[];
  brands: ProductBrand[];
  queryClient: QueryClient;
}): Promise<AiParsedProduct[]> {
  const taxonomy = await buildParseTaxonomy(params.queryClient, params.categories);
  const res = await fetch("/api/admin/products/ai-parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rawText: params.rawText,
      categories: taxonomy,
      brands: params.brands.map((b) => ({ id: b.id, name: b.name })),
    }),
  });
  const data: { products?: AiParsedProduct[]; error?: string } = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to parse text");
  return data.products ?? [];
}
