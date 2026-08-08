import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, ManagingCustomersDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "managing-customers");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function ManagingCustomersHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <ManagingCustomersDoc />
    </DocShell>
  );
}
