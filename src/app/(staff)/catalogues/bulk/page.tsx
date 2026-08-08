import type { Metadata } from "next";
import { BulkUploadView } from "@/features/products";

export const metadata: Metadata = {
  title: "Bulk Upload",
};

export default function BulkUploadPage() {
  return <BulkUploadView />;
}
