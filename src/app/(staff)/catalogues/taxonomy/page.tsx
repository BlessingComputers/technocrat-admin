import type { Metadata } from "next";
import { ProductTaxonomyView } from "@/features/products";

export const metadata: Metadata = {
  title: "Brands & Categories",
};

export default function ProductTaxonomyPage() {
  // Part Types management now lives under Parts (`/catalogues/parts/types`), not
  // here — so this page is just Brands & Categories.
  return <ProductTaxonomyView />;
}
