"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RolesListSkeleton } from "./users-skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useDeleteRole,
  useSyncRolePermissions,
} from "../api/rbac.queries";
import { permissionBadgeTone } from "../utils/permission-badge";
import type { Permission, Role } from "../types/rbac";

function PermissionPicker({
  permissions,
  selectedPerms,
  onToggle,
  idPrefix,
}: {
  permissions: Permission[];
  selectedPerms: string[];
  onToggle: (id: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      {permissions.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          No permissions found
        </p>
      ) : (
        permissions.map((p) => (
          <div key={p.id} className="flex items-start space-x-3">
            <Checkbox
              id={`${idPrefix}-${p.id}`}
              checked={selectedPerms.includes(p.id)}
              onCheckedChange={() => onToggle(p.id)}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor={`${idPrefix}-${p.id}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {p.name}
              </label>
              {p.description && (
                <p className="text-xs text-muted-foreground font-mono">
                  {p.description}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function RolesTab() {
  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: permissions = [] } = usePermissions();

  const createRoleMutation = useCreateRole();
  const deleteRoleMutation = useDeleteRole();
  const syncPermsMutation = useSyncRolePermissions();

  const [isOpen, setIsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const handleCreateRole = () => {
    if (!newRole.name) {
      toast.error("Role name is required");
      return;
    }

    createRoleMutation.mutate(
      {
        name: newRole.name,
        description: newRole.description,
        permissionIds: selectedPerms.length > 0 ? selectedPerms : undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setNewRole({ name: "", description: "" });
          setSelectedPerms([]);
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteRoleMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const openManagePerms = (role: Role) => {
    setSelectedRole(role);
    setSelectedPerms(role.permissions.map((p) => p.id));
    setPermSearch("");
    setManageOpen(true);
  };

  const handleSavePerms = () => {
    if (!selectedRole) return;
    syncPermsMutation.mutate(
      { roleId: selectedRole.id, permissionIds: selectedPerms },
      { onSuccess: () => setManageOpen(false) },
    );
  };

  const togglePerm = (id: string) =>
    setSelectedPerms((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );

  const filteredPerms = permissions.filter((p) =>
    p.name.toLowerCase().includes(permSearch.toLowerCase()),
  );

  if (isLoadingRoles) {
    return <RolesListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">System &amp; Custom Roles</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <AppIcon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" />{" "}
              New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Role</DialogTitle>
              <DialogDescription>
                Create a new custom role and assign permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name">
                  Role Name <span className="text-destructive-ink">*</span>
                </Label>
                <Input
                  id="role-name"
                  placeholder="Warehouse Manager"
                  value={newRole.name}
                  onChange={(e) =>
                    setNewRole({ ...newRole, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-desc">Description</Label>
                <Input
                  id="role-desc"
                  placeholder="Manages inventory and fulfillment"
                  value={newRole.description}
                  onChange={(e) =>
                    setNewRole({ ...newRole, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2 mt-2">
                <Label>Initial Permissions (optional)</Label>
                <ScrollArea className="h-[200px] border rounded-md p-4 bg-muted/30">
                  <PermissionPicker
                    permissions={permissions}
                    selectedPerms={selectedPerms}
                    onToggle={togglePerm}
                    idPrefix="perm"
                  />
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={createRoleMutation.isPending}
              >
                {createRoleMutation.isPending ? (
                  <AppIcon
                    icon="solar:refresh-linear"
                    className="size-4 animate-spin mr-2"
                  />
                ) : null}
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id} className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    {role.isSystem && (
                      <Badge variant="warning" className="text-xs h-5">
                        System
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-muted-foreground">
                  {role.staffCount} staff members
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openManagePerms(role)}
                  >
                    <AppIcon icon="solar:settings-linear" className="size-4 mr-1" />{" "}
                    Manage
                  </Button>
                  {!role.isSystem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
                      onClick={() => setDeleteTarget(role)}
                      disabled={
                        deleteRoleMutation.isPending &&
                        deleteRoleMutation.variables === role.id
                      }
                    >
                      {deleteRoleMutation.isPending &&
                      deleteRoleMutation.variables === role.id ? (
                        <AppIcon
                          icon="solar:refresh-linear"
                          className="size-4 animate-spin mr-1"
                        />
                      ) : null}
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              {role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((p) => (
                    <Badge
                      key={p.id}
                      variant={permissionBadgeTone(p.name)}
                      className="font-mono font-normal text-xs"
                    >
                      {p.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No permissions assigned
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {roles.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
            No roles found.
          </div>
        )}
      </div>

      {/* Manage Permissions Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Permissions — {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Checked permissions replace ALL current ones on save.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Search permissions..."
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              className="mb-4"
            />
            <ScrollArea className="h-[250px] border rounded-md p-4 bg-muted/30">
              <PermissionPicker
                permissions={filteredPerms}
                selectedPerms={selectedPerms}
                onToggle={togglePerm}
                idPrefix="manage-perm"
              />
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setManageOpen(false)}
              disabled={syncPermsMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePerms} disabled={syncPermsMutation.isPending}>
              {syncPermsMutation.isPending ? (
                <AppIcon
                  icon="solar:refresh-linear"
                  className="size-4 animate-spin mr-2"
                />
              ) : null}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete role?"
        description={`This permanently removes "${deleteTarget?.name}". Assigned staff must be reassigned first.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteRoleMutation.isPending}
      />
    </div>
  );
}
