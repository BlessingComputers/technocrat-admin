import type { Metadata } from "next";
import { ProductDetailRoute } from "./product-detail-route";

export const metadata: Metadata = {
  title: "Product Detail",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Compose the parts feature into the product page via an app-layer client
  // wrapper so the products feature never imports the parts feature (boundary
  // rule), and the `partsSlot` function is passed client→client, not from this
  // Server Component (which can't pass functions to Client Components).
  return <ProductDetailRoute productId={id} />;
}
