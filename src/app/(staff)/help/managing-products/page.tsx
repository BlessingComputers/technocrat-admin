import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, ManagingProductsDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "managing-products");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function ManagingProductsHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <ManagingProductsDoc />
    </DocShell>
  );
}
