import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, RunningTreasureHuntsDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "running-treasure-hunts");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function RunningTreasureHuntsHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <RunningTreasureHuntsDoc />
    </DocShell>
  );
}
