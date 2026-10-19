/**
 * tsc fails here when the upstream Breadcrumbs (root or Item) props and the
 * adapter's drift apart.
 */
import type UpstreamBreadcrumbs from "../../components/Breadcrumbs";
import type Breadcrumbs from "./Breadcrumbs";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export const breadcrumbsPropsMatchUpstream: Same<
  Parameters<typeof UpstreamBreadcrumbs>[0],
  Parameters<typeof Breadcrumbs>[0]
> = true;

export const breadcrumbItemPropsMatchUpstream: Same<
  Parameters<typeof UpstreamBreadcrumbs.Item>[0],
  Parameters<typeof Breadcrumbs.Item>[0]
> = true;
