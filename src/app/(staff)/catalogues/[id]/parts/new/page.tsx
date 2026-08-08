import type { Metadata } from "next";
import { PartFormView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Add Part",
};

/**
 * Create a part in the context of a product (`/catalogues/[id]/parts/new`). The
 * product passes its part number (`?sku=`) and taxonomy (`?categoryId=`,
 * `?subcategoryId=`, `?brandId=`) so the new part inherits them; on save the part
 * is created with that payload and linked to this product.
 */
export default async function NewProductPartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sku?: string;
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
  }>;
}) {
  const { id } = await params;
  const { sku, categoryId, subcategoryId, brandId } = await searchParams;
  return (
    <PartFormView
      productContext={{
        productId: id,
        ownerSku: sku ?? "",
        categoryId,
        subcategoryId,
        brandId,
      }}
    />
  );
}
