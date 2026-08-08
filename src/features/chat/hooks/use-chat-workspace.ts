"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import {
  useConversation,
  useConversationNotes,
  useConversations,
  useReassignConversation,
  useSetChatAiState,
  useStaffRoomHistory,
} from "../api/chat.queries";
import { STAFF_ROOM_ID, useChatStore } from "../store/chat.store";
import { useChatRealtime } from "../components/chat-realtime-provider";
import { useChatUrlState } from "./use-chat-url-state";
import { useCurrentStaffId } from "./use-current-staff-id";
import { applyAiStateOverlay } from "../utils/chat-ai-state";
import type { NotesFormInput } from "../schemas/notes-form";
import type {
  ChatMessage,
  ConversationSummary,
  ConversationTab,
} from "../types/chat";

/** A synthetic list row for the always-present internal staff room. The AI
 * first responder never engages it, so `aiState` is always `OFF`. */
const STAFF_ROOM_SUMMARY: ConversationSummary = {
  id: STAFF_ROOM_ID,
  channel: "STAFF_ROOM",
  status: "ACTIVE",
  name: "Staff Room",
  aiState: "OFF",
};

function newOptimisticMessage(
  conversationId: string,
  body: string,
  senderId: string | null,
  senderName: string,
): ChatMessage {
  return {
    id: "",
    conversationId,
    senderType: "STAFF",
    senderId,
    senderName,
    body,
    createdAt: new Date().toISOString(),
    idempotencyKey:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
  };
}

/**
 * Orchestrates the chat workspace: session, socket, REST seeds, and the live
 * store. Returns the merged view + handlers so `ChatWorkspaceView` stays a thin
 * composition (CLAUDE.md). REST payloads arrive already normalized by
 * `chat.service.ts`, so this hook speaks only app-facing types.
 */
// Safety net for a "Take": if the confirming broadcast never lands (e.g. the
// socket dropped the emit), release the in-flight lock after this long so the
// button can't stay stuck in its pending state.
const TAKE_TIMEOUT_MS = 10_000;

export function useChatWorkspace() {
  const { staffSession } = useStaffSession();
  // Identity for ownership matching is the staff UUID (what the backend stores in
  // assignedStaffId / senderId / presence), NOT the session's human staffId code —
  // see useCurrentStaffId. The session still provides the display name.
  const currentStaffId = useCurrentStaffId();
  const currentStaffName = staffSession
    ? `${staffSession.firstName} ${staffSession.lastName}`.trim()
    : "You";

  const isSuper = isSuperAdmin(staffSession);

  const socket = useChatRealtime();
  const reassign = useReassignConversation();
  const setAiState = useSetChatAiState();
  const { commit } = useChatUrlState();

  const selectedId = useChatStore((s) => s.selectedId);
  const activeTab = useChatStore((s) => s.activeTab);
  const messagesByConversation = useChatStore((s) => s.messagesByConversation);
  const previewByConversation = useChatStore((s) => s.previewByConversation);
  const aiStateByConversation = useChatStore((s) => s.aiStateByConversation);
  const typingByConversation = useChatStore((s) => s.typingByConversation);
  const unreadByConversation = useChatStore((s) => s.unreadByConversation);
  const presence = useChatStore((s) => s.presence);
  const seedMessages = useChatStore((s) => s.seedMessages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const clearUnread = useChatStore((s) => s.clearUnread);

  const isStaffRoom = selectedId === STAFF_ROOM_ID;

  // ── Queries ────────────────────────────────────────────────────────
  const conversationsQuery = useConversations(false);
  const detailQuery = useConversation(isStaffRoom ? null : selectedId);
  const notesQuery = useConversationNotes(isStaffRoom ? null : selectedId);
  const staffRoomQuery = useStaffRoomHistory(isStaffRoom);

  // Seed the store from REST history whenever a fresh payload lands.
  useEffect(() => {
    if (detailQuery.data && !isStaffRoom && selectedId) {
      seedMessages(selectedId, detailQuery.data.messages);
    }
  }, [detailQuery.data, isStaffRoom, selectedId, seedMessages]);

  useEffect(() => {
    if (staffRoomQuery.data) {
      seedMessages(STAFF_ROOM_ID, staffRoomQuery.data.messages ?? []);
    }
  }, [staffRoomQuery.data, seedMessages]);

  // Join + mark read whenever the open conversation changes, regardless of how
  // it was selected (click, deep link, back/forward). Socket.IO buffers the
  // emits until the connection is up, and the connect handler re-joins after a
  // reconnect.
  const { joinConversation, markRead } = socket;
  useEffect(() => {
    if (!selectedId || selectedId === STAFF_ROOM_ID) return;
    joinConversation(selectedId);
    markRead(selectedId);
    clearUnread(selectedId);
  }, [selectedId, joinConversation, markRead, clearUnread]);

  // ── Derived list (append the staff room) ───────────────────────────
  // Overlay the live preview onto each row so the last-message line reflects
  // messages seen over the socket. `previewByConversation` is maintained from
  // EVERY preview-bearing event — including `chat:dashboard:new` /
  // `notification:new` for conversations that were never opened — so a row shows
  // its latest message without depending on the REST `lastMessagePreview`, which
  // only refreshes on a refetch and requires the worker to have persisted it.
  // Falls back to the REST fields when we have no live preview yet.
  const conversations = useMemo<ConversationSummary[]>(() => {
    const applyPreview = (conv: ConversationSummary): ConversationSummary => {
      const live = previewByConversation[conv.id];
      if (!live?.body) return conv;
      return {
        ...conv,
        lastMessagePreview: live.body,
        lastMessageAt: live.at ?? conv.lastMessageAt,
      };
    };
    return [
      ...applyAiStateOverlay(
        (conversationsQuery.data ?? []).map(applyPreview),
        aiStateByConversation,
      ),
      STAFF_ROOM_SUMMARY,
    ];
  }, [conversationsQuery.data, previewByConversation, aiStateByConversation]);

  // Prefer the list row, but fall back to the fetched detail so a refresh always
  // renders the thread. On a fresh load the `useConversation` detail resolves
  // independently of — and often before — the conversation list, and a
  // RESOLVED/filtered conversation may be absent from the list entirely; without
  // this fallback the workspace would show the empty state on refresh even though
  // the history has already loaded into the store.
  const selectedConversation = useMemo<ConversationSummary | null>(
    () =>
      conversations.find((c) => c.id === selectedId) ??
      (!isStaffRoom && detailQuery.data ? detailQuery.data : null),
    [conversations, selectedId, isStaffRoom, detailQuery.data],
  );

  const messages = selectedId
    ? messagesByConversation[selectedId] ?? []
    : [];

  const typingUserIds = selectedId
    ? (typingByConversation[selectedId] ?? []).filter(
        (id) => id !== currentStaffId,
      )
    : [];

  // Name the typer for the indicator: a staff typer is in the presence map;
  // anyone else typing in a customer conversation is the customer, so fall back
  // to the conversation's display name. Undefined → anonymous dots.
  const typistName = typingUserIds.length
    ? presence[typingUserIds[0]]?.name ??
      (isStaffRoom ? undefined : selectedConversation?.name)
    : undefined;

  const members = staffRoomQuery.data?.members ?? [];

  // Customer contact for prefilling CRM notes: the list row carries the email;
  // phone (when the backend exposes it) comes from the fuller detail record.
  const customerEmail =
    selectedConversation?.customerEmail ?? detailQuery.data?.customer?.email ?? null;
  const customerPhone =
    selectedConversation?.customerPhone ?? detailQuery.data?.customer?.phone ?? null;
  const customerName = selectedConversation?.name ?? null;

  // ── Handlers (selection/tab go through the URL — ADR-0005) ─────────
  const handleSelect = useCallback(
    (id: string) => commit(id, useChatStore.getState().activeTab),
    [commit],
  );

  // Deselect — on mobile this is the thread's "back" to the conversation list
  // (the two panes stack, so closing the thread reveals the list again).
  const handleBack = useCallback(
    () => commit(null, useChatStore.getState().activeTab),
    [commit],
  );

  const setTab = useCallback(
    (tab: ConversationTab) =>
      commit(useChatStore.getState().selectedId, tab),
    [commit],
  );

  // "Take" is a fire-and-forget socket emit (chat:assign) whose only
  // confirmation is the chat:conversation:assigned broadcast landing back.
  // Without a guard the button re-emits on every click during that round-trip.
  // Track in-flight ids so each conversation emits exactly once, and so both
  // Take affordances (the composer and the queue rows) can show a pending state.
  const takeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const [takingIds, setTakingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const clearTaking = useCallback((id: string) => {
    const timer = takeTimersRef.current.get(id);
    if (timer === undefined) return; // not in flight
    clearTimeout(timer);
    takeTimersRef.current.delete(id);
    setTakingIds(new Set(takeTimersRef.current.keys()));
  }, []);

  const handleTake = useCallback(
    (id: string) => {
      // Swallow repeat clicks while a take for this conversation is in flight.
      if (takeTimersRef.current.has(id)) return;
      const timer = setTimeout(() => clearTaking(id), TAKE_TIMEOUT_MS);
      takeTimersRef.current.set(id, timer);
      setTakingIds(new Set(takeTimersRef.current.keys()));
      socket.assignConversation(id);
    },
    [socket, clearTaking],
  );

  // A take resolves when the conversation gains an owner (the broadcast landed);
  // clear any in-flight id that now has an assignedStaffId.
  useEffect(() => {
    if (takeTimersRef.current.size === 0) return;
    for (const id of [...takeTimersRef.current.keys()]) {
      const conv =
        conversations.find((c) => c.id === id) ??
        (selectedConversation?.id === id ? selectedConversation : undefined);
      if (conv?.assignedStaffId) clearTaking(id);
    }
  }, [conversations, selectedConversation, clearTaking]);

  // Flush any pending timers on unmount.
  useEffect(() => {
    const timers = takeTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  // Super-admin reassign: move the open conversation to another agent. The
  // backend models this as a REST PATCH (SUPER_ADMIN only), not a socket event;
  // its `chat:conversation:assigned` broadcast then updates every joined socket.
  const handleReassign = useCallback(
    (staffId: string) => {
      if (selectedId && !isStaffRoom) {
        reassign.mutate({ id: selectedId, staffId });
      }
    },
    [selectedId, isStaffRoom, reassign],
  );

  // AI stop/resume (ticket A5). Any staff member, not gated on assignment or
  // SUPER_ADMIN. No optimistic write — `chat:ai:state` (A4) corrects the row.
  const handleStopAi = useCallback(() => {
    if (selectedId && !isStaffRoom) {
      setAiState.mutate({ id: selectedId, aiState: "OFF" });
    }
  }, [selectedId, isStaffRoom, setAiState]);

  const handleResumeAi = useCallback(() => {
    if (selectedId && !isStaffRoom) {
      setAiState.mutate({ id: selectedId, aiState: "HANDLING" });
    }
  }, [selectedId, isStaffRoom, setAiState]);

  const handleResolve = useCallback(() => {
    if (selectedId && !isStaffRoom) socket.resolveConversation(selectedId);
  }, [selectedId, isStaffRoom, socket]);

  const handleSend = useCallback(
    (body: string) => {
      if (!selectedId) return;
      const optimistic = newOptimisticMessage(
        selectedId,
        body,
        currentStaffId,
        currentStaffName,
      );
      appendMessage(selectedId, optimistic);
      if (isStaffRoom) {
        socket.sendStaffRoomMessage({
          body,
          idempotencyKey: optimistic.idempotencyKey,
        });
      } else {
        socket.sendMessage({
          conversationId: selectedId,
          body,
          idempotencyKey: optimistic.idempotencyKey,
        });
      }
    },
    [selectedId, isStaffRoom, currentStaffId, currentStaffName, appendMessage, socket],
  );

  const handleTypingStart = useCallback(() => {
    if (!selectedId) return;
    if (isStaffRoom) socket.setStaffRoomTyping(true);
    else socket.startTyping(selectedId);
  }, [selectedId, isStaffRoom, socket]);

  const handleTypingStop = useCallback(() => {
    if (!selectedId) return;
    if (isStaffRoom) socket.setStaffRoomTyping(false);
    else socket.stopTyping(selectedId);
  }, [selectedId, isStaffRoom, socket]);

  const handleSaveNotes = useCallback(
    (values: NotesFormInput) => {
      if (!selectedId || isStaffRoom) return;
      // All 12 documented note fields round-trip (#28); empty strings are
      // omitted so the backend doesn't overwrite saved values with blanks.
      socket.updateNotes({
        conversationId: selectedId,
        leadName: values.leadName || undefined,
        leadEmail: values.leadEmail || undefined,
        leadPhone: values.leadPhone || undefined,
        leadAddress: values.leadAddress || undefined,
        leadStatus: values.leadStatus || undefined,
        productsDiscussed: values.productsDiscussed || undefined,
        pricesDiscussed: values.pricesDiscussed || undefined,
        budgetRange: values.budgetRange || undefined,
        customerIntent: values.customerIntent || undefined,
        handoverNotes: values.handoverNotes || undefined,
        followUpDate: values.followUpDate || undefined,
        followUpNote: values.followUpNote || undefined,
      });
    },
    [selectedId, isStaffRoom, socket],
  );

  const assignedStaffId = selectedConversation?.assignedStaffId ?? null;
  const isOnline = Boolean(assignedStaffId && presence[assignedStaffId]);

  // Who owns the open conversation, relative to the current staff member:
  // "unassigned" (still in the queue), "mine" (I took it / was assigned it), or
  // "other" (someone else's — I'm a read-only onlooker unless super admin).
  const assignmentState: "unassigned" | "mine" | "other" = !assignedStaffId
    ? "unassigned"
    : assignedStaffId === currentStaffId
      ? "mine"
      : "other";

  // Assigned admin's name/avatar — prefer the backend fields (present even when
  // the owner is offline; avatar added backend-side R1), fall back to the
  // online-presence map.
  const assignedStaffName = assignedStaffId
    ? selectedConversation?.assignedStaffName ??
      presence[assignedStaffId]?.name ??
      null
    : null;
  const assignedStaffAvatar = assignedStaffId
    ? selectedConversation?.assignedStaffAvatar ??
      presence[assignedStaffId]?.avatarUrl ??
      null
    : null;

  // Reply gating: the staff room and a super admin can always send; a regular
  // admin must own the chat ("mine") to reply. An onlooker ("other") cannot.
  const canReply = isStaffRoom || isSuper || assignmentState === "mine";

  return {
    currentStaffId,
    isSuper,
    canReply,
    assignmentState,
    assignedStaffName,
    assignedStaffAvatar,
    presence,
    connected: socket.connected,
    connectionStatus: socket.connectionStatus,
    conversations,
    conversationsLoading: conversationsQuery.isLoading,
    selectedId,
    selectedConversation,
    isStaffRoom,
    activeTab,
    messages,
    typingUserIds,
    typistName,
    typingByConversation,
    unreadByConversation,
    members,
    isOnline,
    notes: notesQuery.data,
    notesLoading: notesQuery.isLoading,
    customerEmail,
    customerPhone,
    customerName,
    takingIds,
    setTab,
    handleSelect,
    handleBack,
    handleTake,
    handleReassign,
    handleStopAi,
    handleResumeAi,
    isAiStatePending: setAiState.isPending,
    handleResolve,
    handleSend,
    handleTypingStart,
    handleTypingStop,
    handleSaveNotes,
  };
}
