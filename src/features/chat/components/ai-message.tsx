import { AppIcon } from "@/components/shared/app-icon";
import { LinkifiedText } from "@/components/shared/linkified-text";
import { formatTime } from "../utils/chat-format";
import type { ChatMessage } from "../types/chat";

/**
 * An AI first-responder reply in the staff thread.
 *
 * Outlined rather than filled so it reads as neither a staff reply nor the
 * customer's own, and never as a human agent — staff need to know at a glance
 * which answers the customer got from the machine.
 *
 * A shadow-mode reply (`isInternal`) is persisted for review and never sent.
 * The marker is explicit text, not a colour or a glyph: staff would otherwise
 * read a plausible answer sitting in the thread and assume it went out. Same
 * wording as the WhatsApp inbox so there is one phrase to learn, not two.
 */
export function AiMessage({ message }: { message: ChatMessage }) {
  const isShadow = message.isInternal === true;

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap items-center gap-1.5 px-1">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-jewel/15">
          <AppIcon
            icon="solar:magic-stick-3-linear"
            aria-hidden
            className="size-3.5 text-jewel"
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
              className="size-3.5 text-warning"
            />
            Shadow mode — not visible to customer
          </span>
        )}
      </div>

      {/* `whitespace-pre-wrap` is required, not cosmetic: the escalation note
          arrives as "[AI handover · reason]\nsummary" and collapses without it. */}
      <div className="max-w-[75%] whitespace-pre-wrap break-words rounded-2xl border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground">
        <LinkifiedText body={message.body} />
      </div>

      <span className="px-1 text-xs text-muted-foreground">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
