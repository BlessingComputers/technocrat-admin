import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, RunningDealsDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "running-deals");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function RunningDealsHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <RunningDealsDoc />
    </DocShell>
  );
}
