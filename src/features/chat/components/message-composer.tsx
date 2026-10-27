import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { ChatAvatar } from "./chat-avatar";

interface MessageComposerProps {
  onSend: (body: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  /**
   * Whether the current staff member may reply. Regular admins must "Take" a
   * chat first; a super admin (and the staff room) can always reply.
   */
  canReply?: boolean;
  /** Ownership of the conversation, driving the non-reply notice. */
  assignmentState?: "unassigned" | "mine" | "other";
  /** Assigned admin's name, for the "taken by X" notice. */
  assignedStaffName?: string | null;
  /** Assigned admin's avatar, shown in the "taken by X" notice. */
  assignedStaffAvatar?: string | null;
  /** Self-assign the open conversation — shown when the chat is unassigned. */
  onTake?: () => void;
  /** A take is in flight — disable the button and show a pending label. */
  isTaking?: boolean;
}

const TYPING_IDLE_MS = 2000;

/** Message input row: attach affordance, textarea, send. Emits typing signals. */
export function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled,
  canReply = true,
  assignmentState,
  assignedStaffName,
  assignedStaffAvatar,
  onTake,
  isTaking,
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const typingRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = () => {
    if (typingRef.current) {
      typingRef.current = false;
      onTypingStop();
    }
  };

  useEffect(() => () => stopTyping(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (next: string) => {
    setValue(next);
    if (!typingRef.current && next) {
      typingRef.current = true;
      onTypingStart();
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const submit = () => {
    const body = value.trim();
    if (!body || disabled) return;
    onSend(body);
    setValue("");
    if (idleTimer.current) clearTimeout(idleTimer.current);
    stopTyping();
  };

  // A regular admin viewing a chat they don't own gets no composer. Which notice
  // depends on ownership: an UNASSIGNED chat is still in the queue, so offer to
  // "Take" it; a chat already owned by someone else is read-only — show who took
  // it and offer no Take (an onlooker admin must not be able to grab or reply).
  // Super admin / assigned staff never reach this branch (canReply is true).
  if (!canReply) {
    if (assignmentState === "other") {
      return (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3">
            {assignedStaffName ? (
              <ChatAvatar
                name={assignedStaffName}
                seed={assignedStaffName}
                avatarUrl={assignedStaffAvatar}
                size="sm"
              />
            ) : (
              <AppIcon
                icon="solar:lock-keyhole-minimalistic-linear"
                className="size-4 shrink-0 text-muted-foreground"
              />
            )}
            <p className="text-sm text-muted-foreground">
              This chat was taken by{" "}
              <span className="font-medium text-foreground">
                {assignedStaffName ?? "another agent"}
              </span>
              .
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Take this chat to reply.
          </p>
          {onTake && (
            <button
              type="button"
              onClick={onTake}
              disabled={isTaking}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary"
            >
              <AppIcon
                icon="solar:hand-shake-linear"
                className={cn("size-4", isTaking && "animate-pulse")}
              />
              {isTaking ? "Taking…" : "Take chat"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-full text-primary-ink transition-colors hover:bg-primary/10"
          aria-label="Attach"
        >
          <AppIcon icon="solar:add-circle-bold" className="size-6" />
        </button>

        <input
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Type your message..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-primary-ink transition-colors hover:bg-primary/10",
            (disabled || !value.trim()) && "opacity-40",
          )}
          aria-label="Send"
        >
          <AppIcon icon="solar:plain-2-linear" className="size-5" />
        </button>
      </div>
    </div>
  );
}
