import FullTooltip from "@components/FullTooltip";
import { ServerIcon, UserCog } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import {
  ReverseProxyCluster,
  ReverseProxyClusterType,
} from "@/interfaces/ReverseProxy";
type Props = {
  cluster: ReverseProxyCluster;
};

// ClusterTypeIndicator renders a small icon next to the cluster name —
// same pattern as EphemeralPeerIndicator — so the source of the
// cluster is visible at a glance without a dedicated column.
export const ClusterTypeIndicator = ({ cluster }: Props) => {
  // TODO(NET-1722): label a NetBird-managed gateway "Managed by NetBird"; it
  // is an account cluster but not self-hosted.
  if (cluster.type === ReverseProxyClusterType.ACCOUNT) {
    return (
      <FullTooltip
        content={
          <div className={"text-xs max-w-xs"}>
            <span className={"font-medium text-white"}>{t("reverse-proxy.clusters.cluster-cloud-deploy:clusterTypeIndicator.text.accountCluster")}</span>{" "}
            {t("reverse-proxy.clusters.cluster-cloud-deploy:clusterTypeIndicator.text.selfHostedOnYourOwn")}
          </div>
        }
      >
        <UserCog size={12} className={"shrink-0 text-netbird"} />
      </FullTooltip>
    );
  }
  return (
    <FullTooltip
      content={
        <div className={"text-xs max-w-xs"}>
          <span className={"font-medium text-white"}>{t("reverse-proxy.clusters.cluster-cloud-deploy:clusterTypeIndicator.text.sharedCluster")}</span>{" "}
          {t("reverse-proxy.clusters.cluster-cloud-deploy:clusterTypeIndicator.text.deployedAtTheServerLevel")}
        </div>
      }
    >
      <ServerIcon size={12} className={"shrink-0 text-nb-gray-300"} />
    </FullTooltip>
  );
};
