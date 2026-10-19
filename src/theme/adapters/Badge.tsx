"use client";

import * as React from "react";
// Relative path on purpose: the "@components/Badge" alias points back here.
import UpstreamBadge, { type BadgeVariants } from "../../components/Badge";

/**
 * Badge adapter, swapped in for src/components/Badge.tsx by the exact
 * `@components/Badge` and `@/components/Badge` aliases (same pattern as
 * adapters/Button.tsx). Renders the upstream badge unchanged and adds the
 * attributes css/tag.css styles against:
 *
 *   data-nb-tag    the AntD tag role the upstream variant maps to
 *   data-nb-size   default / xs (upstream's sizes)
 *   data-nb-hover  present when the badge reacts to hover (useHover)
 *
 * The role map is typed against upstream's variant union, so a variant
 * added, renamed or removed upstream fails `tsc` here until it is mapped
 * (Badge.contract.ts spells the expected unions out).
 * @replaces-file src/components/Badge.tsx sha256:814ca16844fc14dd
 */
export type BadgeProps = React.ComponentProps<typeof UpstreamBadge>;
export type { BadgeVariants };

/** AntD tag roles of the light theme; css/tag.css has the colours. */
export type TagRole =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "purple";

export type TagSize = "default" | "xs";

type UpstreamVariant = NonNullable<BadgeVariants["variant"]>;
type UpstreamSize = NonNullable<BadgeVariants["size"]>;

export const TAG_ROLE: Record<UpstreamVariant, TagRole> = {
  // Upstream's default: sky blue = informational (counts, "new", kinds).
  blue: "info",
  blueDark: "info",
  "blue-darker": "info",
  // The brand colour is the primary blue in the AntD theme.
  netbird: "info",
  green: "success",
  yellow: "warning",
  red: "error",
  purple: "purple",
  // Four neutral greys upstream; one neutral tag here.
  gray: "default",
  lightGray: "default",
  grayer: "default",
  "gray-ghost": "default",
};

export const TAG_SIZE: Record<UpstreamSize, TagSize> = {
  default: "default",
  xs: "xs",
};

export default function Badge(props: BadgeProps) {
  const { variant, size, useHover } = props;
  return (
    <UpstreamBadge
      {...props}
      data-nb-tag={TAG_ROLE[variant ?? "blue"]}
      data-nb-size={TAG_SIZE[size ?? "default"]}
      data-nb-hover={useHover ? "" : undefined}
    />
  );
}
