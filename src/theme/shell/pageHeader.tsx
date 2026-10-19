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
 *
 * The store also holds the two "action hosts": the actions row of the page
 * header bar and the bottom bar. The DataTable adapter renders a table's
 * right-hand actions (Add Peer, Add Policy ...) into the host of the current
 * layout mode through a portal (useActionsSlot), so the 35 tables upstream
 * keep their code and the primary action still moves to the header.
 */
import * as React from "react";
import { useIsPhone } from "@/theme/hooks/useLayoutMode";

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
  /** Title row content. Rich titles (status dot, rename button) that need
   *  the page's context go through <PageHeaderTitle> instead; this then
   *  serves as the fallback. */
  title: React.ReactNode;
  /** Plain text for the phone top bar and assistive tech when `title` is a
   *  node; defaults to `title` when that is a string. */
  titleText?: string;
  /** Muted text after the title (an owner, a description); hidden on phones. */
  subtitle?: React.ReactNode;
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
    a.titleText === b.titleText &&
    a.subtitle === b.subtitle &&
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

const sameCrumb = (x: PageCrumb, y: PageCrumb) =>
  x.label === y.label && x.href === y.href && x.icon === y.icon;

export type ActionsHostKind = "title" | "header" | "bottom";

export class PageHeaderStore {
  spec: PageHeaderSpec | null = null;
  /** Breadcrumbs registered by the Breadcrumbs adapter of a page that has
   *  not (yet) declared a full header; the top bar shows them. */
  crumbs: PageCrumb[] | null = null;
  /** Where teleported content renders: the page header bar's title and its
   *  actions row (desktops, tablets) and the bottom bar (phones), set by
   *  those parts. */
  hosts: Record<ActionsHostKind, HTMLElement | null> = {
    title: null,
    header: null,
    bottom: null,
  };
  /** The one component whose actions fill the slot. A weak claim (a table)
   *  wins only while nobody holds it; a strong claim (the page's own
   *  <PageHeaderActions>) takes it over, and tables render in place. */
  actionsOwner: symbol | null = null;
  actionsOwnerStrong = false;
  /** The component rendering the rich title (<PageHeaderTitle>), if any. */
  titleOwner: symbol | null = null;
  version = 0;
  private listeners = new Set<Listener>();

  setHost(kind: ActionsHostKind, el: HTMLElement | null) {
    if (this.hosts[kind] === el) return;
    this.hosts[kind] = el;
    this.bump();
  }

  claimActions(token: symbol, strong = false): boolean {
    if (this.actionsOwner === token) return true;
    if (this.actionsOwner && (this.actionsOwnerStrong || !strong)) return false;
    this.actionsOwner = token;
    this.actionsOwnerStrong = strong;
    this.bump();
    return true;
  }

  releaseActions(token: symbol) {
    if (this.actionsOwner !== token) return;
    this.actionsOwner = null;
    this.actionsOwnerStrong = false;
    this.bump();
  }

  claimTitle(token: symbol): boolean {
    if (this.titleOwner === token) return true;
    if (this.titleOwner) return false;
    this.titleOwner = token;
    this.bump();
    return true;
  }

  releaseTitle(token: symbol) {
    if (this.titleOwner !== token) return;
    this.titleOwner = null;
    this.bump();
  }

  set(next: PageHeaderSpec | null) {
    const changed = !sameSpec(this.spec, next);
    this.spec = next;
    if (!changed) return;
    this.bump();
  }

  setCrumbs(next: PageCrumb[] | null) {
    const changed =
      !sameList(this.crumbs ?? undefined, next ?? undefined, sameCrumb) &&
      !(this.crumbs === null && next === null);
    this.crumbs = next;
    if (!changed) return;
    this.bump();
  }

  private bump() {
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

function useStoreVersion(store: PageHeaderStore | null) {
  React.useSyncExternalStore(
    store?.subscribe ?? noopSubscribe,
    store?.getVersion ?? zero,
    zero,
  );
}

/** The currently registered spec; re-renders the caller when it changes. */
export function usePageHeaderSpec(): PageHeaderSpec | null {
  const store = React.useContext(StoreContext);
  useStoreVersion(store);
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

/** The breadcrumb trail to show: the spec's, else the Breadcrumbs adapter's. */
export function usePageCrumbs(): PageCrumb[] | null {
  const store = React.useContext(StoreContext);
  useStoreVersion(store);
  return store?.spec?.breadcrumb ?? store?.crumbs ?? null;
}

/**
 * Used by the Breadcrumbs adapter: registers a trail for as long as the
 * component is mounted, without claiming the title row. Returns true when a
 * store exists (the adapter then renders nothing itself).
 */
export function useRegisterCrumbs(items: PageCrumb[]): boolean {
  const store = React.useContext(StoreContext);
  React.useLayoutEffect(() => {
    store?.setCrumbs(items);
  });
  React.useEffect(() => () => store?.setCrumbs(null), [store]);
  return store !== null;
}

export type ActionsSlot = {
  /** Render into this element; null = render in place. */
  host: HTMLElement | null;
  /** First render, claim not made yet: render nothing, so actions that are
   *  about to move never flash in place. */
  pending: boolean;
};

const NO_SLOT: ActionsSlot = { host: null, pending: false };
const PENDING: ActionsSlot = { host: null, pending: true };

/**
 * Used by the DataTable adapter (weak) and <PageHeaderActions> (strong).
 * Claims the page's actions slot for as long as the caller is mounted and
 * `enabled`; returns the host element for the current layout mode while a
 * page header is registered and the caller holds the slot. Without a store
 * or a header, or when another component holds the slot, `host` is null:
 * render in place.
 */
export function useActionsSlot(enabled: boolean, strong = false): ActionsSlot {
  const store = React.useContext(StoreContext);
  useStoreVersion(store);
  const phone = useIsPhone();
  const [token] = React.useState(() => Symbol("actions-slot"));
  const [claimed, setClaimed] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!store || !enabled) return;
    store.claimActions(token, strong);
    setClaimed(true);
    return () => {
      store.releaseActions(token);
      setClaimed(false);
    };
  }, [store, enabled, token, strong]);
  if (!store || !enabled || !store.spec) return NO_SLOT;
  if (!claimed) return PENDING;
  if (store.actionsOwner !== token) return NO_SLOT;
  return {
    host: phone ? store.hosts.bottom : store.hosts.header,
    pending: false,
  };
}

/**
 * Used by <PageHeaderTitle>: the page header bar's title element, while a
 * header is registered and the caller holds the title (first come). The
 * bar renders `spec.title` only while nobody holds it.
 */
export function useTitleSlot(): ActionsSlot {
  const store = React.useContext(StoreContext);
  useStoreVersion(store);
  const [token] = React.useState(() => Symbol("title-slot"));
  const [claimed, setClaimed] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!store) return;
    store.claimTitle(token);
    setClaimed(true);
    return () => {
      store.releaseTitle(token);
      setClaimed(false);
    };
  }, [store, token]);
  if (!store || !store.spec) return NO_SLOT;
  if (!claimed) return PENDING;
  if (store.titleOwner !== token) return NO_SLOT;
  return { host: store.hosts.title, pending: false };
}

/** True while a <PageHeaderTitle> renders the title (the bar then leaves
 *  `spec.title` out). */
export function useTitleHosted(): boolean {
  const store = React.useContext(StoreContext);
  useStoreVersion(store);
  return store?.titleOwner !== null && store?.titleOwner !== undefined;
}

const noopSubscribe = () => () => {};
const zero = () => 0;
const nothing = () => null;
