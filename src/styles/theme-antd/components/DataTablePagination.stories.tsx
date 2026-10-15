import { DataTable } from "@components/table/DataTable";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useState } from "react";
import { userEvent } from "storybook/test";
import { settle } from "@/storybook/wait";

/* The AntD pagination (components/DataTablePagination.tsx) renders only in the
   AntD light theme; in dark these stories show the upstream pagination. */

type Row = { id: string; name: string; ip: string };
const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i + 1),
    name: `peer-${String(i + 1).padStart(4, "0")}`,
    ip: `100.92.${Math.floor(i / 250)}.${(i % 250) + 1}`,
  }));

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "ip", header: "Address" },
];

function ClientTable({
  total,
  pageSize = 10,
}: {
  total: number;
  pageSize?: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  return (
    <DataTable
      text={"Peers"}
      columns={columns}
      data={makeRows(total)}
      sorting={sorting}
      setSorting={setSorting}
      keepStateInLocalStorage={false}
      initialPageSize={pageSize}
      showSearchAndFilters={false}
    />
  );
}

/* Server-side pagination as ServerPaginationProvider wires it: the page is
   controlled from outside, data is one page, pageCount + totalRecords given. */
function ServerTable({ total }: { total: number }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const all = makeRows(total);
  const start = pagination.pageIndex * pagination.pageSize;
  return (
    <DataTable
      text={"Events"}
      columns={columns}
      data={all.slice(start, start + pagination.pageSize)}
      sorting={sorting}
      setSorting={setSorting}
      keepStateInLocalStorage={false}
      showSearchAndFilters={false}
      manualPagination={true}
      pagination={pagination}
      onPaginationChange={setPagination}
      pageCount={Math.ceil(total / pagination.pageSize)}
      totalRecords={total}
    />
  );
}

/* Embedded tables (RouteTable, DNSRecordsTable, ReverseProxyTargetsTable)
   pass manualPagination without totalRecords to switch pagination off. */
function EmbeddedTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  return (
    <DataTable
      text={"Records"}
      columns={columns}
      data={makeRows(12)}
      sorting={sorting}
      setSorting={setSorting}
      keepStateInLocalStorage={false}
      showSearchAndFilters={false}
      initialPageSize={12}
      manualPagination={true}
    />
  );
}

const meta: Meta = {
  title: "Theme AntD/DataTablePagination",
  parameters: { nextjs: { navigation: { pathname: "/peers" } } },
};
export default meta;

const pagination = (el: HTMLElement) =>
  el.querySelector<HTMLElement>(".rc-pagination");

export const MultiPage: StoryObj = {
  render: () => <ClientTable total={47} />,
};

export const SinglePage: StoryObj = {
  render: () => <ClientTable total={4} />,
};

export const ManyPagesEllipsis: StoryObj = {
  render: () => <ClientTable total={500} />,
  play: async ({ canvasElement }) => {
    // page 25 of 50: ellipsis on both sides
    const input = pagination(canvasElement)?.querySelector("input");
    if (input) {
      await userEvent.type(input, "25");
      // rc-pagination jumps on Enter (keyCode) or blur; user-event's Enter
      // carries no keyCode, so blur.
      input.blur();
    }
    await settle();
  },
};

export const QuickJump: StoryObj = {
  render: () => <ClientTable total={500} />,
  play: async ({ canvasElement }) => {
    const input = pagination(canvasElement)?.querySelector("input");
    if (input) await userEvent.type(input, "7");
    await settle();
  },
};

export const PageSizeOpen: StoryObj = {
  render: () => <ClientTable total={47} />,
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector<HTMLElement>(
      "[data-testid=antd-page-size] button",
    );
    if (trigger) await userEvent.click(trigger);
    await settle(600);
  },
};

export const ServerPagination: StoryObj = {
  render: () => <ServerTable total={1234} />,
  play: async ({ canvasElement }) => {
    // first interaction after mount: DataTable swallows the first
    // onPaginationChange in manual mode (isInitialRender); see README.
    const page3 = pagination(canvasElement)?.querySelector<HTMLElement>(
      ".rc-pagination-item-3",
    );
    if (page3) await userEvent.click(page3);
    await settle();
  },
};

export const EmbeddedNoPagination: StoryObj = {
  render: () => <EmbeddedTable />,
};
