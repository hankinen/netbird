/* Compile-time contract: adapters/Badge.tsx maps exactly these upstream
   variants and sizes to the theme's tag roles. When upstream adds, renames
   or removes one, tsc fails here and in the adapter's maps; map the new
   variant (css/tag.css if it needs a new role), update these unions and the
   @replaces-file hash in the adapter. */
import type { BadgeVariants } from "../../components/Badge";

type ExpectedVariant =
  | "blue"
  | "blueDark"
  | "blue-darker"
  | "red"
  | "purple"
  | "yellow"
  | "gray"
  | "lightGray"
  | "grayer"
  | "gray-ghost"
  | "green"
  | "netbird";

type ExpectedSize = "default" | "xs";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;

export const upstreamBadgeVariantsUnchanged: Equals<
  NonNullable<BadgeVariants["variant"]>,
  ExpectedVariant
> = true;

export const upstreamBadgeSizesUnchanged: Equals<
  NonNullable<BadgeVariants["size"]>,
  ExpectedSize
> = true;
