import { redirect } from "next/navigation";

/** Old campaign links and bookmarks: the campaign now opens beside the list. */
export default async function HuntPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pricing/hunts?campaign=${encodeURIComponent(id)}`);
}
