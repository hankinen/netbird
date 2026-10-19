"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useActionsSlot } from "@/theme/shell/pageHeader";
// Relative path on purpose: the "@components/table/DataTable" alias points
// back here.
import { DataTable as UpstreamDataTable } from "../../components/table/DataTable";

/**
 * DataTable adapter, swapped in for src/components/table/DataTable.tsx by
 * the exact `@components/table/DataTable` and `@/components/table/DataTable`
 * aliases. Same export and props; the upstream table renders unchanged.
 *
 * What it adds: the table's right-hand toolbar actions (`rightSide`: Add
 * Peer, Add Policy, Create Group ...) move to the page header's actions row
 * on desktops and tablets and to the bottom bar on phones (architecture
 * section 6.1, decision 3) through a React portal into the host the store
 * knows for the current layout mode. Context, state and the modals those
 * buttons open all keep working, because a portal only moves the DOM.
 *
 * They stay in place when there is nowhere better: outside the shell, on a
 * page that has not declared a header (detail pages until P3), inside a
 * dialog (tables in modals and pickers), and for every table after the
 * first one on a page (the first to mount holds the slot).
 * @replaces-file src/components/table/DataTable.tsx sha256:165443f5ab0d1d41
 */
export type DataTableProps<TData, TValue> = Parameters<
  typeof UpstreamDataTable<TData, TValue>
>[0];

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { rightSide } = props;
  const anchor = React.useRef<HTMLSpanElement>(null);
  // null until the first layout effect: not known yet.
  const [inDialog, setInDialog] = React.useState<boolean | null>(null);
  React.useLayoutEffect(() => {
    setInDialog(!!anchor.current?.closest('[role="dialog"]'));
  }, []);
  const slot = useActionsSlot(!!rightSide && inDialog === false);

  let placed = rightSide;
  if (rightSide && (slot.pending || inDialog === null)) {
    placed = () => null;
  } else if (rightSide && slot.host) {
    const host = slot.host;
    placed = (table) => createPortal(<>{rightSide(table)}</>, host);
  }

  return (
    <>
      <UpstreamDataTable {...props} rightSide={placed} />
      <span ref={anchor} hidden data-nb-table-anchor={""} />
    </>
  );
}
