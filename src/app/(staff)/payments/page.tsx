import type { Metadata } from "next";
import { PaymentsListView } from "@/features/payments";

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsPage() {
  return <PaymentsListView />;
}
