import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import {
  preorderCustomerName,
  preorderInitials,
} from "../../utils/preorder-utils";
import type { Preorder } from "../../types/preorders";

interface PreorderContactCardProps {
  preorder: Preorder;
}

/**
 * Who to call, and the reference to quote when calling them.
 *
 * This is the card the job actually starts from — a pre-order is worked by
 * picking up the phone — so the phone number is the largest thing on it, and
 * both it and the email are real `tel:`/`mailto:` links rather than text to
 * be copied out by hand.
 *
 * Inverted panel: `bg-foreground` flips with the theme, so it is near-black in
 * light mode and near-white in dark. No hue role survives that — text here uses
 * the background family only, and the accent survives as a tint fill, never as
 * text. Do not "restore" `-ink` here (see the customer profile card).
 */
export function PreorderContactCard({ preorder }: PreorderContactCardProps) {
  return (
    <Card className="p-8 bg-foreground text-background">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/20 text-background flex items-center justify-center text-lg font-semibold shrink-0">
          {preorderInitials(preorder)}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold truncate">
            {preorderCustomerName(preorder)}
          </p>
          <p className="text-xs font-mono text-background/90 font-semibold truncate">
            {preorder.preorderId}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <MetaLabel className="text-background/60">Phone</MetaLabel>
          <a
            href={`tel:${preorder.phoneNumber}`}
            className="mt-1 flex items-center gap-3 text-base font-semibold tracking-tight hover:underline"
          >
            <AppIcon icon="solar:phone-linear" className="w-4 h-4 shrink-0" />
            <span className="truncate">{preorder.phoneNumber}</span>
          </a>
        </div>

        <div>
          <MetaLabel className="text-background/60">Email</MetaLabel>
          <a
            href={`mailto:${preorder.email}`}
            className="mt-1 flex items-center gap-3 text-xs text-background/70 hover:underline"
          >
            <AppIcon icon="solar:letter-linear" className="w-4 h-4 shrink-0" />
            <span className="truncate">{preorder.email}</span>
          </a>
        </div>
      </div>
    </Card>
  );
}
