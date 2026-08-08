"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils/cn";
import {
  filterNavByPermissions,
  isSuperAdmin,
  type StaffSession,
} from "@/lib/auth/permissions";
import type { NavGroup } from "@/types/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { AppIcon } from "@/components/shared/app-icon";
import { LogoutConfirmModal } from "@/components/shared/logout-confirm-modal";
import { logoutAction } from "@/lib/auth/logout-action";
import { disconnectChatSocket } from "@/features/chat";

interface AppSidebarProps {
  /** Raw nav config, injected by the (staff) layout (components can't import config). */
  navGroups: NavGroup[];
  staffSession?: StaffSession | null;
}

/**
 * Named `AppSidebar` (not `Sidebar`) to avoid clashing with the `Sidebar`
 * primitive it imports from `components/ui/sidebar`. Icons are Iconify Solar
 * (linear inactive / bold active) rendered via `<AppIcon>` (ADR-0009). The rail
 * is docked on large screens and a drawer below `lg` (ADR-0010, revised).
 */
export function AppSidebar({ navGroups, staffSession = null }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, startLogout] = useTransition();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = () => {
    startLogout(async () => {
      try {
        const data = await logoutAction();
        toast.success(data?.message || "Logged out successfully");
        router.push("/login");
      } catch (error) {
        toast.error("Failed to log out");
        console.error("Logout failed", error);
      } finally {
        // Hang up the shared chat socket on logout regardless of where it fired
        // from — otherwise the socket keeps reconnecting in the background and
        // the staff member lingers as "online" until the presence TTL lapses.
        disconnectChatSocket();
        setIsLogoutModalOpen(false);
      }
    });
  };

  const filteredGroups = filterNavByPermissions(navGroups, staffSession);
  const superAdmin = isSuperAdmin(staffSession);

  const initials = staffSession
    ? `${staffSession.firstName.charAt(0)}${staffSession.lastName.charAt(0)}`.toUpperCase()
    : "AD";
  const displayName = staffSession
    ? `${staffSession.firstName} ${staffSession.lastName}`.trim()
    : "Admin User";
  const roleLabel = superAdmin
    ? "Super Admin"
    : staffSession?.role.name || "Staff Member";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-5 py-6">
        <Logo href="/" variant="full" imageClassName="h-9 w-auto" />
      </SidebarHeader>

      <SidebarContent className="px-3">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-2 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const fullHref = item.href;
                // Compare against the path only — `usePathname()` strips the
                // query/hash, but hrefs may carry them (e.g. `/catalogues?page=1`).
                const hrefPath = fullHref.split(/[?#]/)[0];
                const isActive =
                  pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "group/nav h-9 rounded-lg px-3 transition-colors duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Link
                        href={fullHref}
                        className="flex items-center gap-3 w-full"
                      >
                        <AppIcon
                          icon={isActive ? item.iconActive : item.icon}
                          className={cn(
                            "size-5 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground/80 group-hover/nav:text-sidebar-foreground",
                          )}
                        />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/30 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Avatar className="size-9 shrink-0 rounded-lg border border-border/40">
                <AvatarImage src={staffSession?.avatarUrl || undefined} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold uppercase text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
                  {displayName}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {superAdmin && (
                    <AppIcon icon="solar:crown-bold" className="size-3 text-gold" />
                  )}
                  {roleLabel}
                </span>
              </div>
              <AppIcon
                icon="solar:alt-arrow-up-linear"
                className="ml-auto size-4 shrink-0 text-muted-foreground"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56 rounded-xl border-border/60"
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {staffSession?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2.5"
              onClick={() => router.push("/settings")}
            >
              <AppIcon
                icon="solar:settings-linear"
                className="size-4 text-muted-foreground"
              />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
              disabled={isLoggingOut}
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <AppIcon
                icon="solar:logout-2-linear"
                className={cn("size-4", isLoggingOut && "animate-pulse")}
              />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LogoutConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleLogout}
          isPending={isLoggingOut}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
