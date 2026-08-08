import type { Metadata } from "next";
import { GatewayOrderDetailView } from "@/features/orders";

export const metadata: Metadata = {
  title: "Order Detail",
};

export default async function GatewayOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GatewayOrderDetailView orderId={id} />;
}
