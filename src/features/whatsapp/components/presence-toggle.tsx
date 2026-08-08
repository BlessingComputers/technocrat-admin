"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

import type { WhatsAppConnectionState } from "../hooks/use-whatsapp-socket";

interface PresenceToggleProps {
  isOnline: boolean;
  isPending: boolean;
  connection: WhatsAppConnectionState;
  onChange: (online: boolean) => void;
}

/**
 * WhatsApp availability switch. Deliberately separate from live-chat presence:
 * the backend keeps two independent pools so an agent's WhatsApp capacity never
 * competes with their chat capacity.
 *
 * Going online is also what joins this staff member to the WhatsApp staff room
 * server-side, so it's the difference between seeing new queue items arrive live
 * and not seeing them at all.
 */
export function PresenceToggle({
  isOnline,
  isPending,
  connection,
  onChange,
}: PresenceToggleProps) {
  const connectionLabel =
    connection === "connected"
      ? "Live"
      : connection === "connecting"
        ? "Connecting…"
        : "Offline";

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        title={`Realtime connection: ${connectionLabel}`}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            connection === "connected"
              ? "bg-emerald-500"
              : connection === "connecting"
                ? "bg-amber-500"
                : "bg-muted-foreground/50",
          )}
        />
        {connectionLabel}
      </span>

      <div className="flex items-center gap-2">
        <Label
          htmlFor="whatsapp-presence"
          className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Available
        </Label>
        <Switch
          id="whatsapp-presence"
          checked={isOnline}
          disabled={isPending}
          onCheckedChange={onChange}
          aria-label="Available for WhatsApp"
        />
      </div>
    </div>
  );
}
