import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  PageHeaderProvider,
  PageHeaderStore,
  usePageHeader,
} from "@/theme/shell/pageHeader";
import Breadcrumbs from "./Breadcrumbs";

afterEach(cleanup);

const trail = (
  <Breadcrumbs>
    <Breadcrumbs.Item href={"/team"} label={"Team"} />
    {false && <Breadcrumbs.Item href={"/nope"} label={"Hidden"} />}
    <Breadcrumbs.Item href={"/team/users"} label={"Users"} active />
  </Breadcrumbs>
);

describe("Breadcrumbs adapter", () => {
  it("inside the shell registers the trail and renders nothing", () => {
    const store = new PageHeaderStore();
    const { container, unmount } = render(
      <PageHeaderProvider store={store}>{trail}</PageHeaderProvider>,
    );
    expect(container.innerHTML).toBe("");
    expect(store.crumbs?.map((c) => [c.label, c.href])).toEqual([
      ["Team", "/team"],
      ["Users", "/team/users"],
    ]);
    unmount();
    expect(store.crumbs).toBeNull();
  });

  it("outside the shell renders upstream's breadcrumbs", () => {
    const { getAllByTestId, getByText } = render(trail);
    expect(getAllByTestId("breadcrumb-item")[0].textContent).toBe("Team");
    expect(getByText("Users")).toBeTruthy();
  });

  it("a page that declared a full header keeps its own trail", () => {
    const store = new PageHeaderStore();
    const Page = () => {
      usePageHeader({ title: "Peers", breadcrumb: [{ label: "Peers" }] });
      return trail;
    };
    render(
      <PageHeaderProvider store={store}>
        <Page />
      </PageHeaderProvider>,
    );
    expect(store.spec?.breadcrumb?.[0].label).toBe("Peers");
    expect(store.crumbs?.length).toBe(2);
  });
});
