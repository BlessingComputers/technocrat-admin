import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { formatTime } from "../utils/chat-format";
import type { ChatMessage } from "../types/chat";

/**
 * - `customer`: grey, the customer's side.
 * - `agent`: solid maroon, a staff reply in a customer chat. Strong on
 *   purpose: staff could not tell an agent's reply from the customer's.
 * - `own`: the soft tint, the viewer's own message in the staff room.
 */
export type MessageBubbleTone = "customer" | "agent" | "own";

interface MessageBubbleProps {
  message: ChatMessage;
  side: "left" | "right";
  tone: MessageBubbleTone;
  /** Name above the bubble, on the first message of a sender's run. */
  label?: string | null;
  /** The read tick, for messages the shop sent. */
  showReadTick: boolean;
}

/** A single chat message: bubble, timestamp, optional read tick and reply quote. */
export function MessageBubble({
  message,
  side,
  tone,
  label,
  showReadTick,
}: MessageBubbleProps) {
  const isRight = side === "right";

  return (
    <div className={cn("flex flex-col gap-1", isRight ? "items-end" : "items-start")}>
      {label && (
        <span className="px-1 text-sm font-medium text-foreground">{label}</span>
      )}

      <div className="flex max-w-[75%] flex-col gap-1">
        {message.replyTo && (
          <div className="rounded-md border-l-2 border-primary bg-muted/60 px-3 py-1.5">
            <p className="text-xs font-medium text-primary-ink">
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
            isRight ? "rounded-tr-sm" : "rounded-tl-sm",
            tone === "agent" && "bg-primary text-primary-foreground",
            tone === "own" && "bg-primary/10 text-foreground",
            tone === "customer" && "bg-muted text-foreground",
          )}
        >
          <LinkifiedText body={message.body} />
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1 px-1 text-xs text-muted-foreground",
          isRight ? "flex-row-reverse" : "flex-row",
        )}
      >
        <span>{formatTime(message.createdAt)}</span>
        {showReadTick && (
          <AppIcon
            icon="solar:check-read-linear"
            className={cn(
              "size-4",
              message.read ? "text-secondary-ink" : "text-muted-foreground/50",
            )}
          />
        )}
      </div>
    </div>
  );
}
