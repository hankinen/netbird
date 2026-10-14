import { notify } from "@components/Notification";
import useFetchApi, { useApiCall } from "@utils/api";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { t } from "@/i18n";
import { Network } from "@/interfaces/Network";
import { useDraftChangeset } from "@/modules/control-center/draft/DraftChangesetContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { useDraftGroupActions } from "@/modules/control-center/hooks/useDraftGroupActions";
// Deletes an EXISTING network by its canvas node id. Resolves true only once the
// network is really gone, so callers can navigate out of its view.
export function useDeleteNetwork() {
  const reactFlow = useReactFlow();
  const { isDraft } = useDraftMode();
  const { confirm } = useDialog();
  const { mutate } = useSWRConfig();
  const { trackDeleteNetwork } = useDraftChangeset();
  const { removeNodeWithEdges } = useDraftGroupActions();
  const deleteCall = useApiCall("/networks").del;
  const { data: networks } = useFetchApi<Network[]>("/networks");

  return useCallback(
    async (nodeId: string): Promise<boolean> => {
      const target = reactFlow.getNodes().find((n) => n.id === nodeId);
      const network =
        (target?.data as { network?: Network })?.network ??
        networks?.find((n) => `network-${n.id}` === nodeId);
      if (!network?.id) return false;

      if (isDraft) {
        const choice = await confirm({
          title: t(
            "control-center.hooks:useDeleteNetwork.title.deleteNetwork",
            { name: network.name },
          ),
          description: t(
            "control-center.hooks:useDeleteNetwork.description.itsResourcesAndRoutingPeers",
          ),
          confirmText: t("common:word.delete"),
          cancelText: t("common:word.cancel"),
          type: "danger",
          dismissOnOutsideClick: true,
        });
        if (!choice) return false;
        trackDeleteNetwork({ networkId: network.id, name: network.name });
        removeNodeWithEdges(nodeId);
        return true;
      }

      const choice = await confirm({
        title: t("control-center.hooks:useDeleteNetwork.title.deleteNetwork2", {
          name: network.name,
        }),
        description: t(
          "control-center.hooks:useDeleteNetwork.description.areYouSureYouWant",
        ),
        confirmText: t("common:word.delete"),
        cancelText: t("common:word.cancel"),
        type: "danger",
      });
      if (!choice) return false;
      // Remove the frame only AFTER the DELETE succeeds: there is no rollback.
      const promise = deleteCall({}, `/${network.id}`).then(() => {
        removeNodeWithEdges(nodeId);
        mutate("/networks");
        mutate("/groups");
      });
      notify({
        title: network.name,
        description: t(
          "control-center.hooks:useDeleteNetwork.description.networkDeletedSuccessfully",
        ),
        loadingMessage: t(
          "control-center.hooks:useDeleteNetwork.loadingMessage.deletingNetwork",
        ),
        promise,
      });
      try {
        await promise;
        return true;
      } catch {
        // notify() already surfaced the error.
        return false;
      }
    },
    [
      reactFlow,
      networks,
      isDraft,
      confirm,
      mutate,
      trackDeleteNetwork,
      removeNodeWithEdges,
      deleteCall,
    ],
  );
}
