import Badge from "@components/Badge";
import Button from "@components/Button";
import { PlusCircle, ShieldIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  count: number;
};

export const PolicyCell = ({ count }: Props) => {
  return count > 0 ? (
    <div className={"flex gap-3"}>
      <Badge variant={"gray"} useHover={true}>
        <ShieldIcon size={14} className={"text-green-500"} />
        <div>
          <span className={"font-medium"}>{count}</span>{" "}
          {t("networks.main:policyCell.text.accessPolicieS")}
        </div>
      </Badge>
      <Button size={"xs"} variant={"secondary"} className={"min-w-[130px]"}>
        <PlusCircle size={12} />
        {t("networks.main:policyCell.text.addPolicy")}
      </Button>
    </div>
  ) : (
    <Button size={"xs"} variant={"secondary"} className={"min-w-[130px]"}>
      <PlusCircle size={12} />
      {t("networks.main:policyCell.text.addPolicy")}
    </Button>
  );
};
