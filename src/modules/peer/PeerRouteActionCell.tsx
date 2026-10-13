import Button from "@components/Button";
import { notify } from "@components/Notification";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/Tooltip";
import { useApiCall } from "@utils/api";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePeer } from "@/contexts/PeerProvider";
import { t } from "@/i18n";
import { Route } from "@/interfaces/Route";
type Props = {
  route: Route;
};
export default function PeerRouteActionCell({ route }: Props) {
  const { confirm } = useDialog();
  const routeRequest = useApiCall<Route>("/routes");
  const { mutate } = useSWRConfig();
  const { peer } = usePeer();
  const { groups } = useGroups();

  const peerGroup = useMemo(() => {
    if (!groups) return undefined;
    return groups.find((group) => {
      const id = route.peer_groups && route.peer_groups[0];
      return group.id === id;
    });
  }, [route, groups]);

  const handleRevoke = async () => {
    notify({
      title: t("peer.main:peerRouteActionCell.text.deleteRoute", {
        network_id: route.network_id,
      }),
      description: t(
        "peer.main:peerRouteActionCell.description.routeWasSuccessfullyRemoved",
      ),
      promise: routeRequest.del("", `/${route.id}`).then(() => {
        mutate("/routes");
      }),
      loadingMessage: t(
        "peer.main:peerRouteActionCell.loadingMessage.deletingTheRoute",
      ),
    });
  };

  const handleConfirm = async () => {
    const choice = await confirm({
      title: t("peer.main:peerRouteActionCell.title.deletePeerFromNetwork", {
        name: peer.name,
        network_id: route.network_id,
      }),
      description: t(
        "peer.main:peerRouteActionCell.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });
    if (!choice) return;
    handleRevoke().then();
  };

  return (
    <div className={"flex justify-end pr-4"}>
      <TooltipProvider delayDuration={0} disableHoverableContent={true}>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button
              variant={"danger-outline"}
              size={"sm"}
              onClick={handleConfirm}
              disabled={!!peerGroup}
            >
              <Trash2 size={16} />
              {t("common:word.delete")}
            </Button>
          </TooltipTrigger>
          {peerGroup && (
            <TooltipContent>
              <div className={"max-w-xs text-sm"}>
                <span className={"text-netbird"}>{peer.name}</span>{" "}
                {t("peer.main:peerRouteActionCell.text.isAPartOfA")}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
