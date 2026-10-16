import Button from "@components/Button";
import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import {
  ReverseProxyCluster,
  ReverseProxyClusterType,
} from "@/interfaces/ReverseProxy";
type Props = {
  cluster: ReverseProxyCluster;
};

export default function ClustersActionCell({ cluster }: Readonly<Props>) {
  const { confirm } = useDialog();
  const request = useApiCall<ReverseProxyCluster>("/reverse-proxies/clusters");
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();

  // Shared clusters are operated by NetBird; only account-owned (BYOP)
  // clusters can be deleted from this page. Rendering nothing for
  // shared rows keeps the cell column-aligned without an inert button.
  // TODO(NET-1722): a NetBird-managed gateway is listed as an account cluster
  // too; deleting it here would take the account's gateway down.
  if (cluster.type !== ReverseProxyClusterType.ACCOUNT) {
    return <div className={"pr-4"} />;
  }

  const handleDelete = async () => {
    const choice = await confirm({
      title: t(
        "reverse-proxy.clusters.cluster-cloud-deploy:clustersActionCell.title.delete",
        { address: cluster.address },
      ),
      description: t(
        "reverse-proxy.clusters.cluster-cloud-deploy:clustersActionCell.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return;

    notify({
      title: cluster.address,
      description: t(
        "reverse-proxy.clusters.cluster-cloud-deploy:clustersActionCell.description.proxyClusterWasSuccessfullyDeleted",
      ),
      promise: request
        .del({}, `/${encodeURIComponent(cluster.address)}`)
        .then(() => {
          mutate("/reverse-proxies/clusters");
        }),
      loadingMessage: t(
        "reverse-proxy.clusters.cluster-cloud-deploy:clustersActionCell.loadingMessage.deletingTheProxyCluster",
      ),
    });
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <Button
        variant={"danger-outline"}
        size={"sm"}
        onClick={handleDelete}
        disabled={!permission?.services?.delete}
      >
        <Trash2 size={16} />
        {t("common:word.delete")}
      </Button>
    </div>
  );
}
