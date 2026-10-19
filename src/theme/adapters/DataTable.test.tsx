import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PageHeaderProvider,
  PageHeaderStore,
  usePageHeader,
} from "@/theme/shell/pageHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/test",
}));

const { DataTable } = await import("./DataTable");

type Row = { id: string; name: string };
const rows: Row[] = [{ id: "a", name: "First" }];
const columns: ColumnDef<Row>[] = [
  { id: "name", accessorKey: "name", header: "Name" },
];

afterEach(cleanup);

/** Stands in for PageHeaderBar: the element the actions move into. */
function Host({ store }: { store: PageHeaderStore }) {
  return <div data-testid={"host"} ref={(el) => store.setHost("header", el)} />;
}

/** A page that declared its header, like the migrated list pages. */
function Page({ children }: { children: React.ReactNode }) {
  usePageHeader({ title: "Peers" });
  return <>{children}</>;
}

const table = (testId = "add") => (
  <DataTable
    columns={columns}
    data={rows}
    rightSide={() => <button data-testid={testId}>Add</button>}
  />
);

describe("DataTable adapter", () => {
  it("moves rightSide into the page header's actions host", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Host store={store} />
        <Page>{table()}</Page>
      </PageHeaderProvider>,
    );
    expect(getByTestId("host").contains(getByTestId("add"))).toBe(true);
    expect(store.actionsOwner).not.toBeNull();
  });

  it("renders in place while no page header is registered", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Host store={store} />
        {table()}
      </PageHeaderProvider>,
    );
    expect(getByTestId("host").contains(getByTestId("add"))).toBe(false);
    expect(getByTestId("add").closest(".table-fixed-scroll")).not.toBeNull();
  });

  it("renders in place outside the shell", () => {
    const { getByTestId } = render(table());
    expect(getByTestId("add").closest(".table-fixed-scroll")).not.toBeNull();
  });

  it("leaves a table inside a dialog alone", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Host store={store} />
        <Page>
          <div role={"dialog"}>{table()}</div>
        </Page>
      </PageHeaderProvider>,
    );
    expect(getByTestId("add").closest('[role="dialog"]')).not.toBeNull();
    expect(getByTestId("host").childElementCount).toBe(0);
    expect(store.actionsOwner).toBeNull();
  });

  it("gives the slot to the first table only", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Host store={store} />
        <Page>
          {table("first")}
          {table("second")}
        </Page>
      </PageHeaderProvider>,
    );
    const host = getByTestId("host");
    expect(host.contains(getByTestId("first"))).toBe(true);
    expect(host.contains(getByTestId("second"))).toBe(false);
    expect(getByTestId("second").closest(".table-fixed-scroll")).not.toBeNull();
  });

  it("releases the slot when the table unmounts", () => {
    const store = new PageHeaderStore();
    const { unmount } = render(
      <PageHeaderProvider store={store}>
        <Host store={store} />
        <Page>{table()}</Page>
      </PageHeaderProvider>,
    );
    expect(store.actionsOwner).not.toBeNull();
    unmount();
    expect(store.actionsOwner).toBeNull();
  });
});
