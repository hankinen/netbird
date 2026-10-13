import FullTooltip from "@components/FullTooltip";
import { IconDirectionSign } from "@tabler/icons-react";
import * as React from "react";
import { t } from "@/i18n";
import { Peer } from "@/interfaces/Peer";
import { useHasExitNodes } from "@/modules/exit-node/useHasExitNodes";
type Props = {
  peer: Peer;
};
export const ExitNodePeerIndicator = ({ peer }: Props) => {
  const exitNodeInfo = useHasExitNodes(peer);

  if (!exitNodeInfo.hasExitNode) {
    return null;
  }

  const tooltipContent = exitNodeInfo.skipAutoApply === false
    ? t("exit-node.main:exitNodePeerIndicator.text.thisPeerIsAnAuto")
    : t("exit-node.main:exitNodePeerIndicator.text.thisPeerIsAnExit");

  return (
    <FullTooltip content={<div className={"text-xs max-w-xs"}>{tooltipContent}</div>}>
      <IconDirectionSign 
        size={15} 
        className={`shrink-0 ${exitNodeInfo.skipAutoApply === false ? "text-green-400" : "text-yellow-400"}`} 
      />
    </FullTooltip>
  );
};
