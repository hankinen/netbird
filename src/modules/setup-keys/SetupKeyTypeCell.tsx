import Badge from "@components/Badge";
import { IconRepeat } from "@tabler/icons-react";
import { Repeat1 } from "lucide-react";
import { t } from "@/i18n";
type Props = {
  reusable: boolean;
};
export default function SetupKeyTypeCell({ reusable }: Readonly<Props>) {
  return (
    <div className={"flex"}>
      <Badge className={"text-xs"} variant={"gray"}>
        {reusable ? (
          <>
            <IconRepeat size={14} className={"text-green-400"} />{" "}
            {t("setup-keys.main:setupKeyTypeCell.text.reusable")}
          </>
        ) : (
          <>
            <Repeat1 size={14} />{" "}
            {t("setup-keys.main:setupKeyTypeCell.text.oneOff")}
          </>
        )}
      </Badge>
    </div>
  );
}
