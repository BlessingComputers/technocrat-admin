import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocShell, UploadingPartsDoc } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "uploading-parts");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function UploadingPartsHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <UploadingPartsDoc />
    </DocShell>
  );
}
