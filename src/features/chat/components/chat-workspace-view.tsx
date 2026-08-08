"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { ConversationList } from "./conversation-list";
import { ChatThread } from "./chat-thread";
import { ChatEmptyState } from "./chat-empty-state";
import { ConnectionStatusBar } from "./connection-status-bar";
import { NotesPanel } from "./notes-panel";
import { GroupDetailsPanel } from "./group-details-panel";
import { ReassignMenu } from "./reassign-menu";
import { AiStopControl } from "./ai-stop-control";
import { useChatWorkspace } from "../hooks/use-chat-workspace";

/** Fixed pixel width of the context panel on desktop; also the tween target. */
const PANEL_WIDTH = 340;

/** WhatsApp-style slide for the mobile overlays (in from the right, out to it). */
const SLIDE = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "tween" as const, duration: 0.25, ease: "easeInOut" as const },
};

/**
 * The staff chat workspace (design admin-1..4). On desktop it's a three-column
 * shell — conversation list, message thread, and a collapsible context panel
 * (CRM notes for a customer conversation, group details for the staff room).
 *
 * On mobile it behaves like WhatsApp: the conversation list is the base screen,
 * and the thread slides in from the right over it once a conversation is opened
 * (a back arrow in the thread header slides it back out). The context panel
 * likewise slides in as a full-screen overlay instead of a cramped side column.
 */
export function ChatWorkspaceView() {
  const chat = useChatWorkspace();
  // "Compact" = below Tailwind's `lg` (1024px) — kept in lockstep with the `lg:`
  // classes below so tablets get the stacked/overlay layout, not a broken hybrid
  // where the thread column is hidden by CSS but the JS still thinks it's desktop.
  const isCompact = useMediaQuery("(max-width: 1023px)");
  const [panelOpen, setPanelOpen] = useState(true);

  // Open-by-default on desktop, but an opt-in overlay when compact — so it must
  // start closed there. Re-sync whenever the viewport crosses the breakpoint.
  useEffect(() => {
    setPanelOpen(!isCompact);
  }, [isCompact]);

  const hasSelection = chat.isStaffRoom || Boolean(chat.selectedConversation);
  const showPanel = panelOpen && hasSelection;
  const threadOpen = Boolean(chat.selectedId);

  // A super admin can hand a customer conversation to any online agent.
  const reassignSlot =
    chat.isSuper &&
    chat.selectedConversation &&
    chat.selectedConversation.channel === "LIVE_CHAT" ? (
      <ReassignMenu
        staff={Object.values(chat.presence)}
        currentAssignedStaffId={chat.selectedConversation.assignedStaffId ?? null}
        onReassign={chat.handleReassign}
      />
    ) : null;

  // Any staff member may stop/resume the AI on a customer conversation — not
  // gated on assignment or SUPER_ADMIN (A5 decision doc).
  const aiControlSlot =
    chat.selectedConversation && chat.selectedConversation.channel === "LIVE_CHAT" ? (
      <AiStopControl
        aiState={chat.selectedConversation.aiState}
        isResolved={chat.selectedConversation.status === "RESOLVED"}
        isPending={chat.isAiStatePending}
        onStop={chat.handleStopAi}
        onResume={chat.handleResumeAi}
      />
    ) : null;

  const threadContent = chat.selectedConversation ? (
    <ChatThread
      conversationId={chat.selectedConversation.id}
      channel={chat.selectedConversation.channel}
      name={chat.selectedConversation.name}
      avatarUrl={chat.selectedConversation.avatarUrl}
      status={chat.selectedConversation.status}
      isOnline={chat.isOnline}
      memberCount={chat.members.length || chat.selectedConversation.memberCount}
      customerEmail={chat.customerEmail}
      customerPhone={chat.customerPhone}
      messages={chat.messages}
      currentStaffId={chat.currentStaffId}
      someoneTyping={chat.typingUserIds.length > 0}
      typistName={chat.typistName}
      panelOpen={showPanel}
      canReply={chat.canReply}
      assignmentState={chat.assignmentState}
      assignedStaffName={chat.assignedStaffName}
      assignedStaffAvatar={chat.assignedStaffAvatar}
      reassignSlot={reassignSlot}
      aiControlSlot={aiControlSlot}
      onBack={chat.handleBack}
      onTogglePanel={() => setPanelOpen((open) => !open)}
      onSend={chat.handleSend}
      onTypingStart={chat.handleTypingStart}
      onTypingStop={chat.handleTypingStop}
      onResolve={chat.handleResolve}
      onTake={() =>
        chat.selectedConversation && chat.handleTake(chat.selectedConversation.id)
      }
      isTaking={
        !!chat.selectedConversation &&
        chat.takingIds.has(chat.selectedConversation.id)
      }
    />
  ) : (
    <ChatEmptyState />
  );

  const panelContent = chat.isStaffRoom ? (
    <GroupDetailsPanel
      name={chat.selectedConversation?.name ?? "Staff Room"}
      seed={chat.selectedConversation?.id ?? "staffroom"}
      members={chat.members}
      onClose={() => setPanelOpen(false)}
    />
  ) : chat.selectedConversation ? (
    <NotesPanel
      notes={chat.notes}
      isLoading={chat.notesLoading}
      customerName={chat.customerName}
      customerEmail={chat.customerEmail}
      customerPhone={chat.customerPhone}
      onSave={chat.handleSaveNotes}
      onClose={() => setPanelOpen(false)}
    />
  ) : null;

  return (
    <div className="relative flex h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-xl border border-border bg-card lg:h-[calc(100vh-8rem)]">
      <ConnectionStatusBar status={chat.connectionStatus} />
      <div className="relative flex min-h-0 flex-1">
        {/* Conversation list — the base layer on mobile (full width), a fixed
            rail on desktop. */}
        <aside className="w-full border-border lg:w-80 lg:shrink-0 lg:border-r">
          <ConversationList
            conversations={chat.conversations}
            selectedId={chat.selectedId}
            activeTab={chat.activeTab}
            currentStaffId={chat.currentStaffId}
            typingByConversation={chat.typingByConversation}
            unreadByConversation={chat.unreadByConversation}
            isLoading={chat.conversationsLoading}
            onTabChange={chat.setTab}
            onSelect={chat.handleSelect}
            onTake={chat.handleTake}
            takingIds={chat.takingIds}
          />
        </aside>

        {/* Desktop: thread is a static column beside the list. */}
        <section className="hidden min-w-0 flex-1 lg:block">{threadContent}</section>

        {/* Compact: thread slides in over the list; back slides it out. */}
        <AnimatePresence initial={false}>
          {isCompact && threadOpen ? (
            <motion.section
              key="thread-mobile"
              {...SLIDE}
              className="absolute inset-0 z-10 bg-card lg:hidden"
            >
              {threadContent}
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/* Context panel — inline animated column on desktop, full-screen
            slide-in overlay on mobile (above the thread). */}
        <AnimatePresence initial={false}>
          {showPanel ? (
            isCompact ? (
              <motion.div
                key="context-panel-mobile"
                {...SLIDE}
                className="absolute inset-0 z-20 bg-card lg:hidden"
              >
                <div className="h-full">{panelContent}</div>
              </motion.div>
            ) : (
              <motion.aside
                key="context-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: PANEL_WIDTH, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="shrink-0 overflow-hidden border-l border-border"
              >
                {/* Fixed-width inner wrapper so the content doesn't reflow while
                    the outer width tweens. */}
                <div className="h-full" style={{ width: PANEL_WIDTH }}>
                  {panelContent}
                </div>
              </motion.aside>
            )
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
