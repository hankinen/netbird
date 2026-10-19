"use client";

import { cn } from "@utils/helpers";
import type { LucideIcon } from "lucide-react";
import * as React from "react";

/**
 * Segmented control of the canvas chrome (view switch, Live / Draft): a
 * tablist of buttons, arrow keys move between them, `data-state="active"`
 * marks the current one for graph.css.
 */
export type GraphSegmentedItem<V extends string> = {
  value: V;
  label: React.ReactNode;
  icon?: LucideIcon;
  /** Rendered after the label (a Beta tag, a chevron). */
  trailing?: React.ReactNode;
  disabled?: boolean;
  testId?: string;
};

export function GraphSegmented<V extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  className,
}: {
  value?: V;
  onChange?: (value: V) => void;
  items: GraphSegmentedItem<V>[];
  ariaLabel?: string;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    for (let i = 1; i <= items.length; i++) {
      const next = (index + step * i + items.length) % items.length;
      if (!items[next].disabled) {
        refs.current[next]?.focus();
        return;
      }
    }
  };
  return (
    <div
      role={"tablist"}
      aria-label={ariaLabel}
      className={cn("nb-graph-segment", className)}
    >
      {items.map((item, i) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type={"button"}
            role={"tab"}
            aria-selected={active}
            tabIndex={active || (value === undefined && i === 0) ? 0 : -1}
            disabled={item.disabled}
            data-state={active ? "active" : "inactive"}
            data-testid={item.testId}
            className={"nb-graph-segment__item"}
            onClick={() => onChange?.(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {item.label}
            {item.trailing}
          </button>
        );
      })}
    </div>
  );
}
