import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isAiMessage } from "@/lib/constants/ai-sender";
import { AiMessage } from "./ai-message";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { groupByDay } from "../utils/chat-format";
import type { ChatChannel, ChatMessage } from "../types/chat";

interface MessageListProps {
  messages: ChatMessage[];
  channel: ChatChannel;
  currentStaffId: string | null;
  someoneTyping: boolean;
  /** Name of the current typer, when known — shown in the typing row. */
  typistName?: string | null;
}

/** True when a message should render as the current staff member's own (right). */
function isOwnMessage(
  message: ChatMessage,
  channel: ChatChannel,
  currentStaffId: string | null,
): boolean {
  if (message.senderType !== "STAFF") return false;
  // In a customer conversation every staff reply sits on the right; in the staff
  // room only the viewer's own messages do.
  if (channel === "LIVE_CHAT") return true;
  return message.senderId === currentStaffId;
}

interface MessageRowProps {
  message: ChatMessage;
  isOwn: boolean;
  showSenderName: boolean;
}

/**
 * Picks the renderer for one message. SYSTEM spans two unrelated things — an AI
 * reply and a client-only connection notice — so the branch is on `senderId`,
 * not `senderType`.
 */
function MessageRow({ message, isOwn, showSenderName }: MessageRowProps) {
  if (message.senderType !== "SYSTEM") {
    return (
      <MessageBubble
        message={message}
        isOwn={isOwn}
        showSenderName={showSenderName}
      />
    );
  }
  if (isAiMessage(message)) return <AiMessage message={message} />;
  return (
    <p className="text-center text-sm text-muted-foreground">{message.body}</p>
  );
}

/** Scrollable message thread with day separators, bubbles and a typing row. */
export function MessageList({
  messages,
  channel,
  currentStaffId,
  someoneTyping,
  typistName,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, someoneTyping]);

  const groups = groupByDay(messages);
  const showSenderName = channel === "STAFF_ROOM";

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-4">
            <div className="flex justify-center">
              <span className="text-xs font-medium text-muted-foreground">
                {group.label}
              </span>
            </div>
            {group.items.map((message) => (
              <MessageRow
                key={message.id ?? message.idempotencyKey}
                message={message}
                isOwn={isOwnMessage(message, channel, currentStaffId)}
                showSenderName={showSenderName}
              />
            ))}
          </div>
        ))}

        {someoneTyping && <TypingIndicator name={typistName} />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
