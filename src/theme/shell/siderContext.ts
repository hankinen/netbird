import * as React from "react";

/**
 * Whether the navigation host the item sits in is collapsed to icons. Set by
 * the Sider; false in the phone drawer, in collapsed-group popovers and
 * wherever an item renders outside a host (stories, tests).
 */
export const SiderContext = React.createContext<{ collapsed: boolean }>({
  collapsed: false,
});

export const useSiderCollapsed = () => React.useContext(SiderContext).collapsed;
