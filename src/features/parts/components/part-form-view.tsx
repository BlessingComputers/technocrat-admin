"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { usePart } from "../api/parts.queries";
import { PartForm, type PartProductContext } from "./form/part-form";
import { PartFormSkeleton } from "./parts-skeletons";

interface PartFormViewProps {
  /** Omit for create mode; pass the part id (UUID or PRT-…) to edit. */
  partId?: string;
  /** Create mode only — scopes the new part to a product (pre-fills ownerSku, links on save). */
  productContext?: PartProductContext;
}

/** Create/edit route entry. Create is scoped to a product via `productContext`. */
export function PartFormView({ partId, productContext }: PartFormViewProps) {
  if (!partId) return <PartForm productContext={productContext} />;
  return <EditPartForm partId={partId} />;
}

function EditPartForm({ partId }: { partId: string }) {
  const { data: part, isLoading, isError } = usePart(partId);

  if (isLoading) return <PartFormSkeleton />;
  if (isError || !part) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </div>
        <div className="space-y-1 text-center">
          <h3 className="text-xl font-semibold text-foreground">Part not found</h3>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            We couldn&apos;t load this part to edit. It may have been removed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/catalogues/parts">
            <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
            Back to Parts
          </Link>
        </Button>
      </div>
    );
  }

  return <PartForm initialData={part} />;
}

