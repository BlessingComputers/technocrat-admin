import type { Metadata } from "next";
import { ProductBrowseView } from "@/features/products";

export const metadata: Metadata = {
  title: "Browse Products",
};

export default function ProductsBrowsePage() {
  return <ProductBrowseView />;
}
