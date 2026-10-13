import FullTooltip from "@components/FullTooltip";
import {PowerOffIcon} from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { Peer } from "@/interfaces/Peer";
type Props = {
    peer: Peer;
};
export const EphemeralPeerIndicator = ({ peer }: Props) => {
    if (!peer.ephemeral) {
        return null;
    }

    const tooltipContent = t("peer.main:ephemeralPeerIndicator.text.thisPeerIsAnEphemeral");

    return (
        <FullTooltip content={<div className={"text-xs max-w-xs"}>{tooltipContent}</div>}>
            <PowerOffIcon size={12} className={"shrink-0 text-yellow-400"} />
        </FullTooltip>
    );
};
