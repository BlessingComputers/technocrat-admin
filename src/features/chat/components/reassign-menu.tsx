"use client";

import { AppIcon } from "@/components/shared/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAvatar } from "./chat-avatar";
import type { StaffPresence } from "../types/chat";

interface ReassignMenuProps {
  /** Online staff to pick from (presence map values). */
  staff: StaffPresence[];
  /** The current owner — excluded from the list and labelled. */
  currentAssignedStaffId: string | null;
  onReassign: (staffId: string) => void;
}

/**
 * Super-admin-only control to hand a conversation to another agent. The pick
 * list is the online-presence roster (the only staff identities the client has
 * without a directory endpoint); reassigning to an offline agent isn't offered.
 */
export function ReassignMenu({
  staff,
  currentAssignedStaffId,
  onReassign,
}: ReassignMenuProps) {
  const candidates = staff.filter((s) => s.staffId !== currentAssignedStaffId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Reassign conversation"
        title="Reassign to another agent"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <AppIcon icon="solar:users-group-rounded-linear" className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Reassign to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {candidates.length === 0 ? (
          <p className="px-2 py-2 text-sm text-muted-foreground">
            No other agents online
          </p>
        ) : (
          candidates.map((s) => (
            <DropdownMenuItem
              key={s.staffId}
              onSelect={() => onReassign(s.staffId)}
              className="gap-2"
            >
              <ChatAvatar
                name={s.name}
                seed={s.staffId}
                avatarUrl={s.avatarUrl}
                size="sm"
              />
              <span className="truncate">{s.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
