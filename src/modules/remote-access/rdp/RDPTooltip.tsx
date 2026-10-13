import FullTooltip from "@components/FullTooltip";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  disabled?: boolean;
  children?: React.ReactNode;
  hasPermission?: boolean;
  side?: "top" | "right" | "bottom" | "left";
};
export const RDPTooltip = ({
  disabled,
  children,
  hasPermission,
  side = "top",
}: Props) => {
  return (
    <FullTooltip
      className={"w-full"}
      side={side}
      content={
        <div className={"max-w-xs text-xs flex flex-col gap-2"}>
          {hasPermission ? (
            <div>
              {t("remote-access.rdp:rDPTooltip.text.thisPeerIsOfflineAnd")}
            </div>
          ) : (
            <div>
              {t("remote-access.rdp:rDPTooltip.text.youDoNotHavePermission")}
            </div>
          )}
        </div>
      }
      disabled={disabled}
    >
      {children}
    </FullTooltip>
  );
};
