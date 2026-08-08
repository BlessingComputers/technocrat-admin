import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Brand, Category } from "../types/parts";

/**
 * Categories + brands for the part form/filter pickers. The parts feature can't
 * import the products feature (boundary rule), so it reads the same shared
 * endpoints through its own thin service. Read-only — managing categories/brands
 * stays in the products taxonomy.
 */
export const partTaxonomyService = {
  getCategories: () =>
    api.get<Category[]>(API_ENDPOINTS.products.categories),
  getBrands: () => api.get<Brand[]>(API_ENDPOINTS.products.brands),
};
