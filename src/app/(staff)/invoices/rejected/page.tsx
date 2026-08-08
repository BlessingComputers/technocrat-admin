import type { Metadata } from "next";
import { RejectedInvoicesView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Rejected Invoices",
};

export default function RejectedInvoicesPage() {
  return <RejectedInvoicesView />;
}
