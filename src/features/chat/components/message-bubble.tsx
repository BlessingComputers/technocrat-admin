import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { formatTime } from "../utils/chat-format";
import type { ChatMessage } from "../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  /** Right-aligned blush bubble for the current staff member's own messages. */
  isOwn: boolean;
  /** Show the sender's name above the bubble (staff-room group threads). */
  showSenderName: boolean;
}

/** A single chat message: bubble, timestamp, optional read tick and reply quote. */
export function MessageBubble({
  message,
  isOwn,
  showSenderName,
}: MessageBubbleProps) {
  return (
    <div
      className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}
    >
      {showSenderName && !isOwn && (
        <span className="px-1 text-sm font-medium text-foreground">
          {message.senderName}
        </span>
      )}

      <div className="flex max-w-[75%] flex-col gap-1">
        {message.replyTo && (
          <div className="rounded-md border-l-2 border-primary bg-muted/60 px-3 py-1.5">
            <p className="text-xs font-medium text-primary">
              {message.replyTo.senderName}
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {message.replyTo.body}
            </p>
          </div>
        )}

        <div
          className={cn(
            "break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isOwn
              ? "bg-primary/10 text-foreground"
              : "bg-muted text-foreground",
          )}
        >
          <LinkifiedText body={message.body} />
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1 px-1 text-xs text-muted-foreground",
          isOwn ? "flex-row-reverse" : "flex-row",
        )}
      >
        <span>{formatTime(message.createdAt)}</span>
        {isOwn && (
          <AppIcon
            icon="solar:check-read-linear"
            className={cn(
              "size-4",
              message.read ? "text-secondary" : "text-muted-foreground/50",
            )}
          />
        )}
      </div>
    </div>
  );
}
