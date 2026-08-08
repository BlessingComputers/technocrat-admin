import type { Metadata } from "next";
import { PaymentDetailView } from "@/features/payments";

export const metadata: Metadata = {
  title: "Payment Detail",
};

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaymentDetailView paymentId={id} />;
}
