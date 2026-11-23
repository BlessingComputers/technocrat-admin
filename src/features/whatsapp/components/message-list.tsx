"use client";

import { useEffect, useRef } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { isAiMessage } from "@/lib/constants/ai-sender";
import { runStarts } from "@/lib/utils/message-runs";

import { MessageBubble } from "./message-bubble";
import type { WhatsAppMessage } from "../types/whatsapp";

/** Who spoke, for grouping runs: the customer, the AI, or one staff member. */
function senderKey(message: WhatsAppMessage): string {
  if (message.senderType === "SYSTEM") return isAiMessage(message) ? "ai" : "system";
  if (message.senderType === "CUSTOMER") return "customer";
  return `staff:${message.senderId ?? ""}`;
}

interface MessageListProps {
  messages: WhatsAppMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  // Follow the conversation as it grows. Keyed on the last message id rather
  // than the array so re-renders that don't add a message never yank the view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className={i % 2 === 0 ? "h-14 w-2/3" : "ml-auto h-14 w-1/2"}
          />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <AppIcon
          icon="solar:chat-square-call-linear"
          className="size-8 text-muted-foreground"
        />
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      </div>
    );
  }

  const starts = runStarts(messages, senderKey);

  return (
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
      {messages.map((m, i) => (
        <MessageBubble key={m.id} message={m} startsRun={starts[i]} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
