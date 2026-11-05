import type { Metadata } from "next";
import { BulkPartsView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Bulk Upload Parts",
};

/**
 * Bulk-create parts for a product (`/catalogues/[id]/parts/bulk`). Same query
 * params as `/catalogues/[id]/parts/new`: new rows inherit the product's part
 * number (`?sku=`) and taxonomy, and the created parts are linked to the
 * product when the batch completes. Bulk rows carry no subcategory, so
 * `?subcategoryId=` is ignored here.
 */
export default async function BulkProductPartsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sku?: string;
    categoryId?: string;
    brandId?: string;
  }>;
}) {
  const { id } = await params;
  const { sku, categoryId, brandId } = await searchParams;
  return (
    <BulkPartsView
      productContext={{
        productId: id,
        ownerSku: sku ?? "",
        categoryId,
        brandId,
      }}
    />
  );
}
