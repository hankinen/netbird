import Badge from "@components/Badge";
import { cn } from "@utils/helpers";
import {
  Cog,
  CreditCardIcon,
  EyeIcon,
  GaugeIcon,
  NetworkIcon,
  User2,
} from "lucide-react";
import React from "react";
import AgentNetworkIcon from "@/assets/icons/AgentNetworkIcon";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import { t } from "@/i18n";
import { Role, User } from "@/interfaces/User";
type Props = {
  user: User;
};

export default function UserRoleCell({ user }: Readonly<Props>) {
  const role = user.role;

  return (
    <div className={cn("flex gap-3 items-center text-nb-gray-200")}>
      <Badge variant={role == "owner" ? "netbird" : "gray"}>
        {role === Role.User && (
          <>
            <User2 size={14} />
            {t("common:word.user")}
          </>
        )}
        {role === Role.Admin && (
          <>
            <Cog size={14} />
            {t("users.table-cells:userRoleCell.text.admin")}
          </>
        )}
        {role === Role.Owner && (
          <>
            <NetBirdIcon size={14} />
            {t("users.table-cells:userRoleCell.text.owner")}
          </>
        )}
        {role === Role.BillingAdmin && (
          <>
            <CreditCardIcon size={14} />
            {t("users.table-cells:userRoleCell.text.billingAdmin")}
          </>
        )}
        {role === Role.Auditor && (
          <>
            <EyeIcon size={14} />
            {t("users.table-cells:userRoleCell.text.auditor")}
          </>
        )}
        {role === Role.NetworkAdmin && (
          <>
            <NetworkIcon size={14} />
            {t("users.table-cells:userRoleCell.text.networkAdmin")}
          </>
        )}
        {role === Role.AgentNetworkAdmin && (
          <>
            <AgentNetworkIcon size={14} />
            {t("users.table-cells:userRoleCell.text.agentNetworkAdmin")}
          </>
        )}
        {role === Role.UsageViewer && (
          <>
            <GaugeIcon size={14} />
            {t("users.table-cells:userRoleCell.text.usageViewer")}
          </>
        )}
      </Badge>
    </div>
  );
}
