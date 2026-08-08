"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { isAiMessage } from "@/lib/constants/ai-sender";
import { cn } from "@/lib/utils/cn";

import { getMessageStatusMeta } from "../constants/whatsapp-status";
import type { WhatsAppMessage } from "../types/whatsapp";
import { messageTime } from "../utils/whatsapp-format";
import { AiMessage } from "./ai-message";

interface MessageBubbleProps {
  message: WhatsAppMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.senderType === "CUSTOMER";
  const isSystem = message.senderType === "SYSTEM";

  // SYSTEM covers both an AI reply and a genuine notice; only `senderId` tells
  // them apart, and an AI answer is a paragraph that a pill cannot hold.
  if (isSystem && isAiMessage(message)) {
    return <AiMessage message={message} />;
  }

  if (isSystem) {
    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <p className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.body}
        </p>
        {/* An internal system note (not just an AI reply) never reached the
            customer either — same explicit marker, same wording as the AI
            bubble and admin live chat. */}
        {message.isInternal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-px text-xs font-medium text-foreground">
            <AppIcon
              icon="solar:eye-closed-linear"
              aria-hidden
              className="size-3.5 text-warning"
            />
            Shadow mode — not visible to customer
          </span>
        )}
      </div>
    );
  }

  const status = getMessageStatusMeta(message.status);

  return (
    <div className={cn("flex", isCustomer ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[min(32rem,80%)] rounded-2xl px-3.5 py-2.5",
          isCustomer
            ? "rounded-tl-sm bg-muted text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground",
        )}
      >
        {!isCustomer && (
          <p className="mb-0.5 text-xs font-semibold text-primary-foreground/70">
            {message.senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          <LinkifiedText body={message.body} />
        </p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1",
            isCustomer
              ? "text-muted-foreground"
              : "text-primary-foreground/70",
          )}
        >
          <span className="text-xs tabular-nums">
            {messageTime(message.createdAt)}
          </span>
          {/* Delivery state is staff-facing only — the customer's own messages
              have no receipt to show. Gated on `isInternal`, not `status`, so
              a future status revert can't make an unsent message look sent.
              Icon plus a title so the state is never conveyed by shape alone. */}
          {!isCustomer && !message.isInternal && (
            <span title={status.label} className="inline-flex items-center">
              <AppIcon
                icon={status.icon}
                aria-label={status.label}
                role="img"
                className={cn(
                  "size-3.5",
                  message.status === "FAILED"
                    ? "text-destructive"
                    : message.status === "READ"
                      ? "text-primary-foreground"
                      : undefined,
                )}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
