import { Clock4 } from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
type Props = {
  minutes?: number;
};
export const EstimatedSetupTime = ({ minutes = 5 }: Props) => {
  return (
    <div
      className={
        "text-center z-0 mt-2.5 text-xs text-nb-gray-300 flex items-center justify-center gap-2 font-normal"
      }
    >
      <Clock4 size={12} />
      <div>
        {t("integrations.shared:word.estimatedSetupTime")}
        <span className={"font-medium"}>
          {" "}
          {t("integrations.main:estimatedSetupTime.text.minutes", { minutes })}
        </span>
      </div>
    </div>
  );
};
