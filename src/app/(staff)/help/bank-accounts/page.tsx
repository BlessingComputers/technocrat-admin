import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BankAccountsDoc, DocShell } from "@/features/help";
import { helpDocs } from "@/config/help-docs";

const doc = helpDocs.find((d) => d.slug === "bank-accounts");

export const metadata: Metadata = {
  title: doc?.title ?? "Help",
};

export default function BankAccountsHelpPage() {
  if (!doc) notFound();
  return (
    <DocShell doc={doc}>
      <BankAccountsDoc />
    </DocShell>
  );
}
