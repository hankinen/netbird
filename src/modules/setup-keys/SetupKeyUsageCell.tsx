import { IconRepeat } from "@tabler/icons-react";
import { Repeat1 } from "lucide-react";
import { t } from "@/i18n";
type Props = {
  current: number;
  limit: number;
  reusable: boolean;
};
export default function SetupKeyUsageCell({ current, limit, reusable }: Props) {
  return reusable ? (
    <div className={"flex items-center text-[13px] text-nb-gray-300 gap-2"}>
      <IconRepeat size={14} className={"text-green-400"} />
      <span>
        <span className={"font-medium text-nb-gray-200"}> {current} </span>{" "}
        {t("setup-keys.main:setupKeyUsageCell.text.of")}{" "}
        {limit == 0 ? (
          <>{t("setup-keys.main:setupKeyModal.placeholder.unlimited")}</>
        ) : (
          limit
        )}{" "}
        {t("common:word.peers")}
      </span>
    </div>
  ) : (
    <div className={"flex items-center text-[13px] text-nb-gray-300 gap-2"}>
      <Repeat1 size={14} /> {t("setup-keys.main:setupKeyTypeCell.text.oneOff")}
    </div>
  );
}
