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

import type { WhatsAppStaffOption } from "../api/whatsapp.service";

interface ReassignMenuProps {
  staff: WhatsAppStaffOption[];
  /** The current owner — excluded from the list. */
  currentAssignedStaffId: string | null | undefined;
  onReassign: (staffId: string) => void;
}

/**
 * SUPER_ADMIN-only control to hand a conversation to another agent — the only
 * way an already-owned conversation changes hands. Agents claim from the queue
 * themselves and cannot take another's conversation.
 *
 * Unlike live chat, WhatsApp exposes no presence roster to clients, so the pick
 * list is the active staff directory rather than "who's online". An agent who
 * isn't toggled on for WhatsApp will still receive the conversation and see it
 * under Mine.
 */
export function ReassignMenu({
  staff,
  currentAssignedStaffId,
  onReassign,
}: ReassignMenuProps) {
  const candidates = staff.filter((s) => s.id !== currentAssignedStaffId);

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
            No other staff available
          </p>
        ) : (
          candidates.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onSelect={() => onReassign(s.id)}
              className="gap-2"
            >
              <AppIcon
                icon="solar:user-linear"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">{s.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
