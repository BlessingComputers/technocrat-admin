import type { Metadata } from "next";
import { ProductFormView } from "@/features/products";

export const metadata: Metadata = {
  title: "New Product",
};

export default function NewProductPage() {
  return <ProductFormView />;
}
