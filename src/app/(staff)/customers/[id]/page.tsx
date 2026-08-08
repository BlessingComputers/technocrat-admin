import type { Metadata } from "next";
import { CustomerDetailView } from "@/features/customers";

export const metadata: Metadata = {
  title: "Customer Detail",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetailView customerId={id} />;
}
