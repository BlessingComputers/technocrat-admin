"use client";

import type { ChatConnectionStatus } from "../hooks/use-chat-socket";

/**
 * Slim banner over the workspace when the socket is down (ticket #27): staff
 * must see the live path is offline instead of silently missing customer
 * messages. Reconnection is automatic with capped backoff, so the copy only
 * informs — there is nothing to click.
 */
export function ConnectionStatusBar({
  status,
}: {
  status: ChatConnectionStatus;
}) {
  if (status !== "reconnecting") return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-3 py-1.5 text-xs text-warning-ink"
    >
      <span className="size-1.5 animate-pulse rounded-full bg-warning" />
      Connection lost — reconnecting…
    </div>
  );
}
