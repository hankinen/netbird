/**
 * Breakpoints of the layout-mode contract
 * (docs/plans/2026-10-17-enterprise-ui-architecture.md, section 5.1).
 *
 * Single source of truth. The media queries in src/theme/css/*.css must use
 * exactly these widths (breakpoints.test.ts checks every (min|max)-width in
 * the theme), and JavaScript reads the current mode through
 * useLayoutMode() in src/theme/hooks/useLayoutMode.tsx.
 *
 *   phone     width <  768   AppBar + drawer, cards, full-screen sheets, 40px controls
 *   compact   768 <= w < 1280  collapsed sider, tables scroll inside their box
 *   full      width >= 1280  full sider, desktop layout
 *
 * Why 768 and 1280: they are the two widths the upstream dashboard already
 * switches on (`md:` for the hamburger menu, `xl:` for hidden table columns),
 * so the mode boundaries never disagree with upstream's own responsive classes.
 */
export const BREAKPOINTS = {
  /** First width that is no longer a phone. */
  compact: 768,
  /** First width that is a full desktop. */
  full: 1280,
} as const;

export type LayoutMode = "phone" | "compact" | "full";

export const LAYOUT_MODES: readonly LayoutMode[] = ["phone", "compact", "full"];

/** The .02 epsilon on max-width is Tailwind's convention, kept so the CSS and
 *  the JS agree at fractional widths (zoomed pages). */
const below = (px: number) => `(max-width: ${px - 0.02}px)`;
const from = (px: number) => `(min-width: ${px}px)`;

export const MEDIA = {
  phone: below(BREAKPOINTS.compact),
  compact: `${from(BREAKPOINTS.compact)} and ${below(BREAKPOINTS.full)}`,
  full: from(BREAKPOINTS.full),
  /** Phones and tablets together: everything that is not `full`. */
  belowFull: below(BREAKPOINTS.full),
  /** Touch screens of any width. */
  touch: "(pointer: coarse)",
} as const;

/** The mode a viewport of the given CSS width is in. */
export function layoutModeFor(width: number): LayoutMode {
  if (width < BREAKPOINTS.compact) return "phone";
  if (width < BREAKPOINTS.full) return "compact";
  return "full";
}
