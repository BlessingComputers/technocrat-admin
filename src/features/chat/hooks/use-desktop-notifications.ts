"use client";

import { useEffect } from "react";

/**
 * Native browser (OS-level) desktop notifications + a notification sound for
 * incoming chats, for ALL staff. This is deliberately a plain imperative module
 * (like `showChatToast`) with a tiny init hook, so the socket hook's
 * `pushNotification` can fire it without prop-drilling a React value.
 *
 * Two browser constraints shape the design:
 *  1. `Notification.requestPermission()` is ignored unless it runs from a user
 *     gesture — so we request on the staff member's FIRST interaction with the
 *     shell, never on load. No in-app toggle: on/off is Chrome's own per-site
 *     notification setting. Deny once → we stay silent forever, no nagging.
 *  2. Autoplay policy blocks `Audio.play()` until the page has been interacted
 *     with — so the same first gesture "unlocks" the audio element.
 *
 * The OS banner only fires when the tab is unfocused/hidden (a focused admin
 * already has the in-app toast + bell). The sound plays whenever we notify,
 * since by then the open thread is already suppressed upstream.
 */

const SOUND_SRC = "/sounds/notify.wav";

let audio: HTMLAudioElement | null = null;
let audioUnlocked = false;
let gestureBound = false;

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Play the ding, restarting it if a previous play is still tailing off. */
function playSound(): void {
  if (!audioUnlocked || !audio) return;
  try {
    // The warm-up may have left it muted mid-flight — force audible before play.
    audio.muted = false;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Lost the autoplay grant (rare) — nothing actionable, stay silent.
    });
  } catch {
    /* ignore */
  }
}

/**
 * On the first user gesture anywhere in the shell: request notification
 * permission (if still undecided) and unlock the audio element. Self-removes.
 * Idempotent — safe to call from an effect that may re-run.
 */
function bindFirstGesture(): void {
  if (gestureBound || typeof window === "undefined") return;
  gestureBound = true;

  audio = new Audio(SOUND_SRC);
  audio.preload = "auto";

  const onGesture = () => {
    // This gesture grants sticky activation, so later `audio.play()` calls (from
    // socket events) are allowed. Mark unlocked synchronously — don't gate it on
    // the warm-up promise, which can reject if the file isn't loaded yet and
    // would then silence the ding forever.
    audioUnlocked = true;
    // Best-effort warm-up so the first real play is instant; failure is harmless.
    if (audio) {
      audio.muted = true;
      void audio
        .play()
        .then(() => {
          audio!.pause();
          audio!.currentTime = 0;
        })
        .catch(() => {})
        .finally(() => {
          if (audio) audio.muted = false;
        });
    }
    // Request permission from the gesture (Chrome ignores load-time requests).
    if (supported() && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => {});
    }
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };

  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
}

/**
 * Fire a native desktop notification + sound for an incoming chat. No-ops
 * silently when unsupported or permission isn't granted. Call this from the
 * socket notification funnel, sharing its open-thread suppression + debounce.
 */
export function notifyDesktop(opts: {
  title: string;
  body: string;
  /** Coalesce repeat alerts for the same conversation (Notification `tag`). */
  conversationId: string;
  /** Focus + route when the banner is clicked. */
  onClick: () => void;
}): void {
  // The sound needs NO notification permission — only the one-time (invisible)
  // audio unlock from the first gesture. So it always plays here.
  playSound();

  // The OS banner, by contrast, is hard-blocked by the browser until the user
  // grants permission — there's no way around it. So only this part is gated.
  if (!supported() || Notification.permission !== "granted") return;

  // A focused admin already sees the in-app toast + bell; only surface the OS
  // banner when the tab is in the background.
  const focused =
    document.visibilityState === "visible" && document.hasFocus();
  if (focused) return;

  try {
    const notification = new Notification(opts.title, {
      body: opts.body,
      tag: opts.conversationId,
      icon: "/assets/logo.png",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      opts.onClick();
    };
  } catch {
    // Some browsers throw if constructed outside a service worker on mobile —
    // the sound already played, so degrade quietly.
  }
}

/**
 * Mount once in the staff shell (via `ChatRealtimeProvider`) to arm the
 * first-gesture permission request + audio unlock.
 */
export function useDesktopNotifications(): void {
  useEffect(() => {
    bindFirstGesture();
  }, []);
}
