// Public API of the chat feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

export { ChatWorkspaceView } from "./components/chat-workspace-view";

// App-wide realtime provider (mounted in the staff shell): keeps one chat socket
// alive across every page so header notifications work off the chat route.
export { ChatRealtimeProvider } from "./components/chat-realtime-provider";

// The topbar staff-notification bell moved to its own feature (ticket A6) —
// it now reads the REST `StaffNotification` feed, not a chat-only store, so
// it no longer belongs under `features/chat`. See `@/features/notifications`.

// Socket teardown for logout — the topbar hangs up the shared chat socket so a
// logged-out staff member stops reconnecting and doesn't linger as "online".
export { disconnectChatSocket } from "./api/chat-socket";
