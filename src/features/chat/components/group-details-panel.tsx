import { ScrollArea } from "@/components/ui/scroll-area";
import { AppIcon } from "@/components/shared/app-icon";
import { ChatAvatar } from "./chat-avatar";
import type { ConversationParticipant } from "../types/chat";

interface GroupDetailsPanelProps {
  name: string;
  seed: string;
  members: ConversationParticipant[];
  onClose: () => void;
}

const ACTIONS: { icon: string; label: string }[] = [
  { icon: "solar:user-plus-rounded-linear", label: "Add member" },
  { icon: "solar:magnifer-linear", label: "Search" },
  { icon: "solar:file-linear", label: "File" },
];

/** Right panel for the staff room: header, quick actions and member list. */
export function GroupDetailsPanel({
  name,
  seed,
  members,
  onClose,
}: GroupDetailsPanelProps) {
  return (
    <div className="flex h-full flex-col gap-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Group details</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close group details panel"
          className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <AppIcon icon="solar:close-circle-linear" className="size-5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <ChatAvatar name={name} seed={seed} size="lg" />
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{members.length} members</p>
      </div>

      <div className="flex justify-center gap-8">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex flex-col items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon icon={action.icon} className="size-5" />
            <span className="text-xs">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <p className="mb-2 text-sm font-medium text-foreground">
          {members.length} members
        </p>
        <ScrollArea className="h-full">
          <ul className="flex flex-col gap-3 pr-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3">
                <ChatAvatar name={member.name} seed={member.id} size="sm" />
                <span className="text-sm text-foreground">{member.name}</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
}
