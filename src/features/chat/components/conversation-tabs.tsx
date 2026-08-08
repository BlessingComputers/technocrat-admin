import { cn } from "@/lib/utils/cn";
import type { ConversationTab } from "../types/chat";

interface ConversationTabsProps {
  active: ConversationTab;
  counts: Record<ConversationTab, number>;
  onChange: (tab: ConversationTab) => void;
}

const TABS: { key: ConversationTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mine", label: "Mine" },
  { key: "queue", label: "Queue" },
];

/** All / Mine / Queue filter pills with counts (designs admin-1..4). */
export function ConversationTabs({
  active,
  counts,
  onChange,
}: ConversationTabsProps) {
  return (
    <div className="flex items-center gap-2">
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {label}
            <span
              className={cn(
                "flex min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                isActive
                  ? "bg-background/20 text-background"
                  : "bg-background text-muted-foreground",
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
