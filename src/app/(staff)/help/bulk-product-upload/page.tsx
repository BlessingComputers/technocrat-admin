import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, BulkProductUploadDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "bulk-product-upload");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function BulkProductUploadHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <BulkProductUploadDoc />
    </DocShell>
  );
}
