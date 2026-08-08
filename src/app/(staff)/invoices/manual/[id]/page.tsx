import type { Metadata } from "next";
import { ManualInvoiceDetailView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Manual Invoice",
};

export default async function ManualInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManualInvoiceDetailView manualInvoiceId={id} />;
}
