"use client";

import * as React from "react";
// Relative path on purpose: the "@components/Button" alias points back here.
import UpstreamButton, {
  type ButtonProps,
  type ButtonVariants,
  buttonVariants,
} from "../../components/Button";

/**
 * Button adapter, swapped in for src/components/Button.tsx by the exact
 * `@components/Button` and `@/components/Button` aliases in tsconfig.json
 * (Turbopack, Storybook, vitest and tsc all resolve an exact alias before the
 * wildcard). Same default export, props, `buttonVariants` and types.
 *
 * It renders the upstream button unchanged, so the dark theme and the builds
 * without the AntD theme stay pixel-identical, and adds three attributes the
 * light theme styles against instead of upstream's utility classes:
 *
 *   data-nb-btn      the AntD role the upstream variant maps to
 *   data-nb-size     sm / md / lg  (upstream xs, xs2 / sm, md / lg)
 *   data-nb-grouped  present on ButtonGroup.Button (upstream passes border={2})
 *
 * css/button.css holds the rules. The two maps below are typed against
 * upstream's variant and size unions, so a variant added, renamed or removed
 * upstream fails `tsc` here until it is mapped (Button.contract.ts spells the
 * expected unions out).
 * @replaces-file src/components/Button.tsx sha256:0fe17781dc07c9dd
 */
export type { ButtonProps, ButtonVariants };
export { buttonVariants };

/** AntD roles of the light theme; see css/button.css for what each looks like. */
export type ButtonRole =
  | "primary"
  | "default"
  | "active"
  | "text"
  | "danger"
  | "danger-outline"
  | "danger-text";

export type ButtonSize = "sm" | "md" | "lg";

type UpstreamVariant = NonNullable<ButtonProps["variant"]>;
type UpstreamSize = NonNullable<ButtonProps["size"]>;

export const BUTTON_ROLE: Record<UpstreamVariant, ButtonRole> = {
  primary: "primary",
  default: "default",
  secondary: "default",
  secondaryLighter: "default",
  input: "default",
  dropdown: "default",
  dotted: "default",
  white: "default",
  outline: "default",
  // Upstream uses the inverted "tertiary" look for the selected state of
  // toggle groups (Peers: User Devices | Servers, Bypassed).
  tertiary: "active",
  "default-outline": "text",
  danger: "danger",
  "danger-outline": "danger-outline",
  "danger-text": "danger-text",
};

export const BUTTON_SIZE: Record<UpstreamSize, ButtonSize> = {
  xs: "sm",
  xs2: "sm",
  sm: "md",
  md: "md",
  lg: "lg",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { variant, size, border } = props;
    return (
      <UpstreamButton
        {...props}
        ref={ref}
        data-nb-btn={BUTTON_ROLE[variant ?? "default"]}
        data-nb-size={BUTTON_SIZE[size ?? "md"]}
        data-nb-grouped={border === 2 ? "" : undefined}
      />
    );
  },
);
Button.displayName = "Button";

export default Button;
