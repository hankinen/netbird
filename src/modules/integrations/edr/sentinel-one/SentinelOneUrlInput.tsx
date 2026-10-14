import { Input, InputProps } from "@components/Input";
import React, { useMemo } from "react";
import { isValidSentinelOneApiUrl } from "@/modules/integrations/edr/sentinel-one/SentinelOne";

import { t } from "@/i18n";
type Props = {
  value: string;
  setValue: (value: string) => void;
} & InputProps;

export default function SentinelOneUrlInput({
  value,
  setValue,
  ...props
}: Props) {
  const isValid = useMemo(() => {
    return isValidSentinelOneApiUrl(value);
  }, [value]);

  const error = useMemo(() => {
    if (value === "") return "";
    if (isValid) return "";
    return t(
      "integrations.edr:sentinelOneUrlInput.text.pleaseEnterAValidSentinelOne",
    );
  }, [value, isValid]);

  return (
    <Input
      type={"text"}
      className={"w-full"}
      autoCorrect={"off"}
      autoComplete={"off"}
      placeholder={t(
        "integrations.edr:sentinelOneUrlInput.placeholder.httpsYourTenantSentineloneNet",
      )}
      value={value}
      error={error}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  );
}
