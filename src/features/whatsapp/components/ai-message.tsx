"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { LinkifiedText } from "@/components/shared/linkified-text";

import type { WhatsAppMessage } from "../types/whatsapp";
import { messageTime } from "../utils/whatsapp-format";

/**
 * An AI first-responder reply in the WhatsApp thread.
 *
 * The SYSTEM branch renders a `text-xs rounded-full` pill, which was right for
 * short notices and wrong for an AI answer: a paragraph overflows it and loses
 * its line breaks. This is the same outlined treatment as the live-chat AI
 * bubble so staff read one visual language across both inboxes.
 *
 * No delivery indicator, deliberately — a SYSTEM message has no receipt to
 * show.
 *
 * A shadow-mode reply (`isInternal`) is persisted for review and never sent.
 * The marker is explicit text, not a colour or a glyph: staff would otherwise
 * read a plausible answer sitting in the thread and assume it went out. Same
 * wording as admin live chat's `AiMessage` so there is one phrase to learn,
 * not two.
 */
export function AiMessage({ message }: { message: WhatsAppMessage }) {
  const isShadow = message.isInternal === true;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-jewel/15">
          <AppIcon
            icon="solar:magic-stick-3-linear"
            aria-hidden
            className="size-3.5 text-jewel-ink"
          />
        </span>
        <span className="text-sm font-medium text-foreground">
          {message.senderName || "Blessing Assistant"}
        </span>
        <span className="rounded-full bg-muted px-1.5 py-px text-xs font-medium text-muted-foreground">
          AI
        </span>
        {isShadow && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-px text-xs font-medium text-foreground">
            <AppIcon
              icon="solar:eye-closed-linear"
              aria-hidden
              className="size-3.5 text-warning-ink"
            />
            Shadow mode — not visible to customer
          </span>
        )}
      </div>

      {/* `whitespace-pre-wrap` is required, not cosmetic: the escalation note
          arrives as "[AI handover · reason]\nsummary" and collapses without it. */}
      <div className="max-w-[min(32rem,80%)] whitespace-pre-wrap break-words rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
        <LinkifiedText body={message.body} />
      </div>

      <span className="px-1 text-xs tabular-nums text-muted-foreground">
        {messageTime(message.createdAt)}
      </span>
    </div>
  );
}
