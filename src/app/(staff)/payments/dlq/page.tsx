import type { Metadata } from "next";
import { DlqListView } from "@/features/payments";

export const metadata: Metadata = {
  title: "Payments · Dead Letter Queue",
};

export default function PaymentsDlqPage() {
  return <DlqListView />;
}
