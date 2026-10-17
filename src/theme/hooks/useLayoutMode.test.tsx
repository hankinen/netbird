import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MEDIA } from "@/theme/tokens/breakpoints";
import { LayoutModeSync, useIsPhone, useLayoutMode } from "./useLayoutMode";

type Listener = () => void;

/** A matchMedia stub whose matching queries can be changed at runtime. */
function installMatchMedia(initial: string[]) {
  let matching = new Set(initial);
  const listeners = new Map<string, Set<Listener>>();
  window.matchMedia = ((query: string) =>
    ({
      get matches() {
        return matching.has(query);
      },
      media: query,
      addEventListener: (_: string, fn: Listener) => {
        if (!listeners.has(query)) listeners.set(query, new Set());
        listeners.get(query)!.add(fn);
      },
      removeEventListener: (_: string, fn: Listener) => {
        listeners.get(query)?.delete(fn);
      },
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return (next: string[]) => {
    matching = new Set(next);
    for (const set of listeners.values()) for (const fn of set) fn();
  };
}

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
  delete document.documentElement.dataset.layoutMode;
});

describe("useLayoutMode", () => {
  it("reads phone / compact / full from matchMedia", () => {
    const set = installMatchMedia([MEDIA.phone]);
    const { result } = renderHook(() => useLayoutMode());
    expect(result.current).toBe("phone");
    act(() => set([]));
    expect(result.current).toBe("compact");
    act(() => set([MEDIA.full]));
    expect(result.current).toBe("full");
  });

  it("falls back to the viewport width without matchMedia", () => {
    // @ts-expect-error jsdom has no matchMedia; simulate an environment without it
    window.matchMedia = undefined;
    const { result } = renderHook(() => useLayoutMode());
    // jsdom's default innerWidth is 1024
    expect(result.current).toBe("compact");
  });

  it("useIsPhone is the phone mode", () => {
    installMatchMedia([MEDIA.phone]);
    expect(renderHook(() => useIsPhone()).result.current).toBe(true);
  });
});

describe("LayoutModeSync", () => {
  it("mirrors the mode onto <html data-layout-mode>", () => {
    const set = installMatchMedia([MEDIA.full]);
    render(<LayoutModeSync />);
    expect(document.documentElement.dataset.layoutMode).toBe("full");
    act(() => set([MEDIA.phone]));
    expect(document.documentElement.dataset.layoutMode).toBe("phone");
  });
});
