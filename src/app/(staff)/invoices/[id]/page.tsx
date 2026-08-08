import type { Metadata } from "next";
import { InvoiceDetailView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Invoice Detail",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceDetailView invoiceId={id} />;
}
