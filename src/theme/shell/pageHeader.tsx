"use client";

/**
 * The page-header slot (UI architecture, section 5.2).
 *
 * A page declares what it is (title, count, breadcrumb, help, actions) with
 * usePageHeader(); the shell decides where each part renders: on desktops
 * the breadcrumb goes to the top bar and the title row with its actions to
 * the PageHeaderBar, on phones the title goes to the app bar and the primary
 * action to the bottom bar.
 *
 * The spec lives in a small external store, not in React state above the
 * page, so registering never re-renders the page itself (no update loops)
 * and only the shell parts that subscribe re-render. Listeners are notified
 * when a visible field changed; the latest spec object is always kept, and
 * actions are run through the store, so a handler is never stale.
 *
 * A page whose controls are more than buttons (the control-center mode
 * switch, which needs the page's own providers) renders them itself into the
 * bar's extra slot: `usePageHeaderSlot()` hands out the slot element once the
 * bar has mounted, and a React portal into it keeps the page's context.
 */
import * as React from "react";

export type PageAction = {
  key?: string;
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "default" | "danger";
  "data-testid"?: string;
};

export type PageCrumb = {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
};

export type PageHeaderSpec = {
  title: React.ReactNode;
  /** Item count shown next to the title (replaces "13 Peers" headings). */
  count?: number;
  breadcrumb?: PageCrumb[];
  /** One sentence of help, shown behind an info icon, never as a paragraph. */
  help?: React.ReactNode;
  primaryAction?: PageAction;
  secondaryActions?: PageAction[];
  /** Detail pages: where the back arrow goes. */
  backHref?: string;
};

type Listener = () => void;

const sameAction = (a?: PageAction, b?: PageAction) =>
  a === b ||
  (!!a &&
    !!b &&
    a.label === b.label &&
    a.href === b.href &&
    a.disabled === b.disabled &&
    a.variant === b.variant &&
    a.icon === b.icon);

const sameList = <T,>(
  a: T[] | undefined,
  b: T[] | undefined,
  same: (x: T, y: T) => boolean,
) =>
  a === b ||
  (!!a && !!b && a.length === b.length && a.every((x, i) => same(x, b[i])));

/** True when nothing a user could see differs between the two specs. */
export function sameSpec(
  a: PageHeaderSpec | null,
  b: PageHeaderSpec | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.title === b.title &&
    a.count === b.count &&
    a.help === b.help &&
    a.backHref === b.backHref &&
    sameList(
      a.breadcrumb,
      b.breadcrumb,
      (x, y) => x.label === y.label && x.href === y.href && x.icon === y.icon,
    ) &&
    sameAction(a.primaryAction, b.primaryAction) &&
    sameList(a.secondaryActions, b.secondaryActions, sameAction)
  );
}

export class PageHeaderStore {
  spec: PageHeaderSpec | null = null;
  version = 0;
  private listeners = new Set<Listener>();

  set(next: PageHeaderSpec | null) {
    const changed = !sameSpec(this.spec, next);
    this.spec = next;
    if (!changed) return;
    this.version++;
    for (const l of this.listeners) l();
  }

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };

  getVersion = () => this.version;

  /** The bar's extra slot, for pages that portal their own controls in. */
  slot: HTMLElement | null = null;
  private slotListeners = new Set<Listener>();

  setSlot = (el: HTMLElement | null) => {
    if (this.slot === el) return;
    this.slot = el;
    for (const l of this.slotListeners) l();
  };

  subscribeSlot = (l: Listener) => {
    this.slotListeners.add(l);
    return () => {
      this.slotListeners.delete(l);
    };
  };

  getSlot = () => this.slot;
}

const StoreContext = React.createContext<PageHeaderStore | null>(null);

export function PageHeaderProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  /** Tests and stories can pass their own store. */
  store?: PageHeaderStore;
}) {
  const [own] = React.useState(() => store ?? new PageHeaderStore());
  return (
    <StoreContext.Provider value={store ?? own}>
      {children}
    </StoreContext.Provider>
  );
}

export const usePageHeaderStore = () => React.useContext(StoreContext);

/**
 * Registers the page's header with the shell for as long as the component is
 * mounted. Pass `null` to register nothing. Strings and memoised nodes keep
 * the shell from re-rendering on every page render; handlers may change
 * freely, they are read when the action runs.
 */
export function usePageHeader(spec: PageHeaderSpec | null): void {
  const store = React.useContext(StoreContext);
  React.useLayoutEffect(() => {
    store?.set(spec);
  });
  React.useEffect(() => () => store?.set(null), [store]);
}

/** The currently registered spec; re-renders the caller when it changes. */
export function usePageHeaderSpec(): PageHeaderSpec | null {
  const store = React.useContext(StoreContext);
  React.useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getVersion ?? zero,
    zero,
  );
  return store?.spec ?? null;
}

/**
 * The page header bar's extra slot (null until the bar renders, and on
 * phones, where the bar is hidden). Render into it with createPortal.
 */
export function usePageHeaderSlot(): HTMLElement | null {
  const store = React.useContext(StoreContext);
  return React.useSyncExternalStore(
    store?.subscribeSlot ?? noopSubscribe,
    store?.getSlot ?? nothing,
    nothing,
  );
}

const noopSubscribe = () => () => {};
const zero = () => 0;
const nothing = () => null;
