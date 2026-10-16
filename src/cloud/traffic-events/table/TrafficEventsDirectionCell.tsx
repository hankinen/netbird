import Badge from "@components/Badge";
import * as React from "react";
import {
  TrafficEvent,
  TrafficEventDirection,
} from "@/cloud/traffic-events/interfaces/TrafficEvent";
import { t } from "@/i18n";
type Props = {
  event: TrafficEvent;
};

export const TrafficEventsDirectionCell = ({ event }: Props) => {
  const direction = event.direction;
  const isInbound = direction === TrafficEventDirection.INGRESS;

  return direction === TrafficEventDirection.UNKNOWN ? (
    <Badge variant={"gray"} className={"py-1 w-[80px]"}>
      {t("common:word.unknownRegion")}
    </Badge>
  ) : (
    <Badge variant={"gray"} className={"py-1 w-[80px]"}>
      {isInbound
        ? t(
            "cloud.traffic-events:trafficEventsInboundOutboundFilter.text.inbound",
          )
        : t(
            "cloud.traffic-events:trafficEventsInboundOutboundFilter.text.outbound",
          )}
    </Badge>
  );
};
