/**
 * tsc fails here when the upstream SidebarItem props and the adapter's props
 * drift apart (either direction), the same way the pagination contract works.
 */
import type UpstreamSidebarItem from "../../components/SidebarItem";
import type SidebarItem from "./SidebarItem";

type UpstreamProps = Parameters<typeof UpstreamSidebarItem>[0];
type AdapterProps = Parameters<typeof SidebarItem>[0];

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const sidebarItemPropsMatchUpstream: Same<UpstreamProps, AdapterProps> =
  true;
