import type { Metadata } from "next";
import { CreateManualInvoiceView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Create Manual Invoice",
};

export default function CreateManualInvoicePage() {
  return <CreateManualInvoiceView />;
}
