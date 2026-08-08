import type { Metadata } from "next";
import { Suspense } from "react";
import { InvoiceView } from "@/features/invoice";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  // InvoiceView reads the active tab from `?tab=` via useSearchParams, which
  // Next requires to sit under a Suspense boundary.
  return (
    <Suspense>
      <InvoiceView />
    </Suspense>
  );
}
