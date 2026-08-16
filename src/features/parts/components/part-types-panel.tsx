"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePartTypes, useCreatePartType } from "../api/parts.queries";
import { PartTypesGridSkeleton } from "./parts-skeletons";
import { MetaLabel } from "@/components/shared/meta-label";

/**
 * Part Types management (rendered by {@link PartTypesView} at
 * `/catalogues/parts/types`). The backend exposes only list + create today, so
 * this creates and lists; rename/remove arrive when the PATCH/DELETE endpoints
 * land (backend ask #2).
 */
export function PartTypesPanel() {
  const { data: types = [], isLoading } = usePartTypes();
  const createType = useCreatePartType();
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Part type name is too short");
      return;
    }
    const promise = createType.mutateAsync({ name: trimmed });
    toast.promise(promise, {
      loading: "Adding part type…",
      success: `Part type “${trimmed}” added`,
      error: (err) => getErrorMessage(err, "Failed to add part type"),
    });
    promise.then(() => setName("")).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <MetaLabel className="block mb-2">
          Add a part type
        </MetaLabel>
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="e.g. Charger, Keyboard, Screen, Battery"
            className="h-10 flex-1"
          />
          <Button
            onClick={handleAdd}
            disabled={createType.isPending || name.trim().length < 2}
            className="h-10 rounded-lg font-semibold"
          >
            {createType.isPending ? (
              <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
            ) : (
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
            )}
            Add
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {types.length} part type{types.length === 1 ? "" : "s"}
        </p>
      </div>

      {isLoading ? (
        <PartTypesGridSkeleton />
      ) : types.length === 0 ? (
        <Card className="gap-0 border-dashed py-16 text-center">
          <AppIcon
            icon="solar:widget-5-linear"
            className="mx-auto mb-3 size-12 text-muted-foreground/30"
          />
          <h3 className="font-semibold text-foreground">No part types yet</h3>
          <p className="text-sm text-muted-foreground">
            Add types like Charger, Keyboard, or Battery to classify parts.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((t) => (
            <Card
              key={t.id}
              className="flex items-center gap-3 p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-ink">
                <AppIcon icon="solar:widget-5-linear" className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {t.slug}
                </p>
              </div>
              {!t.isActive && (
                <Badge variant="muted" className="shrink-0 text-xs">
                  Inactive
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs italic text-muted-foreground">
        Renaming and removing part types will be available once the backend
        supports it.
      </p>
    </div>
  );
}
