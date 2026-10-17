"use client";

/**
 * Card-view helper for src/components/table/Table.tsx (dev branch).
 *
 * Swapped in by one exact tsconfig `paths` entry
 *   "@components/table/Table": [this file]
 * (same mechanism as DataTablePagination.tsx). Every other export of the
 * upstream file is re-exported untouched; only `Table` is wrapped.
 *
 * What it does: renders the upstream <Table> unchanged and, after each render
 * or DOM change, writes presentation-only attributes on the cells:
 *   <table data-nb-cards>                     marks a table the card CSS may re-lay out
 *   <td data-label="Name">                    header text of the cell's column
 *   <table data-nb-route="/peers">           current route (per-table hiding config key)
 *   <td data-nb-col="3">                      1-based column index (per-table hiding config)
 *   <td|th data-nb-cell="lead|title|field|trail|full">
 *        lead  = unlabeled cells before the first labeled one (row checkbox)
 *        title = first labeled cell (card title, no label shown)
 *        field = other cells ("label: value" lines)
 *        trail = last unlabeled cell after the title (row actions ⋮)
 *        full  = a cell spanning all columns (expanded row, "no results")
 * It never touches data, events, sorting or selection: the same React tree
 * is rendered; only attributes change. The card layout itself is pure CSS
 * (responsive.css, phones only, AntD light theme only). Without that CSS the
 * attributes have no visual effect, so the dark / upstream-light themes stay
 * pixel-identical. See README.md "手机端适配".
 *
 * Contract with upstream: tsc checks Table's props via Table.contract.ts.
 */
import { usePathname } from "next/navigation";
import * as React from "react";
// Non-aliased path to the upstream file (the alias would point back here).
import { Table as UpstreamTable } from "@/components/table/Table";

export * from "@/components/table/Table";

export type TableProps = React.ComponentPropsWithoutRef<typeof UpstreamTable>;

function setAttr(el: Element, name: string, value: string | null) {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/** Writes data-label / data-nb-col / data-nb-cell on every cell. Idempotent. */
export function labelTableCells(table: HTMLTableElement) {
  const head = table.tHead?.rows[0];
  const labels = head
    ? Array.from(head.cells).map((th) => (th.textContent ?? "").trim())
    : [];
  setAttr(table, "data-nb-cards", head ? "" : null);
  if (head)
    Array.from(head.cells).forEach((th, i) =>
      setAttr(
        th,
        "data-nb-cell",
        labels[i]
          ? "field"
          : th.querySelector('[role="checkbox"]')
            ? "lead"
            : "blank",
      ),
    );
  for (const body of Array.from(table.tBodies))
    for (const row of Array.from(body.rows)) {
      const cells = Array.from(row.cells);
      if (cells.length === 1 && cells[0].colSpan > 1) {
        setAttr(cells[0], "data-nb-cell", "full");
        setAttr(cells[0], "data-label", null);
        continue;
      }
      const firstLabeled = cells.findIndex((_, i) => !!labels[i]);
      let lastUnlabeled = -1;
      cells.forEach((_, i) => {
        if (!labels[i] && i > firstLabeled) lastUnlabeled = i;
      });
      cells.forEach((td, i) => {
        const label = labels[i] || null;
        let role: string;
        if (i === firstLabeled) role = "title";
        else if (!label && (firstLabeled < 0 || i < firstLabeled)) role = "lead";
        else if (i === lastUnlabeled) role = "trail";
        else role = "field";
        setAttr(td, "data-label", label);
        setAttr(td, "data-nb-col", String(i + 1));
        setAttr(td, "data-nb-cell", role);
      });
    }
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (props, ref) => {
    const pathname = usePathname();
    const inner = React.useRef<HTMLTableElement | null>(null);
    const setRef = React.useCallback(
      (el: HTMLTableElement | null) => {
        inner.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref],
    );
    React.useLayoutEffect(() => {
      const table = inner.current;
      if (!table) return;
      let frame = 0;
      const run = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => labelTableCells(table));
      };
      labelTableCells(table);
      // Rows and header text change without re-rendering this component
      // (pagination, filters, language switch); attributes are not observed,
      // so writing them cannot loop.
      const observer = new MutationObserver(run);
      observer.observe(table, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      return () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      };
    }, []);
    return (
      <UpstreamTable ref={setRef} data-nb-route={pathname ?? undefined} {...props} />
    );
  },
);
Table.displayName = "Table";
