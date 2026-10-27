"use client";

import { Icon, addCollection, type IconProps } from "@iconify/react";
import solarSubset from "@/lib/icons/solar-subset.json";
import brandSubset from "@/lib/icons/brand-subset.json";

/**
 * App icon. Renders Iconify icons from committed offline subsets
 * (`scripts/build-icons.mjs` → `npm run gen:icons`) — no runtime calls to the
 * Iconify CDN (ADR-0009). Two collections:
 *
 * - `solar:*` — the house icon set, e.g. `<AppIcon icon="solar:box-bold" />`.
 * - `brand:*` — third-party marks Solar doesn't ship, where using anything but
 *   the real logo would misidentify the product, e.g. `brand:whatsapp`.
 */
addCollection(solarSubset as unknown as Parameters<typeof addCollection>[0]);
addCollection(brandSubset as unknown as Parameters<typeof addCollection>[0]);

export type AppIconProps = IconProps;

export function AppIcon(props: AppIconProps) {
  return <Icon {...props} />;
}
