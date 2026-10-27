"use client";

import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { StaffRowsSkeleton } from "./users-skeletons";
import {
  useStaff,
  useRoles,
  useAssignStaffRole,
  useOnboardStaff,
} from "../api/rbac.queries";
import type { Staff } from "../types/rbac";

export function StaffTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: staffResponse, isLoading: isLoadingStaff } = useStaff({
    page,
    limit: 10,
    search: deferredSearch || undefined,
    isActive:
      statusFilter === "active"
        ? "true"
        : statusFilter === "inactive"
          ? "false"
          : undefined,
  });

  const staff = staffResponse?.data ?? [];
  const meta = staffResponse?.meta ?? {
    totalPages: 1,
    page: 1,
    total: 0,
    limit: 10,
  };

  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const assignMutation = useAssignStaffRole();
  const onboardMutation = useOnboardStaff();

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedCustomRole, setSelectedCustomRole] = useState<string>("none");

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  // Filter changes reset to page 1 (in the handler, not a setState-in-effect).
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const openAssignModal = (s: Staff) => {
    setSelectedStaff(s);
    setSelectedCustomRole(s.customRole ? s.customRole.id : "none");
    setAssignOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedStaff) return;
    const roleId = selectedCustomRole === "none" ? null : selectedCustomRole;
    assignMutation.mutate(
      { staffId: selectedStaff.staffId || selectedStaff.id, roleId },
      { onSuccess: () => setAssignOpen(false) },
    );
  };

  const handleOnboard = () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) return;
    onboardMutation.mutate(newStaff, {
      onSuccess: () => {
        setOnboardOpen(false);
        setNewStaff({ firstName: "", lastName: "", email: "" });
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <AppIcon
              icon="solar:magnifer-linear"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search name or email..."
              className="pl-8"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={onboardOpen} onOpenChange={setOnboardOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <AppIcon
                icon="solar:user-plus-rounded-linear"
                className="mr-2 h-4 w-4"
              />{" "}
              Onboard Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Onboard New Staff</DialogTitle>
              <DialogDescription>
                Create a new staff account. They will receive an email with their
                temporary credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive-ink">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={newStaff.firstName}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive-ink">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={newStaff.lastName}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, lastName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive-ink">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOnboardOpen(false)}
                disabled={onboardMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleOnboard}
                disabled={
                  onboardMutation.isPending ||
                  !newStaff.email ||
                  !newStaff.firstName ||
                  !newStaff.lastName
                }
              >
                {onboardMutation.isPending ? (
                  <AppIcon
                    icon="solar:refresh-linear"
                    className="size-4 animate-spin mr-2"
                  />
                ) : null}
                Onboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Custom Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingStaff ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-3">
                    <StaffRowsSkeleton />
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s) => (
                  <TableRow key={s.id || s.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary-ink shrink-0">
                          <AppIcon icon="solar:user-bold" className="size-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {s.firstName && s.lastName
                              ? `${s.firstName} ${s.lastName}`
                              : "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {s.email || "No email"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.staffId || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-normal">
                        {s.role?.name || "None"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.customRole ? (
                        <Badge variant="muted" className="font-mono font-normal">
                          {s.customRole.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <AppIcon
                              icon="solar:menu-dots-bold"
                              className="h-4 w-4"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAssignModal(s)}>
                            Assign Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {meta.totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-xs text-muted-foreground">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoadingStaff}
              >
                <AppIcon icon="solar:alt-arrow-left-linear" className="size-4 mr-1" />{" "}
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages || isLoadingStaff}
              >
                Next{" "}
                <AppIcon
                  icon="solar:alt-arrow-right-linear"
                  className="size-4 ml-1"
                />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Custom Role</DialogTitle>
            <DialogDescription>
              Assign or remove a custom role for this staff member.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedStaff && (
              <div className="bg-muted p-3 rounded-md border text-sm space-y-1">
                <p>
                  <strong>Name:</strong> {selectedStaff.firstName || "Unknown"}{" "}
                  {selectedStaff.lastName || "Unknown"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {selectedStaff.email || "No email"}
                  </span>
                </p>
                <p>
                  <strong>Current System Role:</strong>{" "}
                  {selectedStaff.role?.name || "None"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Custom Role</Label>
              {isLoadingRoles ? (
                <div className="h-10 border rounded-md px-3 py-2 flex items-center text-sm text-muted-foreground">
                  <AppIcon
                    icon="solar:refresh-linear"
                    className="size-4 animate-spin mr-2"
                  />{" "}
                  Loading roles...
                </div>
              ) : (
                <Select
                  value={selectedCustomRole}
                  onValueChange={setSelectedCustomRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      — No custom role (remove) —
                    </SelectItem>
                    {roles
                      .filter((r) => !r.isSystem)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty to remove any existing custom role.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={assignMutation.isPending || isLoadingRoles}
            >
              {assignMutation.isPending ? (
                <AppIcon
                  icon="solar:refresh-linear"
                  className="size-4 animate-spin mr-2"
                />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
