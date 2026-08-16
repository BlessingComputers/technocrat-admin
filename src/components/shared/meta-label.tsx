import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils/cn";

/**
 * The **Label** role from DESIGN.md's type front-matter, as one primitive:
 * 12px / 500 / 0.01em / 1.2, sentence case.
 *
 * It replaces ~40 hand-rolled spellings of the same device
 * (`text-[9px]`/`[10px]`/`[11px]` × `font-black`/`font-bold` × `uppercase
 * tracking-widest`/`tracking-wider`). Both DESIGN.mds ban tracked-caps eyebrows;
 * the single sanctioned exception is the sidebar's section headers (`MAIN`,
 * `ADMIN`), which live in `components/layouts/sidebar` and do NOT use this.
 *
 * Named `MetaLabel`, not `FieldLabel`: `components/ui/field.tsx` already exports
 * a `FieldLabel` (the shadcn form control label, tied to `htmlFor`). This is the
 * standalone caption device — a key in a key/value row, a column head, a section
 * kicker — not a form control's label.
 */
const metaLabelVariants = cva("text-xs font-medium leading-[1.2] tracking-[0.01em]", {
  variants: {
    /**
     * `tone` exists for pinned surfaces. Per the -ink rule, text on a solid
     * branded/inverted panel does NOT flip with the theme, so those sites cannot
     * use `text-muted-foreground` — they need the surface's own foreground.
     */
    tone: {
      /** Default: a caption on card or canvas. Flips with the theme. */
      muted: "text-muted-foreground",
      /** Same device, but load-bearing enough to sit at full contrast. */
      strong: "text-foreground",
      /** On `bg-primary` — dialog headers, promo panels. Pinned. */
      pinned: "text-primary-foreground/70",
      /** On `bg-foreground text-background` — the inverted profile card. Pinned. */
      inverted: "text-background/70",
    },
  },
  defaultVariants: { tone: "muted" },
});

export interface MetaLabelProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof metaLabelVariants> {
  /** Render as the child element instead of a `<span>` — for `<th>`, `<label>`, etc. */
  asChild?: boolean;
}

export function MetaLabel({
  className,
  tone,
  asChild = false,
  ...props
}: MetaLabelProps) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      data-slot="meta-label"
      className={cn(metaLabelVariants({ tone }), className)}
      {...props}
    />
  );
}

/**
 * The same classes without the element, for sites that cannot be a `<MetaLabel>`:
 * `<TableHead>`/`<th>` cells that carry their own padding, `<Button>` labels, and
 * `cn()` blocks with conditional tone.
 */
export { metaLabelVariants };
