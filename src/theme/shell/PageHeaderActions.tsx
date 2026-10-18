"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useActionsSlot, useTitleSlot } from "./pageHeader";

/**
 * A page's own action buttons (Save / Cancel, a ⋮ menu), written where the
 * page has them so they keep the page's context and state, rendered in the
 * page header's actions row on desktops and tablets and in the bottom bar on
 * phones. Takes the slot over from a table's actions (strong claim); renders
 * in place outside the shell or while no header is registered.
 */
export function PageHeaderActions({ children }: { children: React.ReactNode }) {
  const slot = useActionsSlot(true, true);
  if (slot.pending) return null;
  return slot.host ? createPortal(<>{children}</>, slot.host) : <>{children}</>;
}

/**
 * A rich title (status dot, name with a rename button, badges) rendered
 * into the page header bar's title element with the page's context intact.
 * Pair it with usePageHeader({ title, titleText }): the top bar on phones and
 * assistive tech use the text, the bar shows this node instead of `title`.
 */
export function PageHeaderTitle({ children }: { children: React.ReactNode }) {
  const slot = useTitleSlot();
  if (slot.pending) return null;
  return slot.host ? createPortal(<>{children}</>, slot.host) : <>{children}</>;
}
