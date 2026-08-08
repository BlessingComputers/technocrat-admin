"use client";

import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

import { PartTypesPanel } from "./part-types-panel";

/**
 * Part Types management page (route `/catalogues/parts/types`). Lives under Parts
 * — not the products taxonomy (Brands & Categories) — so classifying parts is
 * reached from the All Parts page, next to Pricing and Bulk Upload.
 */
export function PartTypesView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Part Types"
        description="Classify parts by type — Charger, Keyboard, Battery, and more."
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues/parts">
            <AppIcon icon="solar:arrow-left-linear" className="mr-2 size-4" />
            Back to parts
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-4xl">
        <PartTypesPanel />
      </div>
    </div>
  );
}
