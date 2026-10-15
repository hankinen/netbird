import Badge from "@components/Badge";
import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import FullTooltip from "@components/FullTooltip";
import {
  HelpCircle,
  MoreVertical,
  ShieldCheckIcon,
  ShieldUserIcon,
  SquarePenIcon,
  Trash2,
  UnlinkIcon,
} from "lucide-react";
import * as React from "react";
import { useTenants } from "@/cloud/msp/contexts/TenantsProvider";
import { Tenant, TenantStatus } from "@/cloud/msp/interfaces/Tenant";
import { t } from "@/i18n";
type Props = {
  tenant: Tenant;
};
export const TenantActionCell = ({ tenant }: Props) => {
  const {
    openEditTenantModal,
    verifyDomain,
    openUnlinkTenantModal,
    deleteTenant,
    openAccountExistsModal,
  } = useTenants();
  const isPending = tenant.status === TenantStatus.Pending;
  const isActive = tenant.status === TenantStatus.Active;
  const isExisting = tenant.status === TenantStatus.Existing;
  const isInvited = tenant.status === TenantStatus.Invited;
  const canEdit = isPending || isActive;

  return (
    <div className={"flex justify-end pr-4 items-center gap-4"}>
      {isPending && (
        <Button
          variant={"default-outline"}
          size={"sm"}
          className={"max-h-[38px]"}
          onClick={() => verifyDomain(tenant, true)}
        >
          <ShieldCheckIcon size={14} />
          {t("cloud.msp:mSPTenantModal.text.verifyDomain")}
        </Button>
      )}

      {isExisting && (
        <Button
          variant={"default-outline"}
          size={"sm"}
          className={"max-h-[38px]"}
          onClick={() => openAccountExistsModal(tenant)}
        >
          <ShieldUserIcon size={16} />
          {t("cloud.msp:mSPAccountExistsModal.text.requestAccess")}
        </Button>
      )}

      {isInvited && (
        <FullTooltip
          content={
            <div className={"text-xs max-w-xs"}>
              {t("cloud.msp:tenantActionCell.text.theAccountOwnerMustLog")}
            </div>
          }
        >
          <Badge variant={"yellow"} className={"ml-6 cursor-help"}>
            {t("cloud.msp:tenantActionCell.text.pendingAccessRequest")}
            <HelpCircle size={12} />
          </Badge>
        </FullTooltip>
      )}

      <Button
        variant={"default-outline"}
        size={"sm"}
        className={"max-h-[38px]"}
        disabled={!canEdit}
        onClick={() => openEditTenantModal(tenant)}
      >
        <SquarePenIcon size={14} />
        {t("common:word.edit")}
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          asChild={true}
          disabled={!canEdit}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Button variant={"secondary"} size={"sm"} className={"!px-3"}>
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto" align="end">
          <DropdownMenuItem onClick={() => openUnlinkTenantModal(tenant)}>
            <div className={"flex gap-3 items-center"}>
              <UnlinkIcon size={14} className={"shrink-0"} />
              {t("cloud.msp:mSPUnlinkModal.text.unlink")}
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            variant={"danger"}
            onClick={() => deleteTenant(tenant)}
          >
            <div className={"flex gap-3 items-center"}>
              <Trash2 size={14} className={"shrink-0"} />
              {t("common:word.delete")}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
