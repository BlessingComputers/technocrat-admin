import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isAiMessage } from "@/lib/constants/ai-sender";
import { runStarts } from "@/lib/utils/message-runs";
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

/** Who spoke, for grouping runs: the customer, the AI, or one staff member. */
function senderKey(message: ChatMessage): string {
  if (message.senderType === "SYSTEM") return isAiMessage(message) ? "ai" : "system";
  if (message.senderType === "STAFF") return `staff:${message.senderId ?? ""}`;
  return "customer";
}

interface MessageRowProps {
  message: ChatMessage;
  channel: ChatChannel;
  currentStaffId: string | null;
  /** First message of this sender's run: the name shows here. */
  startsRun: boolean;
}

/**
 * Picks the renderer and the side for one message.
 *
 * In a customer chat the sides belong to the parties, as in the official
 * WhatsApp app: the customer on the left, the shop (every agent and the AI)
 * on the right. They used to mean "mine or not mine", which put the AI on the
 * customer's side and left agents unnamed, so staff could not tell the three
 * apart. In the staff room the sides still mean "mine or not mine".
 *
 * SYSTEM spans two unrelated things — an AI reply and a client-only connection
 * notice — so that branch is on `senderId`, not `senderType`.
 */
function MessageRow({ message, channel, currentStaffId, startsRun }: MessageRowProps) {
  if (message.senderType === "SYSTEM") {
    if (isAiMessage(message)) return <AiMessage message={message} showLabel={startsRun} />;
    return (
      <p className="text-center text-sm text-muted-foreground">{message.body}</p>
    );
  }

  const isMine = message.senderType === "STAFF" && message.senderId === currentStaffId;

  if (channel === "STAFF_ROOM") {
    return (
      <MessageBubble
        message={message}
        side={isMine ? "right" : "left"}
        tone={isMine ? "own" : "customer"}
        label={isMine ? null : message.senderName}
        showReadTick={isMine}
      />
    );
  }

  if (message.senderType === "STAFF") {
    return (
      <MessageBubble
        message={message}
        side="right"
        tone="agent"
        label={startsRun ? (isMine ? "You" : message.senderName || "Agent") : null}
        showReadTick
      />
    );
  }

  return (
    <MessageBubble
      message={message}
      side="left"
      tone="customer"
      label={startsRun ? message.senderName || "Customer" : null}
      showReadTick={false}
    />
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

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 lg:py-6">
        {groups.map((group) => {
          // Runs restart each day, so the first message under a day label
          // always names its sender.
          const starts = runStarts(group.items, senderKey);
          return (
            <div key={group.label} className="flex flex-col gap-4">
              <div className="flex justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {group.label}
                </span>
              </div>
              {group.items.map((message, i) => (
                <MessageRow
                  key={message.id ?? message.idempotencyKey}
                  message={message}
                  channel={channel}
                  currentStaffId={currentStaffId}
                  startsRun={starts[i]}
                />
              ))}
            </div>
          );
        })}

        {someoneTyping && <TypingIndicator name={typistName} />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
