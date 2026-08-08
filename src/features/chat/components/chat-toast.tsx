"use client";

import toast, { type Toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { ChatAvatar } from "./chat-avatar";

/** Auto-dismiss window for the popup (WhatsApp-style transient notification). */
const CHAT_TOAST_MS = 5000;

interface ChatToastProps {
  t: Toast;
  title: string;
  preview: string;
  /** Stable seed for the avatar tint (the conversation id). */
  seed: string;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * A single WhatsApp-style chat popup: avatar with a green chat badge, the
 * customer's name, and a two-line message preview. Clicking the body opens the
 * conversation; the × dismisses it. Slides in/out with `t.visible`.
 */
export function ChatToast({
  t,
  title,
  preview,
  seed,
  onOpen,
  onClose,
}: ChatToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-border bg-popover p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] transition-all duration-300",
        t.visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0",
      )}
      role="alert"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span className="relative shrink-0">
          <ChatAvatar name={title} seed={seed} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-popover">
            <AppIcon
              icon="solar:chat-round-dots-bold"
              className="size-2.5 text-white"
            />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {preview}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <AppIcon icon="solar:close-circle-linear" className="size-4" />
      </button>
    </div>
  );
}

/**
 * Fire a WhatsApp-style chat popup that auto-dismisses after 5s. Kept here (not
 * in the socket hook) so the JSX + react-hot-toast wiring live in one `.tsx`
 * module; the hook calls this imperatively when a notification arrives.
 *
 * The per-call `style` neutralises the global `<Toaster>` toastOptions so this
 * card provides its own surface (no double border/background wrapper).
 */
export function showChatToast(opts: {
  title: string;
  preview: string;
  seed: string;
  onOpen: () => void;
}): void {
  toast.custom(
    (t) => (
      <ChatToast
        t={t}
        title={opts.title}
        preview={opts.preview}
        seed={opts.seed}
        onOpen={() => {
          toast.dismiss(t.id);
          opts.onOpen();
        }}
        onClose={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: CHAT_TOAST_MS,
      position: "top-right",
      style: {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        maxWidth: "none",
      },
    },
  );
}
