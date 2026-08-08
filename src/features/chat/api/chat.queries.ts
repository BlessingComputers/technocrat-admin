import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-message";
import { chatService } from "./chat.service";
import type { AiState } from "../types/chat.contract";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (mine: boolean) =>
    [...chatKeys.all, "conversations", { mine }] as const,
  conversation: (id: string) =>
    [...chatKeys.all, "conversation", id] as const,
  notes: (id: string) => [...chatKeys.all, "notes", id] as const,
  staffRoom: () => [...chatKeys.all, "staffroom"] as const,
};

export function useConversations(mine = false) {
  return useQuery({
    queryKey: chatKeys.conversations(mine),
    queryFn: () => chatService.listConversations(mine),
    // The list is kept fresh live over the socket; poll as a slow safety net.
    refetchInterval: 60_000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: chatKeys.conversation(id ?? ""),
    queryFn: () => chatService.getConversation(id!),
    enabled: Boolean(id),
  });
}

export function useConversationNotes(id: string | null) {
  return useQuery({
    queryKey: chatKeys.notes(id ?? ""),
    queryFn: () => chatService.getNotes(id!),
    enabled: Boolean(id),
  });
}

export function useStaffRoomHistory(enabled = true) {
  return useQuery({
    queryKey: chatKeys.staffRoom(),
    queryFn: () => chatService.getStaffRoomHistory(),
    enabled,
  });
}

/**
 * Super-admin reassign. The backend's `chat:conversation:assigned` broadcast
 * also refreshes joined dashboards live, but we invalidate on success so the
 * initiating super admin's list updates even if their socket missed the event.
 */
export function useReassignConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) =>
      chatService.reassignConversation(id, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
      toast.success("Chat reassigned");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to reassign chat"));
    },
  });
}

/**
 * Stop/resume the AI on one conversation (ticket A5). Deliberately does NOT
 * write `aiState` into any cache on success — the `chat:ai:state` socket
 * event A4 wires into `chat.store` is the source of truth, and an optimistic
 * write that later disagrees with it is worse than a brief render lag. A 409
 * means the world moved between render and click (someone resolved it, or the
 * AI escalated) — expected, not an error to log loudly.
 */
export function useSetChatAiState() {
  return useMutation({
    mutationFn: ({ id, aiState }: { id: string; aiState: AiState }) =>
      chatService.setAiState(id, aiState),
    onSuccess: (_data, { aiState }) => {
      toast.success(aiState === "OFF" ? "AI stopped on this conversation" : "AI resumed");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast("That conversation's AI state already changed.");
        return;
      }
      toast.error(getErrorMessage(error, "Couldn't update the AI state"));
    },
  });
}
