import type { Metadata } from "next";
import { ProductsHubView } from "@/features/products";

export const metadata: Metadata = {
  title: "Catalogues",
};

export default function ProductsPage() {
  return <ProductsHubView />;
}
