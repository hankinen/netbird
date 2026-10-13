import Badge from "@components/Badge";
import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { cn } from "@utils/helpers";
import { HelpCircle, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import { t } from "@/i18n";
import { GroupedRoute } from "@/interfaces/Route";
import { useAddRoutingPeer } from "@/modules/routes/RouteAddRoutingPeerProvider";
type Props = {
  groupedRoute: GroupedRoute;
};
export default function GroupedRouteHighAvailabilityCell({
  groupedRoute,
}: Props) {
  const router = useRouter();
  const isActive = useMemo(() => {
    return groupedRoute.high_availability_count > 1;
  }, [groupedRoute.high_availability_count]);

  const disabledText = useMemo(
    () => (
      <>
        {t(
          "route-group.main:groupedRouteHighAvailabilityCell.text.highAvailabilityIsCurrently",
        )}{" "}
        <span className={"text-red-500 font-medium"}>
          {t("route-group.main:groupedRouteHighAvailabilityCell.text.disabled")}
        </span>{" "}
        {t(
          "route-group.main:groupedRouteHighAvailabilityCell.text.forThisRoute",
        )}
      </>
    ),
    [],
  );

  const enabledText = useMemo(
    () => (
      <>
        {t("common:word.highAvailabilityIs")}{" "}
        <span className={"text-green-500 font-medium"}>
          {t("route-group.main:groupedRouteHighAvailabilityCell.text.enabled")}
        </span>{" "}
        {t(
          "route-group.main:groupedRouteHighAvailabilityCell.text.forThisRoute",
        )}
      </>
    ),
    [],
  );

  const { openAddRoutingPeerModal } = useAddRoutingPeer();

  return (
    <FullTooltip
      interactive={false}
      content={
        <div className={"max-w-xs text-xs"}>
          {!isActive && !groupedRoute.is_using_route_groups && (
            <>
              {disabledText}
              <div className={"inline-flex mt-2"}>
                {t(
                  "route-group.main:groupedRouteHighAvailabilityCell.text.goAheadAndAddMore",
                )}
              </div>
            </>
          )}
          {isActive && !groupedRoute.is_using_route_groups && (
            <>
              {enabledText}
              <div className={"inline-flex mt-2"}>
                {t(
                  "route-group.main:groupedRouteHighAvailabilityCell.text.youCanAddMorePeers",
                )}
              </div>
            </>
          )}
          {!isActive && groupedRoute.is_using_route_groups && (
            <>
              {disabledText}
              <div className={"inline-flex mt-2"}>
                {t(
                  "route-group.main:groupedRouteHighAvailabilityCell.text.toConfigureYouMustAdd",
                )}
              </div>
            </>
          )}
          {isActive && groupedRoute.is_using_route_groups && (
            <>
              {enabledText}
              <div className={"inline-flex mt-2"}>
                {t(
                  "route-group.main:groupedRouteHighAvailabilityCell.text.youCanAddMorePeers2",
                )}
              </div>
            </>
          )}
        </div>
      }
    >
      <div className={"flex gap-3 items-center"}>
        <Badge
          variant={isActive ? "green" : "gray"}
          className={cn(
            "inline-flex gap-2  min-w-[110px] font-medium items-center justify-center min-h-[34px]",
            !isActive && "opacity-30",
          )}
          useHover={true}
        >
          {isActive ? (
            <>
              <div className={"h-2 w-2 rounded-full bg-green-500"}></div>
              {groupedRoute.high_availability_count} {t("common:word.peerS")}
            </>
          ) : (
            <>
              <div className={"h-2 w-2 rounded-full bg-nb-gray-700"}></div>
              {t("common:word.disabled")}
            </>
          )}
          <HelpCircle size={12} />
        </Badge>
        {groupedRoute.is_using_route_groups && (
          <Button
            size={"xs"}
            variant={"secondary"}
            className={"min-w-[130px]"}
            onClick={() => router.push("/peers")}
          >
            <>
              <PeerIcon size={12} />
              {t(
                "route-group.main:groupedRouteHighAvailabilityCell.text.goToPeers",
              )}
            </>
          </Button>
        )}
        {!groupedRoute.is_using_route_groups && (
          <Button
            size={"xs"}
            variant={"secondary"}
            className={"min-w-[130px]"}
            onClick={() => openAddRoutingPeerModal(groupedRoute)}
          >
            <PlusCircle size={12} />
            {t(
              "route-group.main:groupedRouteHighAvailabilityCell.text.addPeer",
            )}
          </Button>
        )}{" "}
      </div>
    </FullTooltip>
  );
}
