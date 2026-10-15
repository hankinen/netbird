import { DataTablePagination as Aliased } from "@components/table/DataTablePagination";
import type { ColumnDef } from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { DataTablePagination } from "./DataTablePagination";

type Row = { id: number };
const columns: ColumnDef<Row>[] = [{ accessorKey: "id" }];
const rows = (n: number) => Array.from({ length: n }, (_, id) => ({ id }));

// DataTable augments TanStack's FilterFns/SortingFns, making both required.
const filterFns = {
  fuzzy: () => true,
  dateRange: () => true,
  exactMatch: () => true,
  arrIncludesSomeExact: () => true,
};
const sortingFns = { checkbox: () => 0, datetime: () => 0 };

let state = { pageIndex: 0, pageSize: 10 };
function Harness({
  n,
  manual,
  totalRecords,
}: {
  n: number;
  manual?: boolean;
  totalRecords?: number;
}) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  state = pagination;
  const table = useReactTable({
    data: rows(n),
    columns,
    filterFns,
    sortingFns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: manual,
    pageCount:
      manual && totalRecords ? Math.ceil(totalRecords / 10) : undefined,
    state: { pagination },
    onPaginationChange: setPagination,
  });
  return <DataTablePagination table={table} totalRecords={totalRecords} />;
}

const setHtml = (cls: string) => {
  document.documentElement.className = cls;
};

afterEach(() => {
  cleanup();
  setHtml("");
});

describe("theme-antd DataTablePagination", () => {
  it("is what @components/table/DataTablePagination resolves to", () => {
    expect(Aliased).toBe(DataTablePagination);
  });

  it("renders the upstream pagination outside the AntD light theme", () => {
    setHtml("dark theme-antd");
    const { container } = render(<Harness n={47} />);
    expect(container.querySelector(".rc-pagination")).toBeNull();
    expect(container.textContent).toContain("1 of 5");
  });

  it("renders AntD pagination with total, pages and jumper in AntD light", () => {
    setHtml("light theme-antd");
    const { container } = render(<Harness n={47} />);
    expect(container.querySelector(".rc-pagination")).not.toBeNull();
    expect(container.textContent).toContain("Total 47 items");
    expect(container.querySelectorAll(".rc-pagination-item")).toHaveLength(5);
    expect(
      container.querySelector(".rc-pagination-options-quick-jumper input"),
    ).not.toBeNull();
  });

  it("switches live when the theme class changes", async () => {
    setHtml("light theme-antd");
    const { container } = render(<Harness n={47} />);
    await act(async () => {
      setHtml("dark theme-antd");
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.querySelector(".rc-pagination")).toBeNull();
  });

  it("pages, jumps and resizes through the table", () => {
    setHtml("light theme-antd");
    const { container } = render(<Harness n={470} />);
    fireEvent.click(container.querySelector(".rc-pagination-item-3")!);
    expect(state.pageIndex).toBe(2);
    fireEvent.click(container.querySelector(".rc-pagination-next")!);
    expect(state.pageIndex).toBe(3);
    const input = container.querySelector<HTMLInputElement>(
      ".rc-pagination-options-quick-jumper input",
    )!;
    fireEvent.change(input, { target: { value: "40" } });
    fireEvent.keyUp(input, { key: "Enter", keyCode: 13 });
    expect(state.pageIndex).toBe(39);
  });

  it("shows a single page too (size changer stays reachable)", () => {
    setHtml("light theme-antd");
    const { container } = render(<Harness n={4} />);
    expect(container.textContent).toContain("Total 4 items");
  });

  it("renders nothing for empty tables and for manual pagination without totalRecords", () => {
    setHtml("light theme-antd");
    const empty = render(<Harness n={0} />);
    expect(empty.container.querySelector(".rc-pagination")).toBeNull();
    empty.unmount();
    const embedded = render(<Harness n={12} manual />);
    expect(embedded.container.innerHTML).toBe("");
  });

  it("uses totalRecords for server-side pagination", () => {
    setHtml("light theme-antd");
    const { container } = render(<Harness n={10} manual totalRecords={1234} />);
    expect(container.textContent).toContain("Total 1234 items");
    fireEvent.click(container.querySelector(".rc-pagination-next")!);
    expect(state.pageIndex).toBe(1);
  });
});
