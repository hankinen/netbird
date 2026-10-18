import { act, render, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  PageHeaderProvider,
  PageHeaderStore,
  sameSpec,
  usePageHeader,
  usePageHeaderSpec,
} from "./pageHeader";

describe("sameSpec", () => {
  it("ignores handlers and compares what the user sees", () => {
    const a = {
      title: "Peers",
      count: 3,
      primaryAction: { label: "Add", onClick: () => 1 },
    };
    const b = {
      title: "Peers",
      count: 3,
      primaryAction: { label: "Add", onClick: () => 2 },
    };
    expect(sameSpec(a, b)).toBe(true);
    expect(sameSpec(a, { ...b, count: 4 })).toBe(false);
    expect(sameSpec(a, { ...b, primaryAction: { label: "Create" } })).toBe(
      false,
    );
    expect(sameSpec(null, b)).toBe(false);
  });
});

describe("PageHeaderStore", () => {
  it("notifies only on visible changes but always keeps the latest spec", () => {
    const store = new PageHeaderStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const first = () => 1;
    const second = () => 2;
    store.set({ title: "A", primaryAction: { label: "Go", onClick: first } });
    store.set({ title: "A", primaryAction: { label: "Go", onClick: second } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.spec?.primaryAction?.onClick).toBe(second);
    store.set({ title: "B" });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("usePageHeader / usePageHeaderSpec", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PageHeaderProvider>{children}</PageHeaderProvider>
  );

  it("registers while mounted and clears on unmount", () => {
    const store = new PageHeaderStore();
    const Page = ({ count }: { count: number }) => {
      usePageHeader({ title: "Peers", count });
      return null;
    };
    const Shell = () => {
      const spec = usePageHeaderSpec();
      return (
        <div data-testid={"out"}>
          {spec ? `${spec.title}:${spec.count}` : "none"}
        </div>
      );
    };
    const { getByTestId, rerender, unmount } = render(
      <PageHeaderProvider store={store}>
        <Shell />
        <Page count={1} />
      </PageHeaderProvider>,
    );
    expect(getByTestId("out").textContent).toBe("Peers:1");
    rerender(
      <PageHeaderProvider store={store}>
        <Shell />
        <Page count={2} />
      </PageHeaderProvider>,
    );
    expect(getByTestId("out").textContent).toBe("Peers:2");
    act(() => unmount());
    expect(store.spec).toBeNull();
  });

  it("is a no-op without a provider", () => {
    expect(() => renderHook(() => usePageHeader({ title: "x" }))).not.toThrow();
    expect(
      renderHook(() => usePageHeaderSpec(), { wrapper }).result.current,
    ).toBeNull();
  });
});
