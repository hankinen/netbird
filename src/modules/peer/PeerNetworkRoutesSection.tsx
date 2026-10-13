import InlineLink from "@components/InlineLink";
import Paragraph from "@components/Paragraph";
import SkeletonTable from "@components/skeletons/SkeletonTable";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import { lazy, Suspense } from "react";
import { t } from "@/i18n";
import type { Peer } from "@/interfaces/Peer";
import { AddExitNodeButton } from "@/modules/exit-node/AddExitNodeButton";
import { useHasExitNodes } from "@/modules/exit-node/useHasExitNodes";
import AddRouteDropdownButton from "@/modules/peer/AddRouteDropdownButton";
import usePeerRoutes from "@/modules/peer/usePeerRoutes";
const PeerRoutesTable = lazy(() => import("@/modules/peer/PeerRoutesTable"));

type Props = {
  peer: Peer;
};

export const PeerNetworkRoutesSection = ({ peer }: Props) => {
  const { peerRoutes, isLoading } = usePeerRoutes({ peer });
  const exitNodeInfo = useHasExitNodes(peer);

  return (
    <div className={"pb-10 px-8"}>
      <div className={""}>
        <div className={"flex justify-between items-center mb-5"}>
          <div>
            <Paragraph>
              {t(
                "peer.main:peerNetworkRoutesSection.text.accessOtherNetworksWithoutInstalling",
              )}{" "}
              <InlineLink
                href={
                  "https://docs.netbird.io/how-to/routing-traffic-to-private-networks"
                }
                target={"_blank"}
              >
                {t("common:word.learnMore")}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <div className={"inline-flex gap-4 justify-end"}>
            <div className={"gap-4 flex"}>
              <AddExitNodeButton
                peer={peer}
                firstTime={!exitNodeInfo.hasExitNode}
              />
              <AddRouteDropdownButton />
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div>
              <div className={"mt-0 w-full"}>
                <SkeletonTable withHeader={false} />
              </div>
            </div>
          }
        >
          <PeerRoutesTable
            peer={peer}
            isLoading={isLoading}
            peerRoutes={peerRoutes}
          />
        </Suspense>
      </div>
    </div>
  );
};
