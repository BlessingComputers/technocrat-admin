import type { Metadata } from "next";
import { PartBulkPriceView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Update Part Prices",
};

export default function PartBulkPricePage() {
  return <PartBulkPriceView />;
}
