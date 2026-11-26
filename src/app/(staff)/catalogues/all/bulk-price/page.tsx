import type { Metadata } from "next";
import { ProductBulkPriceView } from "@/features/products";

export const metadata: Metadata = {
  title: "Update Product Prices",
};

export default function ProductBulkPricePage() {
  return <ProductBulkPriceView />;
}
