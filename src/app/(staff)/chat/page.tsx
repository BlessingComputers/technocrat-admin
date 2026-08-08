import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatWorkspaceView } from "@/features/chat";

export const metadata: Metadata = {
  title: "Chat",
};

// The workspace reads the URL via `useSearchParams` (ADR-0005), which Next
// requires to sit under a Suspense boundary.
export default function ChatPage() {
  return (
    <Suspense>
      <ChatWorkspaceView />
    </Suspense>
  );
}
