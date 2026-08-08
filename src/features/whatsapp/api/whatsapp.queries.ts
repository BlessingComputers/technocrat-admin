import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { whatsappService } from "./whatsapp.service";
import type { WhatsAppAiState, WhatsAppListParams } from "../types/whatsapp";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  conversations: (params: WhatsAppListParams) =>
    [...whatsappKeys.all, "conversations", params] as const,
  queue: () => [...whatsappKeys.all, "queue"] as const,
  detail: (id: string) => [...whatsappKeys.all, "detail", id] as const,
  presence: () => [...whatsappKeys.all, "presence"] as const,
  staff: () => [...whatsappKeys.all, "staff"] as const,
};

// ── Queries ────────────────────────────────────────────────────────────

export function useWhatsAppConversations(params: WhatsAppListParams = {}) {
  return useQuery({
    queryKey: whatsappKeys.conversations(params),
    queryFn: () => whatsappService.listConversations(params),
  });
}

export function useWhatsAppQueue() {
  return useQuery({
    queryKey: whatsappKeys.queue(),
    queryFn: () => whatsappService.getQueue(),
  });
}

/**
 * Thread history. This is the source of truth on open and after a refresh —
 * live socket messages are layered on top of it, never instead of it (the same
 * mistake live chat had to fix).
 */
export function useWhatsAppConversation(id?: string) {
  return useQuery({
    queryKey: whatsappKeys.detail(id ?? ""),
    queryFn: () => whatsappService.getConversation(id!),
    enabled: Boolean(id),
  });
}

export function useWhatsAppPresence() {
  return useQuery({
    queryKey: whatsappKeys.presence(),
    queryFn: () => whatsappService.getPresence(),
  });
}

/**
 * Staff directory for the reassign picker. Only fetched when the caller is a
 * SUPER_ADMIN — the endpoint 403s for everyone else, and only they can reassign.
 */
export function useWhatsAppStaff(enabled: boolean) {
  return useQuery({
    queryKey: whatsappKeys.staff(),
    queryFn: () => whatsappService.listStaff(),
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────

/**
 * Send a reply. The server only acknowledges the queueing (202), so there is
 * nothing to write into the thread cache here — the delivered message arrives
 * over `whatsapp:message:new` and the realtime layer appends it.
 */
export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      whatsappService.sendMessage(id, body),
  });
}

export function useAssignSelf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => whatsappService.assignSelf(id),
    onSuccess: () => {
      // The conversation left the queue and became ACTIVE — both lists and the
      // open thread's header are now stale.
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    },
  });
}

export function useReassignWhatsAppConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) =>
      whatsappService.reassign(id, staffId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    },
  });
}

/**
 * Stop/resume the AI on one WhatsApp conversation (ticket A5). No live socket
 * event carries WhatsApp `aiState` changes (that's out of A4's scope — see its
 * doc), so unlike the chat feature's equivalent mutation this invalidates on
 * success rather than waiting on a socket update — the same pattern every
 * other WhatsApp mutation here already uses (claim/resolve/reassign).
 */
export function useSetWhatsAppAiState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aiState }: { id: string; aiState: WhatsAppAiState }) =>
      whatsappService.setAiState(id, aiState),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    },
  });
}

export function useResolveWhatsAppConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => whatsappService.resolveConversation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    },
  });
}

/**
 * Toggle WhatsApp availability. This is separate from live-chat presence on
 * purpose — a staff member's WhatsApp capacity never competes with their chat
 * capacity — so it gets its own switch in the workspace header.
 */
export function useSetWhatsAppPresence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (online: boolean) =>
      online ? whatsappService.goOnline() : whatsappService.goOffline(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.presence() });
      // Going online joins the staff room server-side, so the queue can change
      // from "nothing visible" to a live list.
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.queue() });
    },
  });
}
