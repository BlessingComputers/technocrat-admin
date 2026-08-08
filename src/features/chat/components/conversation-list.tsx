import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { ConversationTabs } from "./conversation-tabs";
import { ConversationListItem } from "./conversation-list-item";
import { STAFF_ROOM_ID } from "../store/chat.store";
import { splitQueueByAiState } from "../utils/chat-ai-state";
import type {
  ConversationSummary,
  ConversationTab,
} from "../types/chat";

interface ConversationListProps {
  conversations: ConversationSummary[];
  selectedId: string | null;
  activeTab: ConversationTab;
  currentStaffId: string | null;
  typingByConversation: Record<string, string[]>;
  unreadByConversation: Record<string, number>;
  isLoading: boolean;
  onTabChange: (tab: ConversationTab) => void;
  onSelect: (id: string) => void;
  onTake: (id: string) => void;
  /** Conversation ids with a take in flight — their row shows a pending state. */
  takingIds: ReadonlySet<string>;
}

function matchesTab(
  conversation: ConversationSummary,
  tab: ConversationTab,
  currentStaffId: string | null,
): boolean {
  if (conversation.channel === "STAFF_ROOM") return tab === "all";
  switch (tab) {
    case "mine":
      return conversation.assignedStaffId === currentStaffId;
    case "queue":
      return !conversation.assignedStaffId || conversation.status === "WAITING";
    default:
      return true;
  }
}

/** Props every row needs that don't vary between the flat list and a queue group. */
interface RowSharedProps {
  selectedId: string | null;
  activeTab: ConversationTab;
  typingByConversation: Record<string, string[]>;
  unreadByConversation: Record<string, number>;
  takingIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
  onTake: (id: string) => void;
}

function Row({
  conversation,
  selectedId,
  activeTab,
  typingByConversation,
  unreadByConversation,
  takingIds,
  onSelect,
  onTake,
}: RowSharedProps & { conversation: ConversationSummary }) {
  return (
    <ConversationListItem
      conversation={conversation}
      isActive={selectedId === conversation.id}
      isTyping={(typingByConversation[conversation.id]?.length ?? 0) > 0}
      unreadCount={
        unreadByConversation[conversation.id] ?? conversation.unreadCount ?? 0
      }
      showTake={
        activeTab === "queue" &&
        conversation.channel === "LIVE_CHAT" &&
        conversation.id !== STAFF_ROOM_ID &&
        !conversation.assignedStaffId
      }
      onSelect={() => onSelect(conversation.id)}
      onTake={() => onTake(conversation.id)}
      isTaking={takingIds.has(conversation.id)}
    />
  );
}

/** A labeled section of the Queue tab's AI/human split. Renders nothing when empty. */
function QueueGroup({
  label,
  icon,
  iconClassName,
  conversations,
  ...rowProps
}: RowSharedProps & {
  label: string;
  icon: string;
  iconClassName?: string;
  conversations: ConversationSummary[];
}) {
  if (conversations.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <AppIcon icon={icon} className={cn("size-3.5", iconClassName)} />
        {label}
        <span className="text-muted-foreground/70">({conversations.length})</span>
      </div>
      {conversations.map((c) => (
        <Row key={c.id} conversation={c} {...rowProps} />
      ))}
    </div>
  );
}

/** Left rail: header, search, All/Mine/Queue tabs, and the conversation list. */
export function ConversationList({
  conversations,
  selectedId,
  activeTab,
  currentStaffId,
  typingByConversation,
  unreadByConversation,
  isLoading,
  onTabChange,
  onSelect,
  onTake,
  takingIds,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const counts = useMemo<Record<ConversationTab, number>>(
    () => ({
      all: conversations.length,
      mine: conversations.filter((c) => matchesTab(c, "mine", currentStaffId))
        .length,
      queue: conversations.filter((c) => matchesTab(c, "queue", currentStaffId))
        .length,
    }),
    [conversations, currentStaffId],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return conversations
      .filter((c) => matchesTab(c, activeTab, currentStaffId))
      .filter(
        (c) => !query || c.name.toLowerCase().includes(query),
      );
  }, [conversations, activeTab, currentStaffId, search]);

  // Queue tab reads better as one group staff need to act on and one the AI
  // already has (decision doc: a split inside Queue over two more top-level
  // tabs). Assignment is what put a row in `visible` here — this only
  // separates it further by `aiState`.
  const queueSplit = useMemo(
    () => (activeTab === "queue" ? splitQueueByAiState(visible) : null),
    [activeTab, visible],
  );

  const rowProps: RowSharedProps = {
    selectedId,
    activeTab,
    typingByConversation,
    unreadByConversation,
    takingIds,
    onSelect,
    onTake,
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="px-1 text-2xl font-semibold text-foreground">Chat</h2>

      <div className="relative">
        <AppIcon
          icon="solar:magnifer-linear"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="rounded-lg bg-muted/50 pl-9"
        />
      </div>

      <ConversationTabs
        active={activeTab}
        counts={counts}
        onChange={onTabChange}
      />

      <ScrollArea className="-mx-1 min-h-0 flex-1">
        <div className="flex flex-col gap-0.5 px-1">
          {isLoading && (
            <p className="px-2 py-6 text-sm text-muted-foreground">Loading…</p>
          )}
          {!isLoading && visible.length === 0 && (
            <p className="px-2 py-6 text-sm text-muted-foreground">
              No conversations
            </p>
          )}
          {queueSplit ? (
            <>
              <QueueGroup
                label="Needs a human"
                icon="solar:user-speak-linear"
                conversations={queueSplit.needsHuman}
                {...rowProps}
              />
              <QueueGroup
                label="AI handling"
                icon="solar:magic-stick-3-linear"
                iconClassName="text-gold"
                conversations={queueSplit.aiHandling}
                {...rowProps}
              />
            </>
          ) : (
            visible.map((c) => <Row key={c.id} conversation={c} {...rowProps} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
