import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, GettingStartedDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "getting-started");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function GettingStartedHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <GettingStartedDoc />
    </DocShell>
  );
}
