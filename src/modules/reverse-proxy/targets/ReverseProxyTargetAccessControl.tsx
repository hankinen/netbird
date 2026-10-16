import HelpText from "@components/HelpText";
import { Label } from "@components/Label";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import { LockKeyhole, LockOpen, ShieldX } from "lucide-react";
import { t } from "@/i18n";
import {
  TargetAccessAction,
  type TargetAccessAction as TargetAccessActionValue,
} from "@/interfaces/ReverseProxy";
type Props = {
  value?: string;
  onChange: (value: TargetAccessActionValue) => void;
  privateService: boolean;
};

const isKnownAction = (value: string): value is TargetAccessActionValue =>
  Object.values(TargetAccessAction).some((action) => action === value);

export default function ReverseProxyTargetAccessControl({
  value,
  onChange,
  privateService,
}: Readonly<Props>) {
  const selectedValue = value ?? TargetAccessAction.INHERIT;
  const hasUnsupportedValue = !isKnownAction(selectedValue);

  const options: SelectOption[] = [
    {
      label: t(
        "reverse-proxy.targets:reverseProxyTargetAccessControl.label.useServiceAuthentication",
      ),
      value: TargetAccessAction.INHERIT,
      icon: LockKeyhole,
    },
    {
      label: t(
        "reverse-proxy.targets:reverseProxyTargetAccessActionBadge.text.bypassAuthentication",
      ),
      value: TargetAccessAction.BYPASS,
      icon: LockOpen,
      disabled: privateService,
    },
    {
      label: t(
        "reverse-proxy.targets:reverseProxyTargetAccessActionBadge.text.blockAccess",
      ),
      value: TargetAccessAction.BLOCK,
      icon: ShieldX,
    },
  ];

  if (hasUnsupportedValue) {
    options.push({
      label: t(
        "reverse-proxy.targets:reverseProxyTargetAccessControl.label.unsupportedSetting",
        { selectedValue },
      ),
      value: selectedValue,
      disabled: true,
    });
  }

  return (
    <div
      className={"flex items-center justify-between gap-6"}
      data-testid={"target-access-control-setting"}
    >
      <div>
        <Label>
          {t(
            "reverse-proxy.targets:reverseProxyTargetAccessControl.text.access",
          )}
        </Label>
        <HelpText className={"mb-0 max-w-sm"}>
          {t(
            "reverse-proxy.targets:reverseProxyTargetAccessControl.text.useTheServiceAuthenticationSettings",
          )}
        </HelpText>
        {privateService && (
          <div data-testid={"target-access-control-private-service"}>
            <HelpText className={"mb-0 mt-1 !text-yellow-400"}>
              {t(
                "reverse-proxy.targets:reverseProxyTargetAccessControl.text.netBirdOnlyServicesCannotBypass",
              )}
            </HelpText>
          </div>
        )}
        {hasUnsupportedValue && (
          <div data-testid={"target-access-action-unsupported"}>
            <HelpText className={"mb-0 mt-1 !text-yellow-400"}>
              {t(
                "reverse-proxy.targets:reverseProxyTargetAccessControl.text.thisValueIsNotSupported",
              )}
            </HelpText>
          </div>
        )}
      </div>
      <SelectDropdown
        value={selectedValue}
        onChange={(next) => onChange(next as TargetAccessActionValue)}
        options={options}
        popoverWidth={260}
        className={"w-[260px]"}
        data-testid={"target-access-action"}
      />
    </div>
  );
}
