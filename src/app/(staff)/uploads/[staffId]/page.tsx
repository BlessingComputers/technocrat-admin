import { UploaderDetailView } from "@/features/analytics";

export const metadata = { title: "Uploader" };

export default async function UploaderDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  return <UploaderDetailView staffId={staffId} />;
}
