"use client";

import { Icon, addCollection, type IconProps } from "@iconify/react";
import solarSubset from "@/lib/icons/solar-subset.json";

/**
 * App icon. Renders Iconify icons from a committed offline Solar subset
 * (`scripts/build-icons.mjs` → `npm run gen:icons`) — no runtime calls to the
 * Iconify CDN (ADR-0009). Use Solar names, e.g. `<AppIcon icon="solar:box-bold" />`.
 */
addCollection(solarSubset as unknown as Parameters<typeof addCollection>[0]);

export type AppIconProps = IconProps;

export function AppIcon(props: AppIconProps) {
  return <Icon {...props} />;
}
