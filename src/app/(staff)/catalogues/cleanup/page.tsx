import type { Metadata } from "next";
import { CategoryCleanupView } from "@/features/products";

export const metadata: Metadata = {
  title: "Category cleanup",
};

// Temporary, local only. Delete with the view once the cleanup is done.
export default function CategoryCleanupPage() {
  return <CategoryCleanupView />;
}
