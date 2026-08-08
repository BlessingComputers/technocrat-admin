import type { Metadata } from "next";
import { OrdersListView } from "@/features/orders";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return <OrdersListView />;
}
