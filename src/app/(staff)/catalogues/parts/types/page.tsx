import type { Metadata } from "next";
import { PartTypesView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Part Types",
};

export default function PartTypesPage() {
  return <PartTypesView />;
}
