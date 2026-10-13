import FullTooltip from "@components/FullTooltip";
import InlineLink from "@components/InlineLink";
import { ArrowUpRightIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { usePeer } from "@/contexts/PeerProvider";
import { t } from "@/i18n";
type Props = {
  children?: React.ReactNode;
  hasPermission: boolean;
  isOnline?: boolean;
  isSSHEnabled?: boolean;
  side?: "top" | "right" | "bottom" | "left";
};
export const SSHTooltip = ({
  children,
  hasPermission,
  isOnline,
  isSSHEnabled,
  side = "top",
}: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltipContent = () => {
    if (!hasPermission) {
      return <NoPermissionText />;
    }
    if (!isSSHEnabled) {
      return <SSHDisabledText setShowTooltip={setShowTooltip} />;
    }
    if (!isOnline) {
      return <IsOfflineText />;
    }
    return null;
  };

  return (
    <FullTooltip
      customOpen={showTooltip}
      customOnOpenChange={setShowTooltip}
      className={"w-full"}
      side={side}
      content={tooltipContent()}
      disabled={isOnline && isSSHEnabled && hasPermission}
    >
      {children}
    </FullTooltip>
  );
};

const NoPermissionText = () => {
  return (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>{t("remote-access.ssh:sSHTooltip.text.youDoNotHavePermission")}</div>
    </div>
  );
};

const IsOfflineText = () => {
  return (
    <div className={"max-w-[200px] text-xs"}>
      <div>{t("remote-access.ssh:sSHTooltip.text.connectingViaSSHIsOnly")}</div>
    </div>
  );
};

const SSHDisabledText = ({
  setShowTooltip,
}: {
  setShowTooltip: (show: boolean) => void;
}) => {
  const { setSSHInstructionsModal } = usePeer();

  return (
    <div className={"max-w-xs text-xs flex flex-col gap-2"}>
      <div>
        {t("remote-access.ssh:sSHTooltip.text.sSHAccessIsCurrentlyDisabled")}
      </div>
      <div>
        <InlineLink
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowTooltip(false);
            setSSHInstructionsModal(true);
          }}
          href={"#"}
          target={"_blank"}
        >
          {t("remote-access.ssh:sSHTooltip.text.enableSSHAccess")}{" "}
          <ArrowUpRightIcon size={12} />
        </InlineLink>
      </div>
    </div>
  );
};
