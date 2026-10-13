import Badge from "@components/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/Tooltip";
import { AlertTriangle } from "lucide-react";
import { t } from "@/i18n";
type Props = {
  loginExpired: boolean;
};
export default function LoginExpiredBadge({ loginExpired }: Props) {
  return loginExpired ? (
    <Tooltip delayDuration={1}>
      <TooltipTrigger>
        <Badge variant={"red"} className={"px-2"}>
          <AlertTriangle size={12} />
          {t("components.ui:loginExpiredBadge.text.loginRequired")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className={"text-neutral-300 text-xs leading-1.5"}>
          {t("components.ui:loginExpiredBadge.text.thisPeerIsOfflineAnd")}{" "}
          <br />
          {t(
            "components.ui:loginExpiredBadge.text.reAuthenticatedBecauseItsLogin",
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  ) : null;
}
