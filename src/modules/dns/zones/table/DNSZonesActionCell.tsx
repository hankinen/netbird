import Button from "@components/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/DropdownMenu";
import { MoreVertical, PowerIcon, SquarePenIcon, Trash2 } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { DNSZone } from "@/interfaces/DNS";
import { useDNSZones } from "@/modules/dns/zones/DNSZonesProvider";
type Props = {
  zone: DNSZone;
};

export const DNSZonesActionCell = ({ zone }: Props) => {
  const { permission } = usePermissions();
  const { openZoneModal, deleteZone, updateZone } = useDNSZones();
  const [open, setOpen] = useState(false);

  return (
    <div className={"flex justify-end pr-4"}>
      <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          asChild={true}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <Button
            variant={"secondary"}
            className={"!px-3"}
            aria-label={t("dns.zones:dNSZonesActionCell.ariaLabel.zoneActions")}
            data-testid="dns-zone-actions"
          >
            <MoreVertical size={16} className={"shrink-0"} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto" align="end">
          <DropdownMenuItem
            onClick={() => openZoneModal(zone)}
            data-testid="edit-dns-zone"
          >
            <div className={"flex gap-3 items-center"}>
              <SquarePenIcon size={14} className={"shrink-0"} />
              {t("common:word.edit")}
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              updateZone({ ...zone, enabled: !zone.enabled });
            }}
            disabled={!permission?.dns?.update}
            data-testid="dns-zone-active-toggle"
          >
            <div className={"flex gap-3 items-center"}>
              <PowerIcon size={14} className={"shrink-0"} />
              {zone.enabled ? t("common:word.disable") : t("common:word.enable")}
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => deleteZone(zone)}
            variant={"danger"}
            disabled={!permission?.dns?.delete}
            data-testid="delete-dns-zone"
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