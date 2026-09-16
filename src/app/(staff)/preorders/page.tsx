import type { Metadata } from "next";
import { PreorderListView } from "@/features/preorders";

export const metadata: Metadata = {
  title: "Pre-orders",
};

export default function PreordersPage() {
  return <PreorderListView />;
}
