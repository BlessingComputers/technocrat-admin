import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, ProcessingOrdersDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "processing-orders");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function ProcessingOrdersHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <ProcessingOrdersDoc />
    </DocShell>
  );
}
