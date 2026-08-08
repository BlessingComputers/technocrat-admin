import type { Metadata } from "next";
import { PartFormView } from "@/features/parts";

export const metadata: Metadata = {
  title: "Edit Part",
};

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartFormView partId={id} />;
}
