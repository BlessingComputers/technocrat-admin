import type { ReactNode } from "react";
import { ChatThreadHeader } from "./chat-thread-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import type { ChatChannel, ChatMessage, ConversationStatus } from "../types/chat";

interface ChatThreadProps {
  conversationId: string;
  channel: ChatChannel;
  name: string;
  avatarUrl?: string | null;
  status?: ConversationStatus;
  isOnline: boolean;
  memberCount?: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
  messages: ChatMessage[];
  currentStaffId: string | null;
  someoneTyping: boolean;
  /** Name of the person currently typing, when known (else anonymous dots). */
  typistName?: string | null;
  panelOpen: boolean;
  /** Whether the current staff member may reply (super admin / assigned staff). */
  canReply: boolean;
  /** Ownership of this conversation, for the composer + header states. */
  assignmentState?: "unassigned" | "mine" | "other";
  /** Assigned admin's display name (for "taken by X" / "Assigned to X"). */
  assignedStaffName?: string | null;
  /** Assigned admin's avatar, shown alongside the "taken by X" notice. */
  assignedStaffAvatar?: string | null;
  /** Super-admin reassign control, rendered in the header. */
  reassignSlot?: ReactNode;
  /** AI stop/resume control (ticket A5), rendered in the header. */
  aiControlSlot?: ReactNode;
  /** Mobile "back" to the conversation list (the two panes stack there). */
  onBack: () => void;
  onTogglePanel: () => void;
  onSend: (body: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onResolve?: () => void;
  /** Self-assign this conversation (offered when the staff member can't yet reply). */
  onTake?: () => void;
  /** A take for this conversation is in flight — the Take button shows pending. */
  isTaking?: boolean;
}

/** Center column: header, message thread, and composer for the open conversation. */
export function ChatThread({
  conversationId,
  channel,
  name,
  avatarUrl,
  status,
  isOnline,
  memberCount,
  customerEmail,
  customerPhone,
  messages,
  currentStaffId,
  someoneTyping,
  typistName,
  panelOpen,
  canReply,
  assignmentState,
  assignedStaffName,
  assignedStaffAvatar,
  reassignSlot,
  aiControlSlot,
  onBack,
  onTogglePanel,
  onSend,
  onTypingStart,
  onTypingStop,
  onResolve,
  onTake,
  isTaking,
}: ChatThreadProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ChatThreadHeader
        name={name}
        seed={conversationId}
        avatarUrl={avatarUrl}
        channel={channel}
        status={status}
        isOnline={isOnline}
        memberCount={memberCount}
        assignmentState={assignmentState}
        assignedStaffName={assignedStaffName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        panelOpen={panelOpen}
        reassignSlot={reassignSlot}
        aiControlSlot={aiControlSlot}
        onBack={onBack}
        onTogglePanel={onTogglePanel}
        onResolve={onResolve}
      />

      <MessageList
        messages={messages}
        channel={channel}
        currentStaffId={currentStaffId}
        someoneTyping={someoneTyping}
        typistName={typistName}
      />

      <MessageComposer
        onSend={onSend}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        canReply={canReply}
        assignmentState={assignmentState}
        assignedStaffName={assignedStaffName}
        assignedStaffAvatar={assignedStaffAvatar}
        onTake={onTake}
        isTaking={isTaking}
      />
    </div>
  );
}
