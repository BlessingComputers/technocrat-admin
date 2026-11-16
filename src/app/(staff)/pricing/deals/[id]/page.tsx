import { redirect } from "next/navigation";

/** Old deal links and bookmarks: the deal now opens beside the list. */
export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pricing/deals?deal=${encodeURIComponent(id)}`);
}
