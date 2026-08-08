import { AppIcon } from "@/components/shared/app-icon";

/** Placeholder shown in the center column when no conversation is selected. */
export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <AppIcon icon="solar:chat-round-linear" className="size-12" />
      <p className="text-sm">Select a conversation to start chatting</p>
    </div>
  );
}
