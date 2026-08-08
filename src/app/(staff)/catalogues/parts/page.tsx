import type { Metadata } from "next";
import { PartsBrowseView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Parts",
};

export default function PartsPage() {
  return <PartsBrowseView />;
}
