/* Compile-time contract: adapters/Button.tsx maps exactly these upstream
   variants and sizes to the theme's roles. When upstream adds, renames or
   removes one, tsc fails here and in the adapter's role maps; map the new
   variant (css/button.css if it needs a new role), update these unions and
   the @replaces-file hash in the adapter. */
import type { ButtonProps } from "../../components/Button";

type ExpectedVariant =
  | "default"
  | "primary"
  | "secondary"
  | "secondaryLighter"
  | "input"
  | "dropdown"
  | "dotted"
  | "tertiary"
  | "white"
  | "outline"
  | "default-outline"
  | "danger-outline"
  | "danger-text"
  | "danger";

type ExpectedSize = "xs" | "xs2" | "sm" | "md" | "lg";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;

export const upstreamButtonVariantsUnchanged: Equals<
  NonNullable<ButtonProps["variant"]>,
  ExpectedVariant
> = true;

export const upstreamButtonSizesUnchanged: Equals<
  NonNullable<ButtonProps["size"]>,
  ExpectedSize
> = true;
