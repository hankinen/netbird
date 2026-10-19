"use client";

import React from "react";
import { useRegisterCrumbs } from "@/theme/shell/pageHeader";
// Upstream, through a relative path: the aliases below point back here.
import UpstreamBreadcrumbs, {
  Item as UpstreamItem,
} from "../../components/Breadcrumbs";

/**
 * Breadcrumbs adapter, replacing src/components/Breadcrumbs.tsx through the
 * `@components/Breadcrumbs` and `@/components/Breadcrumbs` aliases.
 * @replaces-file src/components/Breadcrumbs.tsx sha256:52e087fe1103a17f
 *
 * Inside the shell the trail belongs to the top bar (architecture 5.2):
 * the adapter reads its `<Breadcrumbs.Item>` children, registers them with
 * the page-header store and renders nothing, so every page (migrated or
 * not, settings tabs included) shows its breadcrumb in the same place. A
 * page that declared a full header with usePageHeader() wins. Outside the
 * shell (stories, tests) it renders upstream's component unchanged.
 */
type ItemProps = React.ComponentProps<typeof UpstreamItem>;

function Breadcrumbs({ children }: { children: React.ReactNode }) {
  const items = React.useMemo(
    () =>
      React.Children.toArray(children)
        .filter(React.isValidElement)
        .map((el) => el.props as Partial<ItemProps>)
        .filter((p) => p.label !== undefined)
        .map((p) => ({ label: p.label as string, href: p.href, icon: p.icon })),
    [children],
  );
  const hosted = useRegisterCrumbs(items);
  if (hosted) return null;
  return <UpstreamBreadcrumbs>{children}</UpstreamBreadcrumbs>;
}

Breadcrumbs.Item = UpstreamItem;

export { UpstreamItem as Item };
export default Breadcrumbs;
