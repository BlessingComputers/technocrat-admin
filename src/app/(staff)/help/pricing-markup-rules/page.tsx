import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, PricingMarkupRulesDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "pricing-markup-rules");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function PricingMarkupRulesHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <PricingMarkupRulesDoc />
    </DocShell>
  );
}
