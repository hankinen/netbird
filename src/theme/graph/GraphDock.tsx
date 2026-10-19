"use client";

import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import * as React from "react";

/**
 * The floating tool strip at the bottom of the canvas (draft tools, the
 * selection toolbar). The props mirror upstream's toolbar/* primitives so
 * the control-center adapters are one-line wrappers.
 */
export function GraphDock({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("nb-graph-dock", className)}>{children}</div>;
}

export function GraphDockGroup({
  children,
  compact,
  position,
  className,
}: React.PropsWithChildren<{
  compact?: boolean;
  position?: "first" | "middle" | "last";
  className?: string;
}>) {
  return (
    <div
      className={cn("nb-graph-dock__group", className)}
      data-compact={compact ? "" : undefined}
      data-position={position}
    >
      {children}
    </div>
  );
}

export function GraphDockDivider({ className }: { className?: string }) {
  return <div className={cn("nb-graph-dock__divider", className)} />;
}

export type GraphDockButtonProps = {
  children: React.ReactNode;
  tooltip?: string;
  shortcut?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "primary";
  onClick?: () => void;
  "data-testid"?: string;
  "aria-label"?: string;
};

export function GraphDockButton({
  children,
  tooltip,
  shortcut,
  active,
  disabled,
  className,
  variant = "default",
  onClick,
  "data-testid": dataTestId,
  "aria-label": ariaLabel,
}: GraphDockButtonProps) {
  const button = (
    <button
      type={"button"}
      onClick={onClick}
      disabled={disabled}
      data-testid={dataTestId}
      data-variant={variant === "primary" ? "primary" : undefined}
      aria-pressed={active}
      aria-label={ariaLabel ?? tooltip}
      className={cn("nb-graph-dock__button", className)}
    >
      {children}
    </button>
  );
  if (!tooltip && !shortcut) return button;
  return (
    <FullTooltip
      content={
        <span className={"flex items-center text-xs"}>
          {tooltip}
          {shortcut && <kbd className={"nb-graph-kbd"}>{shortcut}</kbd>}
        </span>
      }
      side={"top"}
      sideOffset={10}
      interactive={false}
      contentClassName={"!px-2 !py-1.5"}
      variant={"lighter"}
    >
      {button}
    </FullTooltip>
  );
}
