"use client";

import * as React from "react";
// Relative path on purpose: the "@components/Input" alias points back here.
import {
  Input as UpstreamInput,
  type InputProps,
} from "../../components/Input";

/**
 * Input adapter, swapped in for src/components/Input.tsx by the exact
 * `@components/Input` and `@/components/Input` aliases (same pattern as
 * adapters/Button.tsx). Renders the upstream input unchanged and adds
 *
 *   data-nb-input="default" | "error"
 *
 * to the <input> (upstream spreads its props there); css/input.css styles
 * the input, and its wrapper and prefix box through :has(). `darker` is a
 * dark-theme nuance of the default look and maps to "default".
 * @replaces-file src/components/Input.tsx sha256:2529ed6844891b1b
 */
export type { InputProps };

export type InputRole = "default" | "error";

export const inputRole = (
  props: Pick<InputProps, "error" | "variant">,
): InputRole =>
  props.error || props.variant === "error" ? "error" : "default";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    return (
      <UpstreamInput {...props} ref={ref} data-nb-input={inputRole(props)} />
    );
  },
);
Input.displayName = "Input";

export { Input };
