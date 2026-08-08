"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

import { ConversationList } from "./conversation-list";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { PresenceToggle } from "./presence-toggle";
import { ThreadHeader } from "./thread-header";
import { useWhatsAppWorkspace } from "../hooks/use-whatsapp-workspace";

/**
 * The WhatsApp inbox: conversation list beside the open thread.
 *
 * Two panes on desktop; on small screens the list and the thread swap so staff
 * always get a full-width reading surface (the same single-pane pattern the chat
 * workspace uses).
 */
export function WhatsAppWorkspaceView() {
  const workspace = useWhatsAppWorkspace();
  const { conversation } = workspace;

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            WhatsApp
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Customer conversations from WhatsApp Business
          </p>
        </div>
        <PresenceToggle
          isOnline={workspace.isOnline}
          isPending={workspace.isPresencePending}
          connection={workspace.connection}
          onChange={workspace.setOnline}
        />
      </div>

      {!workspace.isOnline && (
        <div className="flex shrink-0 items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AppIcon
            icon="solar:info-circle-linear"
            className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
          />
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            You’re not available for WhatsApp. Turn on{" "}
            <span className="font-semibold">Available</span> to receive new
            conversations as they arrive — this is separate from your live-chat
            availability. You can still read and reply to conversations already
            assigned to you.
          </p>
        </div>
      )}

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[22rem_1fr]">
        {/* On mobile only one pane is mounted at a time, so the hidden one
            can't trap focus or be reached by a screen reader. */}
        <div
          className={cn(
            "min-h-0 border-border lg:block lg:border-r",
            workspace.selectedId ? "hidden" : "block",
          )}
        >
          <ConversationList
            conversations={workspace.conversations}
            isLoading={workspace.isListLoading}
            isError={workspace.isListError}
            onRetry={workspace.refetchList}
            tab={workspace.tab}
            onTabChange={workspace.setTab}
            queueCount={workspace.queueCount}
            selectedId={workspace.selectedId}
            unseen={workspace.unseen}
            onSelect={workspace.select}
          />
        </div>

        <div
          className={cn(
            "min-h-0 flex-col lg:flex",
            workspace.selectedId ? "flex" : "hidden",
          )}
        >
          {conversation ? (
            <>
              <ThreadHeader
                conversation={conversation}
                replyWindow={workspace.replyWindow}
                isAssignedToMe={workspace.isAssignedToMe}
                isUnassigned={workspace.isUnassigned}
                canReassign={workspace.isSuper}
                staff={workspace.staff}
                isClaiming={workspace.isClaiming}
                isResolving={workspace.isResolving}
                isAiStatePending={workspace.isAiStatePending}
                onClaim={workspace.handleClaim}
                onResolve={workspace.handleResolve}
                onReassign={workspace.handleReassign}
                onStopAi={workspace.handleStopAi}
                onResumeAi={workspace.handleResumeAi}
                onBack={() => workspace.select(null)}
              />
              <MessageList
                messages={workspace.messages}
                isLoading={workspace.isThreadLoading}
              />
              <MessageComposer
                replyWindow={workspace.replyWindow}
                isAssignedToMe={workspace.isAssignedToMe}
                isSending={workspace.isSending}
                onSend={workspace.handleSend}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <AppIcon
                icon="solar:chat-square-call-linear"
                className="size-10 text-muted-foreground"
              />
              <p className="text-sm font-semibold text-foreground">
                Select a conversation
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Pick one from the list, or claim a waiting conversation from the
                Queue tab to start replying.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
