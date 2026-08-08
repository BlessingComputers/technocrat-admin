import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/shared/feature-placeholder";

export const metadata: Metadata = {
  title: "Inventories",
};

/** Placeholder — backend-blocked (no admin inventory endpoint yet). */
export default function InventoriesPage() {
  return (
    <FeaturePlaceholder
      title="Inventories"
      description="Stock levels and inventory"
      icon="solar:box-minimalistic-linear"
      note="The inventories module is awaiting its backend endpoint. It'll live here once the API is available."
    />
  );
}
