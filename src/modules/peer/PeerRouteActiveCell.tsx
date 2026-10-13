import { ToggleSwitch } from "@components/ToggleSwitch";
import GroupBadge from "@components/ui/GroupBadge";
import React, { useMemo } from "react";
import { useSWRConfig } from "swr";
import { useGroups } from "@/contexts/GroupsProvider";
import { useRoutes } from "@/contexts/RoutesProvider";
import { t } from "@/i18n";
import { Route } from "@/interfaces/Route";
type Props = {
  route: Route;
};
export default function PeerRouteActiveCell({ route }: Props) {
  const { updateRoute } = useRoutes();
  const { mutate } = useSWRConfig();
  const { groups } = useGroups();

  const peerGroup = useMemo(() => {
    if (!groups) return undefined;
    return groups.find((group) => {
      const id = route.peer_groups && route.peer_groups[0];
      return group.id === id;
    });
  }, [route, groups]);

  const update = async (enabled: boolean) => {
    updateRoute(
      route,
      { enabled },
      () => {
        mutate("/routes");
      },
      enabled
        ? t("peer.main:peerRouteActiveCell.text.theNetworkRouteWasSuccessfully")
        : t(
            "peer.main:peerRouteActiveCell.text.theNetworkRouteWasSuccessfully2",
          ),
    );
  };

  const isChecked = useMemo(() => {
    return route.enabled;
  }, [route]);

  return (
    <div className={"flex items-center"}>
      {!peerGroup ? (
        <ToggleSwitch
          checked={isChecked}
          size={"small"}
          onClick={() => update(!isChecked)}
        />
      ) : (
        <GroupBadge group={peerGroup} />
      )}
    </div>
  );
}
