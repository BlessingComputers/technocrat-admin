import type { Metadata } from "next";
import { PartDetailView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Part Detail",
};

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartDetailView partId={id} />;
}
