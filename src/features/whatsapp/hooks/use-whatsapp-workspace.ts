"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { isSuperAdmin } from "@/lib/auth/permissions";
import { useStaffSession } from "@/lib/auth/session-context";
import { useCurrentStaffId } from "@/lib/hooks/use-current-staff-id";
import { ApiError } from "@/lib/api/client";

import {
  useAssignSelf,
  useReassignWhatsAppConversation,
  useResolveWhatsAppConversation,
  useSendWhatsAppMessage,
  useSetWhatsAppAiState,
  useSetWhatsAppPresence,
  useWhatsAppConversation,
  useWhatsAppConversations,
  useWhatsAppPresence,
  useWhatsAppQueue,
  useWhatsAppStaff,
} from "../api/whatsapp.queries";
import { useWhatsAppSocket } from "./use-whatsapp-socket";
import { useWhatsAppStore } from "../store/whatsapp.store";
import { replyWindowState } from "../utils/whatsapp-format";

/**
 * Orchestrates the WhatsApp workspace: presence, socket, REST seeds, and the
 * actions the header and composer fire. The view stays presentational.
 */
export function useWhatsAppWorkspace() {
  const { staffSession } = useStaffSession();
  const currentStaffId = useCurrentStaffId();
  const isSuper = isSuperAdmin(staffSession);

  const selectedId = useWhatsAppStore((s) => s.selectedId);
  const tab = useWhatsAppStore((s) => s.tab);
  const unseen = useWhatsAppStore((s) => s.unseen);
  const select = useWhatsAppStore((s) => s.select);
  const setTab = useWhatsAppStore((s) => s.setTab);

  const presence = useWhatsAppPresence();
  const isOnline = presence.data?.isOnline ?? false;
  const setPresence = useSetWhatsAppPresence();

  const { connection } = useWhatsAppSocket(isOnline);

  // The queue is fetched regardless of tab so its count can badge the tab from
  // anywhere — an unclaimed backlog should never be invisible.
  const queue = useWhatsAppQueue();
  const owned = useWhatsAppConversations({ mine: true });
  const all = useWhatsAppConversations({});

  const activeList = tab === "queue" ? queue : tab === "mine" ? owned : all;

  const thread = useWhatsAppConversation(selectedId ?? undefined);
  const staff = useWhatsAppStaff(isSuper);

  const sendMessage = useSendWhatsAppMessage();
  const assignSelf = useAssignSelf();
  const resolve = useResolveWhatsAppConversation();
  const reassign = useReassignWhatsAppConversation();
  const setAiState = useSetWhatsAppAiState();

  const conversation = thread.data?.conversation ?? null;
  const replyWindow = useMemo(
    () => replyWindowState(conversation?.windowExpiresAt ?? null),
    [conversation?.windowExpiresAt],
  );

  const isUnassigned = Boolean(conversation && !conversation.assignedStaffId);
  const isAssignedToMe = Boolean(
    conversation &&
      currentStaffId &&
      conversation.assignedStaffId === currentStaffId,
  );

  const handleSend = async (body: string) => {
    if (!selectedId) return;
    try {
      await sendMessage.mutateAsync({ id: selectedId, body });
    } catch (error) {
      // The window closing between render and send is the one failure staff
      // will actually hit, so name it rather than showing a generic error.
      const message =
        error instanceof ApiError && error.status === 422
          ? "The 24-hour reply window has closed — the customer must message again first."
          : "Couldn’t send the message. Try again.";
      toast.error(message);
      throw error;
    }
  };

  const handleClaim = () => {
    if (!selectedId) return;
    const promise = assignSelf.mutateAsync(selectedId);
    toast.promise(promise, {
      loading: "Claiming conversation…",
      success: "Claimed — you can reply now.",
      error: (error) =>
        error instanceof ApiError && error.status === 409
          ? "Another agent claimed this first."
          : "Couldn’t claim the conversation.",
    });
    promise.catch(() => {});
  };

  const handleResolve = () => {
    if (!selectedId) return;
    const promise = resolve.mutateAsync(selectedId);
    toast.promise(promise, {
      loading: "Resolving…",
      success: "Conversation resolved.",
      error: "Couldn’t resolve the conversation.",
    });
    promise.catch(() => {});
  };

  const handleReassign = (staffId: string) => {
    if (!selectedId) return;
    const promise = reassign.mutateAsync({ id: selectedId, staffId });
    toast.promise(promise, {
      loading: "Reassigning…",
      success: "Conversation reassigned.",
      error: "Couldn’t reassign the conversation.",
    });
    promise.catch(() => {});
  };

  // AI stop/resume (ticket A5). Any staff member, not gated on assignment. A
  // 409 means the world moved between render and click (resolved, or already
  // resumed elsewhere) — expected, not an error to log loudly.
  const handleStopAi = () => {
    if (!selectedId) return;
    const promise = setAiState.mutateAsync({ id: selectedId, aiState: "OFF" });
    toast.promise(promise, {
      loading: "Stopping AI…",
      success: "AI stopped on this conversation.",
      error: (error) =>
        error instanceof ApiError && error.status === 409
          ? "That conversation's AI state already changed."
          : "Couldn’t stop the AI.",
    });
    promise.catch(() => {});
  };

  const handleResumeAi = () => {
    if (!selectedId) return;
    const promise = setAiState.mutateAsync({
      id: selectedId,
      aiState: "HANDLING",
    });
    toast.promise(promise, {
      loading: "Resuming AI…",
      success: "AI resumed.",
      error: (error) =>
        error instanceof ApiError && error.status === 409
          ? "That conversation's AI state already changed."
          : "Couldn’t resume the AI.",
    });
    promise.catch(() => {});
  };

  return {
    // identity + connection
    isSuper,
    connection,
    isOnline,
    isPresencePending: setPresence.isPending,
    setOnline: (online: boolean) => setPresence.mutate(online),

    // list
    tab,
    setTab,
    conversations: activeList.data ?? [],
    isListLoading: activeList.isLoading,
    isListError: activeList.isError,
    refetchList: () => void activeList.refetch(),
    queueCount: queue.data?.length ?? 0,
    unseen,
    selectedId,
    select,

    // thread
    conversation,
    messages: thread.data?.messages ?? [],
    isThreadLoading: thread.isLoading,
    replyWindow,
    isUnassigned,
    isAssignedToMe,
    staff: staff.data ?? [],

    // actions
    handleSend,
    handleClaim,
    handleResolve,
    handleReassign,
    handleStopAi,
    handleResumeAi,
    isSending: sendMessage.isPending,
    isClaiming: assignSelf.isPending,
    isResolving: resolve.isPending,
    isAiStatePending: setAiState.isPending,
  };
}
