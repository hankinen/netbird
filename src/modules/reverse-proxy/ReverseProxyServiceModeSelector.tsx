import React, { ReactNode, useEffect } from "react";
import {
  isL4Mode as isL4ServiceMode,
  type ReverseProxyDomain,
  ServiceMode,
} from "@/interfaces/ReverseProxy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import { ArrowRightFromLine, Globe, LockKeyhole } from "lucide-react";
import { HelpTooltip } from "@components/HelpTooltip";
import { Label } from "@components/Label";
import HelpText from "@components/HelpText";

import { t } from "@/i18n";
type Props = {
  value?: ServiceMode;
  onChange: (value: ServiceMode) => void;
  disabled?: boolean;
  domain?: ReverseProxyDomain;
};

type ServiceModeConfig = {
  label: string;
  description: string;
  icon: ReactNode;
};

export const SERVICE_MODES: Record<ServiceMode, ServiceModeConfig> = {
  [ServiceMode.HTTP]: {
    get label() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.label.hTTPSService",
      );
    },
    get description() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.description.reverseProxyWithPathRouting",
      );
    },
    icon: <Globe size={14} />,
  },
  [ServiceMode.TLS]: {
    get label() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.label.tLSPassthrough",
      );
    },
    get description() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.description.passesEncryptedTLSTrafficStraight",
      );
    },
    icon: <LockKeyhole size={14} />,
  },
  [ServiceMode.TCP]: {
    get label() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.label.tCPService",
      );
    },
    get description() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.description.forwardsRawTCPTrafficTo",
      );
    },
    icon: <ArrowRightFromLine size={14} />,
  },
  [ServiceMode.UDP]: {
    get label() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.label.uDPService",
      );
    },
    get description() {
      return t(
        "reverse-proxy.main:reverseProxyServiceModeSelector.description.forwardsRawUDPTrafficTo",
      );
    },
    icon: <ArrowRightFromLine size={14} />,
  },
};

export const ReverseProxyServiceModeSelector = ({
  value,
  onChange,
  disabled,
  domain,
}: Props) => {
  const selected = value ?? ServiceMode.HTTP;
  const selectedMode = SERVICE_MODES[selected];
  const isL4Supported = domain?.supports_custom_ports !== undefined;

  // Reset to HTTP if the current L4 mode becomes unsupported (e.g. domain changed)
  useEffect(() => {
    if (!isL4Supported && isL4ServiceMode(selected)) {
      onChange(ServiceMode.HTTP);
    }
  }, [isL4Supported, selected, onChange]);

  return (
    <div className="flex justify-between items-center gap-10 mt-2">
      <div>
        <Label>
          {t(
            "reverse-proxy.main:reverseProxyServiceModeSelector.text.serviceType",
          )}
        </Label>
        <HelpText>
          {t(
            "reverse-proxy.main:reverseProxyServiceModeSelector.text.selectATypeToDefine",
          )}
        </HelpText>
      </div>
      <Select
        value={selected}
        onValueChange={(v) => onChange(v as ServiceMode)}
        disabled={disabled}
      >
        <SelectTrigger className="max-w-[240px] min-w-[200px]">
          <div
            className={"flex items-center gap-2 whitespace-nowrap"}
            data-testid={"service-mode-select-button"}
          >
            {selectedMode.icon}
            <SelectValue
              placeholder={t(
                "reverse-proxy.main:reverseProxyServiceModeSelector.placeholder.selectType",
              )}
            />
          </div>
        </SelectTrigger>
        <SelectContent data-testid={"service-mode-selection"}>
          {Object.entries(SERVICE_MODES)
            .filter(
              ([mode]) =>
                isL4Supported || !isL4ServiceMode(mode as ServiceMode),
            )
            .map(([mode, config]) => (
              <SelectItem
                key={mode}
                value={mode}
                data-testid={`service-mode-option-${mode}`}
                extra={
                  <HelpTooltip
                    triggerClassName={"ml-[0.01rem]"}
                    align={"center"}
                    side={"right"}
                    content={<>{config.description}</>}
                  />
                }
              >
                <span className="whitespace-nowrap">{config.label}</span>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};
