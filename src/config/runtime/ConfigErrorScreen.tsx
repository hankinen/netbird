import Button from "@components/Button";
import Paragraph from "@components/Paragraph";
import * as React from "react";
import NetBirdIcon from "@/assets/icons/NetBirdIcon";
import { t } from "@/i18n";
import type { RuntimeConfigErrorKind } from "./parse";

type Props = {
  kind: RuntimeConfigErrorKind;
  details?: string;
  onRetry?: () => void;
};

const title = (kind: RuntimeConfigErrorKind) => {
  switch (kind) {
    case "missing":
      return t("components.core:runtimeConfigError.title.missing");
    case "invalid":
      return t("components.core:runtimeConfigError.title.invalid");
    case "incompatible":
      return t("components.core:runtimeConfigError.title.incompatible");
    case "timeout":
      return t("components.core:runtimeConfigError.title.timeout");
    default:
      return t("components.core:runtimeConfigError.title.network");
  }
};

/**
 * Shown instead of the app when /runtime-config.json cannot be used, so a
 * deployment problem is visible and never ends in an endless spinner.
 */
export const ConfigErrorScreen = ({ kind, details, onRetry }: Props) => (
  <div
    className={
      "flex items-center justify-center flex-col h-screen max-w-lg mx-auto px-4"
    }
    data-testid={"runtime-config-error"}
    data-kind={kind}
  >
    <div
      className={
        "bg-nb-gray-930 mb-3 border border-nb-gray-900 h-12 w-12 rounded-md flex items-center justify-center "
      }
    >
      <NetBirdIcon size={23} />
    </div>
    <h1 className={"text-center mt-2"}>{title(kind)}</h1>
    <Paragraph className={"text-center mt-2 block"}>
      {t("components.core:runtimeConfigError.text.adminHint")}
    </Paragraph>
    {details && (
      <Paragraph className={"text-center mt-2 block text-xs font-mono"}>
        {t("components.core:runtimeConfigError.text.details", { details })}
      </Paragraph>
    )}
    {onRetry && (
      <Button variant={"primary"} size={"sm"} className={"mt-5"} onClick={onRetry}>
        {t("components.core:runtimeConfigError.button.retry")}
      </Button>
    )}
  </div>
);
