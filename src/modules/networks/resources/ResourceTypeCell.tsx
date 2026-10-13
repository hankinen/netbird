import Badge from "@components/Badge";
import { NetworkIcon, WorkflowIcon } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  single: boolean;
};
export default function ResourceTypeCell({ single }: Props) {
  return (
    <div className={"inline-flex"}>
      {single ? (
        <Badge variant={"gray"} className={"min-w-[130px]"}>
          <WorkflowIcon size={14} />{" "}
          {t("networks.resources:resourceTypeCell.text.singleIP")}
        </Badge>
      ) : (
        <Badge variant={"gray"} className={"min-w-[130px]"}>
          <NetworkIcon size={14} />{" "}
          {t("networks.resources:resourceTypeCell.text.iPRange")}
        </Badge>
      )}
    </div>
  );
}
