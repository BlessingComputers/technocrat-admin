import type { Metadata } from "next";
import { ProductFormView } from "@/features/products";

export const metadata: Metadata = {
  title: "Edit Product",
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductFormView productId={id} />;
}
