"use client";

import { ProductDetailView } from "@/features/products";
import { ProductPartsPanel } from "@/features/parts";

/**
 * App-layer composition of the product detail view with the parts feature.
 * Lives in the route (not the products feature) so the products feature never
 * imports the parts feature (boundary rule). It's a Client Component because the
 * `partsSlot` render prop is a function — functions can't cross the server→client
 * boundary, but client→client is fine, so the server page renders this wrapper
 * and passes only the serializable `productId`.
 */
export function ProductDetailRoute({ productId }: { productId: string }) {
  return (
    <ProductDetailView
      productId={productId}
      partsSlot={(args: any) => <ProductPartsPanel {...args} />}
    />
  );
}
