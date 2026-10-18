"use client";

import * as React from "react";
// Relative path on purpose: the "@components/Textarea" alias points back here.
import {
  type InputProps as TextareaProps,
  Textarea as UpstreamTextarea,
} from "../../components/Textarea";

/**
 * Textarea adapter, swapped in for src/components/Textarea.tsx by the exact
 * `@components/Textarea` and `@/components/Textarea` aliases. Renders the
 * upstream textarea unchanged and adds
 *
 *   data-nb-textarea="default" | "error"
 *
 * to the <textarea> (upstream spreads its props there); css/input.css has
 * the rules. `darker` maps to "default" as in adapters/Input.tsx.
 * @replaces-file src/components/Textarea.tsx sha256:276d99dabf65265e
 */
export type { TextareaProps as InputProps };

export type TextareaRole = "default" | "error";

export const textareaRole = (
  props: Pick<TextareaProps, "error" | "variant">,
): TextareaRole =>
  props.error || props.variant === "error" ? "error" : "default";

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    return (
      <UpstreamTextarea
        {...props}
        ref={ref}
        data-nb-textarea={textareaRole(props)}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
