/* Compile-time contract: adapters/Textarea.tsx reads `error` and `variant`
   from exactly these upstream props. When upstream changes them, tsc fails
   here; review the adapter and css/input.css, then update this file and the
   @replaces-file hash. */
import type { InputProps as TextareaProps } from "../../components/Textarea";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;

export const upstreamTextareaVariantsUnchanged: Equals<
  NonNullable<TextareaProps["variant"]>,
  "default" | "darker" | "error"
> = true;

export const upstreamTextareaErrorUnchanged: Equals<
  TextareaProps["error"],
  string | undefined
> = true;
