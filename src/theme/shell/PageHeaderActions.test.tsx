import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  PageHeaderProvider,
  PageHeaderStore,
  useActionsSlot,
  usePageHeader,
} from "./pageHeader";
import { PageHeaderActions, PageHeaderTitle } from "./PageHeaderActions";

afterEach(cleanup);

/** Stands in for PageHeaderBar: the title element and the actions row. */
function Hosts({ store }: { store: PageHeaderStore }) {
  return (
    <>
      <h1 data-testid={"title"} ref={(el) => store.setHost("title", el)} />
      <div data-testid={"actions"} ref={(el) => store.setHost("header", el)} />
    </>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  usePageHeader({ title: "router-berlin", titleText: "router-berlin" });
  return <>{children}</>;
}

/** A table's weak claim, as adapters/DataTable.tsx makes it. */
function TableActions({ children }: { children: React.ReactNode }) {
  const slot = useActionsSlot(true);
  if (slot.pending) return null;
  return slot.host ? (
    <span data-testid={"table-in-host"}>{children}</span>
  ) : (
    <span data-testid={"table-in-place"}>{children}</span>
  );
}

describe("PageHeaderActions", () => {
  it("renders the page's buttons into the actions host", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Hosts store={store} />
        <Page>
          <PageHeaderActions>
            <button data-testid={"save"}>Save</button>
          </PageHeaderActions>
        </Page>
      </PageHeaderProvider>,
    );
    expect(getByTestId("actions").contains(getByTestId("save"))).toBe(true);
    expect(store.actionsOwnerStrong).toBe(true);
  });

  it("takes the slot over from a table, which then renders in place", () => {
    const store = new PageHeaderStore();
    const { getByTestId, queryByTestId } = render(
      <PageHeaderProvider store={store}>
        <Hosts store={store} />
        <Page>
          <TableActions>
            <button>Add</button>
          </TableActions>
          <PageHeaderActions>
            <button data-testid={"save"}>Save</button>
          </PageHeaderActions>
        </Page>
      </PageHeaderProvider>,
    );
    expect(getByTestId("actions").contains(getByTestId("save"))).toBe(true);
    expect(queryByTestId("table-in-place")).not.toBeNull();
    expect(queryByTestId("table-in-host")).toBeNull();
  });

  it("renders in place without a header or a store", () => {
    const store = new PageHeaderStore();
    const a = render(
      <PageHeaderProvider store={store}>
        <Hosts store={store} />
        <PageHeaderActions>
          <button data-testid={"save"}>Save</button>
        </PageHeaderActions>
      </PageHeaderProvider>,
    );
    expect(a.getByTestId("actions").childElementCount).toBe(0);
    expect(a.getByTestId("save")).toBeTruthy();
    cleanup();
    const b = render(
      <PageHeaderActions>
        <button data-testid={"save"}>Save</button>
      </PageHeaderActions>,
    );
    expect(b.getByTestId("save")).toBeTruthy();
  });
});

describe("PageHeaderTitle", () => {
  it("renders the rich title into the bar's title element and marks it hosted", () => {
    const store = new PageHeaderStore();
    const { getByTestId } = render(
      <PageHeaderProvider store={store}>
        <Hosts store={store} />
        <Page>
          <PageHeaderTitle>
            <span data-testid={"rich"}>● router-berlin ✎</span>
          </PageHeaderTitle>
        </Page>
      </PageHeaderProvider>,
    );
    expect(getByTestId("title").contains(getByTestId("rich"))).toBe(true);
    expect(store.titleOwner).not.toBeNull();
  });

  it("releases the title when it unmounts", () => {
    const store = new PageHeaderStore();
    const { unmount } = render(
      <PageHeaderProvider store={store}>
        <Hosts store={store} />
        <Page>
          <PageHeaderTitle>
            <span>rich</span>
          </PageHeaderTitle>
        </Page>
      </PageHeaderProvider>,
    );
    unmount();
    expect(store.titleOwner).toBeNull();
  });
});

describe("PageHeaderStore claims", () => {
  it("weak claims wait, strong claims take over, releases free the slot", () => {
    const store = new PageHeaderStore();
    const table = Symbol("table");
    const page = Symbol("page");
    expect(store.claimActions(table)).toBe(true);
    expect(store.claimActions(Symbol("other table"))).toBe(false);
    expect(store.claimActions(page, true)).toBe(true);
    expect(store.actionsOwner).toBe(page);
    expect(store.claimActions(table)).toBe(false);
    expect(store.claimActions(Symbol("other page"), true)).toBe(false);
    store.releaseActions(table);
    expect(store.actionsOwner).toBe(page);
    store.releaseActions(page);
    expect(store.actionsOwner).toBeNull();
    expect(store.actionsOwnerStrong).toBe(false);
  });
});
