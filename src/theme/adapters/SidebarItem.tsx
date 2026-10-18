"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@utils/helpers";
import { useGuardedRouter } from "@utils/navigation-guard";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { useApplicationContext } from "@/contexts/ApplicationProvider";
import { SiderContext, useSiderCollapsed } from "@/theme/shell/siderContext";
// The upstream props type, through a relative path: the alias below would
// point back at this file.
import type { SidebarItemProps } from "../../components/SidebarItem";

/**
 * Navigation item of the shell, replacing src/components/SidebarItem.tsx
 * through the `@/components/SidebarItem` and `@components/SidebarItem`
 * aliases. Same props, same routing rules (guarded router, exact match,
 * collapsible groups that open when a child route is active, the drawer
 * closing after a click); the upstream SidebarItem.test runs against it.
 * @replaces-file src/components/SidebarItem.tsx sha256:9972faa5af5fb240
 *
 * Visuals come from shell.css (nb-nav-item*): dark-menu colours inside the
 * sider and the drawer, light-menu colours anywhere else. While the host is
 * collapsed an item shows its icon only (label as the title), and a
 * collapsible group opens its children in a popover to the right.
 */
export type { SidebarItemProps };

const textOf = (node: React.ReactNode): string | undefined =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : undefined;

export default function SidebarItem({
  icon,
  children,
  label,
  collapsible = false,
  className,
  isChild = false,
  href = "",
  exactPathMatch = false,
  target = "_self",
  labelClassName,
  visible,
}: Readonly<SidebarItemProps>) {
  const path = usePathname();
  const collapsed = useSiderCollapsed();

  const childRoutes = useMemo(() => {
    const routes: { href: string; exact: boolean }[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const props = child.props as Partial<SidebarItemProps>;
      if (props.href)
        routes.push({ href: props.href, exact: !!props.exactPathMatch });
    });
    return routes;
  }, [children]);

  const hasActiveChild = useMemo(() => {
    if (!collapsible) return false;
    if (href && (path === href || path.startsWith(href + "/"))) return true;
    return childRoutes.some(({ href: childHref, exact }) =>
      exact
        ? path === childHref
        : path === childHref || path.startsWith(childHref + "/"),
    );
  }, [collapsible, href, path, childRoutes]);

  const [open, setOpen] = React.useState(hasActiveChild);
  useEffect(() => {
    if (hasActiveChild && !open) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveChild]);

  const router = useGuardedRouter();
  const { mobileNavOpen, toggleMobileNav } = useApplicationContext();

  const handleClick = () => {
    const preventRedirect = href
      ? exactPathMatch
        ? path == href
        : path.includes(href)
      : false;
    if (collapsible && href) return;
    if (collapsible && mobileNavOpen) return;
    if (collapsible && open) return;
    if (preventRedirect) return;
    if (target == "_blank") return window.open(href, "_blank");
    if (mobileNavOpen) toggleMobileNav();
    router.push(href);
  };

  const isActive = useMemo(() => {
    if (collapsible) return false;
    return href ? (exactPathMatch ? path == href : path.includes(href)) : false;
  }, [path, href, exactPathMatch, collapsible]);

  if (!visible) return null;

  const button = (
    <button
      type={"button"}
      className={cn("nb-nav-item__button", className)}
      onClick={handleClick}
      data-testid={"left-navigation-item"}
      title={collapsed ? textOf(label) : undefined}
      aria-expanded={collapsible ? open : undefined}
    >
      <span className={"peer/icon"} data-active={isActive} />
      {icon && <span className={"nb-nav-item__icon"}>{icon}</span>}
      <span className={cn("nb-nav-item__label", labelClassName)}>{label}</span>
      {collapsible && (
        <span className={"nb-nav-item__chevron"}>
          {open ? (
            <ChevronDownIcon size={16} />
          ) : (
            <ChevronRightIcon size={16} />
          )}
        </span>
      )}
    </button>
  );

  const itemProps = {
    className: "nb-nav-item",
    "data-nav-item": href || undefined,
    "data-active": isActive || hasActiveChild || undefined,
    "data-child": isChild || undefined,
    "data-collapsible": collapsible || undefined,
    "data-open": (collapsible && open) || undefined,
  } as const;

  if (!collapsible) return <li {...itemProps}>{button}</li>;

  // Collapsed host: the group's children open in a popover to the right,
  // rendered as a normal (expanded) list.
  if (collapsed) {
    return (
      <li {...itemProps}>
        <Popover.Root>
          <Popover.Trigger asChild>{button}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side={"right"}
              align={"start"}
              sideOffset={8}
              className={"nb-nav-popover"}
            >
              <SiderContext.Provider value={{ collapsed: false }}>
                <div className={"nb-nav-popover__title"}>{label}</div>
                <ul className={"nb-nav-item__children"}>{children}</ul>
              </SiderContext.Provider>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </li>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <li {...itemProps}>
        <Collapsible.Trigger asChild>{button}</Collapsible.Trigger>
        <Collapsible.Content asChild>
          <ul className={"nb-nav-item__children"}>{children}</ul>
        </Collapsible.Content>
      </li>
    </Collapsible.Root>
  );
}
