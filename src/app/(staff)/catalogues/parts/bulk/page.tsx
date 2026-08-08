import type { Metadata } from "next";
import { BulkPartsView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Bulk Upload Parts",
};

export default function BulkPartsPage() {
  return <BulkPartsView />;
}
