"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionsListSkeleton } from "./users-skeletons";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import {
  usePermissions,
  useCreatePermission,
  useDeletePermission,
} from "../api/rbac.queries";
import { permissionBadgeTone } from "../utils/permission-badge";
import type { Permission } from "../types/rbac";

export function PermissionsTab() {
  const { data: permissions = [], isLoading } = usePermissions();
  const createMutation = useCreatePermission();
  const deleteMutation = useDeletePermission();

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newPerm, setNewPerm] = useState({
    name: "",
    group: "",
    description: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

  const filtered = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.group || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = () => {
    if (!newPerm.name) {
      toast.error("Permission name is required");
      return;
    }
    if (!newPerm.name.includes(":")) {
      toast.error("Format must contain a colon separator (e.g., orders:read)");
      return;
    }

    createMutation.mutate(newPerm, {
      onSuccess: () => {
        setIsOpen(false);
        setNewPerm({ name: "", group: "", description: "" });
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <PermissionsListSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Search permissions..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" />{" "}
              New Permission
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Permission</DialogTitle>
              <DialogDescription>
                Create a new resource permission. Format:{" "}
                <code className="text-xs bg-muted px-1 rounded">
                  resource:action
                </code>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="orders:read"
                  value={newPerm.name}
                  onChange={(e) =>
                    setNewPerm({
                      ...newPerm,
                      name: e.target.value.toLowerCase(),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group">Group</Label>
                <Input
                  id="group"
                  placeholder="orders"
                  value={newPerm.group}
                  onChange={(e) =>
                    setNewPerm({ ...newPerm, group: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="View all orders"
                  value={newPerm.description}
                  onChange={(e) =>
                    setNewPerm({ ...newPerm, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <AppIcon
                    icon="solar:refresh-linear"
                    className="size-4 animate-spin mr-2"
                  />
                ) : null}
                Create
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
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>System</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    <div className="flex items-center justify-center">
                      <AppIcon
                        icon="solar:refresh-linear"
                        className="size-5 animate-spin mr-2"
                      />{" "}
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No permissions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge
                        variant={permissionBadgeTone(p.name)}
                        className="font-mono font-normal text-[11px]"
                      >
                        {p.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.group ? (
                        <Badge variant="muted" className="font-mono">
                          {p.group}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.description || "—"}
                    </TableCell>
                    <TableCell>
                      {p.isSystem ? (
                        <Badge variant="warning">system</Badge>
                      ) : (
                        <span className="text-muted-foreground">no</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!p.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(p)}
                          disabled={
                            deleteMutation.isPending &&
                            deleteMutation.variables === p.id
                          }
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === p.id ? (
                            <AppIcon
                              icon="solar:refresh-linear"
                              className="size-4 animate-spin mr-1"
                            />
                          ) : null}
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete permission?"
        description={`This permanently removes "${deleteTarget?.name}". Roles using it will lose this permission.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
