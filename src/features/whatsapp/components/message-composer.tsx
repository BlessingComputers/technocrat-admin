"use client";

import { useState } from "react";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { ReplyWindow } from "../utils/whatsapp-format";

interface MessageComposerProps {
  /** Meta's 24h window. Closed means the backend will reject any send (422). */
  replyWindow: ReplyWindow;
  /** Unassigned conversations can't be replied to until someone claims them. */
  isAssignedToMe: boolean;
  isSending: boolean;
  onSend: (body: string) => Promise<void>;
}

export function MessageComposer({
  replyWindow,
  isAssignedToMe,
  isSending,
  onSend,
}: MessageComposerProps) {
  const [body, setBody] = useState("");

  const blockedReason = !isAssignedToMe
    ? "Claim this conversation before replying."
    : !replyWindow.isOpen
      ? "The 24-hour reply window has closed. WhatsApp only allows a free-form reply within 24 hours of the customer’s last message — they must message again first."
      : null;

  const canSend = !blockedReason && body.trim().length > 0 && !isSending;

  const submit = async () => {
    if (!canSend) return;
    const text = body.trim();
    // Clear optimistically so a fast second reply isn't blocked on the round
    // trip; the delivered message arrives over the socket, not from this call.
    setBody("");
    try {
      await onSend(text);
    } catch {
      // Restore the draft so a failed send doesn't lose the agent's typing.
      setBody(text);
    }
  };

  if (blockedReason) {
    return (
      <div className="flex items-start gap-2.5 border-t border-border bg-muted/30 px-4 py-3">
        <AppIcon
          icon="solar:hourglass-linear"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {blockedReason}
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter breaks the line — the convention every
            // messaging tool uses, including WhatsApp itself.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder="Type a reply…"
          aria-label="Reply message"
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none"
        />
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={!canSend}
          aria-label="Send reply"
          className="size-10 shrink-0 rounded-lg p-0"
        >
          <AppIcon
            icon={isSending ? "solar:refresh-linear" : "solar:plain-2-bold"}
            className={isSending ? "size-5 animate-spin" : "size-5"}
          />
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Reply window: {replyWindow.label}
      </p>
    </div>
  );
}
