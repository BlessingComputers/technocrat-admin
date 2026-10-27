"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../api/notifications.queries";
import { resolveNotificationRoute } from "../utils/resolve-notification-route";
import { formatRelativeTime } from "../utils/format";
import { notificationIcon } from "../utils/notification-icon";
import type { StaffNotification } from "../types/notification";
import { MetaLabel } from "@/components/shared/meta-label";

/**
 * Topbar staff-notification bell (ticket A6). Backed by the REST feed
 * (`GET /staff/notifications` + `/unread-count`) rather than an in-memory
 * store — the `notification:new` socket event (wired in `use-chat-socket`)
 * refreshes these queries instead of being the only source of truth, so a
 * missed socket event self-heals on the next poll or bell open.
 *
 * Every click routes through `resolveNotificationRoute` — the one place a
 * notification becomes a URL. A notification the resolver can't place renders
 * read-only: no click target, because a wrong destination is worse than none.
 */
export function NotificationBell() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: page, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const notifications = page?.notifications ?? [];

  const open = (n: StaffNotification) => {
    const route = resolveNotificationRoute(n);
    if (!n.isRead) markRead.mutate(n.id);
    if (route) router.push(route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <AppIcon icon="solar:bell-linear" className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold leading-4 text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 rounded-xl border-border/60 p-0"
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <MetaLabel>
            Notifications
          </MetaLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs font-medium text-primary-ink hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <AppIcon
                icon="solar:bell-off-linear"
                className="size-7 text-muted-foreground/50"
              />
              <p className="text-sm text-muted-foreground">
                No notifications
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const route = resolveNotificationRoute(n);
              const clickable = Boolean(route);
              return (
                <div
                  key={n.id}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => open(n) : undefined}
                  onKeyDown={
                    clickable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            open(n);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    clickable && "cursor-pointer hover:bg-muted/60",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      n.isImportant
                        ? "bg-destructive/10 text-destructive-ink"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <AppIcon icon={notificationIcon(n.type)} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm text-foreground",
                          n.isImportant ? "font-semibold" : "font-semibold",
                        )}
                      >
                        {n.title}
                        {n.isImportant && (
                          <AppIcon
                            icon="solar:danger-circle-linear"
                            className="ml-1 inline-block size-3 shrink-0 align-middle text-destructive-ink"
                          />
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    {!n.isRead && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Delete notification"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(n.id);
                      }}
                      className="rounded p-0.5 text-muted-foreground/60 opacity-0 transition-opacity hover:bg-muted hover:text-destructive-ink group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <AppIcon
                        icon="solar:trash-bin-trash-linear"
                        className="size-3.5"
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
