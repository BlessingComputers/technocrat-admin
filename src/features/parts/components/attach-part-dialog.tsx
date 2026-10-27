"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { getErrorMessage } from "@/lib/api/error-message";
import { useParts, useBulkLinkParts } from "../api/parts.queries";

interface AttachPartDialogProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Part UUIDs already linked to this product — shown as disabled. */
  linkedPartIds: string[];
}

/** Search the existing parts catalog and link a selection to this product. */
export function AttachPartDialog({
  productId,
  open,
  onOpenChange,
  linkedPartIds,
}: AttachPartDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data, isLoading } = useParts(
    { search: search || undefined, limit: 10, isActive: true },
    { enabled: open },
  );
  const bulkLink = useBulkLinkParts();

  const linked = new Set(linkedPartIds);
  const results = data?.data ?? [];

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reset = () => {
    setSelected(new Set());
    setSearch("");
  };

  const handleAttach = () => {
    if (selected.size === 0) return;
    const promise = bulkLink.mutateAsync({
      productId,
      data: { parts: [...selected].map((partId) => ({ partId, sortOrder: 0 })) },
    });
    toast.promise(promise, {
      loading: `Attaching ${selected.size} part(s)…`,
      success: `${selected.size} part(s) attached`,
      error: (err) => getErrorMessage(err, "Failed to attach parts"),
    });
    promise
      .then(() => {
        reset();
        onOpenChange(false);
      })
      .catch(() => {});
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach existing part</DialogTitle>
          <DialogDescription>
            Search parts already in the system and link them to this product.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-2.5 size-4 text-muted-foreground"
          />
          <Input
            autoFocus
            placeholder="Search by name or part number…"
            className="h-9 pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <AppIcon icon="solar:refresh-linear" className="size-5 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-xs font-medium text-muted-foreground">
              {search ? "No parts match" : "No parts found"}
            </p>
          ) : (
            results.map((p) => {
              const isLinked = linked.has(p.id);
              const isSelected = selected.has(p.id);
              const primary =
                p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isLinked}
                  onClick={() => toggle(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                    isLinked
                      ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/30",
                  )}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {primary ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={primary} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <AppIcon
                        icon="solar:cpu-bolt-linear"
                        className="size-4 text-muted-foreground/50"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {p.partId}
                      {p.partType ? ` · ${p.partType}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 font-mono text-xs font-medium tabular-nums text-muted-foreground">
                    {p.price == null ? "—" : formatPrice(p.price)}
                  </div>
                  {isLinked ? (
                    <Badge variant="muted" className="shrink-0 text-xs">
                      Linked
                    </Badge>
                  ) : (
                    <AppIcon
                      icon={
                        isSelected
                          ? "solar:check-circle-bold"
                          : "solar:add-circle-linear"
                      }
                      className={cn(
                        "size-5 shrink-0",
                        isSelected ? "text-primary-ink" : "text-muted-foreground",
                      )}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAttach}
            disabled={selected.size === 0 || bulkLink.isPending}
            className="font-semibold"
          >
            {bulkLink.isPending && (
              <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
            )}
            Attach{selected.size > 0 ? ` ${selected.size}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
