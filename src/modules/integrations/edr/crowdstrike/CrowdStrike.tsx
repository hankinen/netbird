import Button from "@components/Button";
import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import { useApiCall } from "@utils/api";
import { Settings } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/crowdstrike.png";
import { useDialog } from "@/contexts/DialogProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { Account } from "@/interfaces/Account";
import { CrowdstrikeIntegration } from "@/interfaces/EDR";
import CrowdStrikeConfiguration from "@/modules/integrations/edr/crowdstrike/CrowdStrikeConfiguration";
import CrowdStrikeSetup from "@/modules/integrations/edr/crowdstrike/CrowdStrikeSetup";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { useIntegrations } from "../useIntegrations";

import { t } from "@/i18n";
type Props = {
  account: Account;
};

export const CrowdStrike = ({ account }: Props) => {
  const { permission } = usePermissions();
  const { mutate } = useSWRConfig();
  const [setupModal, setSetupModal] = useState(false);

  const {
    crowdstrike: integration,
    isAnyIntegrationEnabled,
    isCrowdstrikeLoading: isLoading,
  } = useIntegrations();

  const integrationRequest = useApiCall<CrowdstrikeIntegration>(
    "/integrations/edr/falcon",
  );

  const [enabled, setEnabled] = useState(!!integration?.enabled);

  useEffect(() => {
    setEnabled(!!integration?.enabled);
  }, [integration]);

  const { confirm } = useDialog();

  const toggleSwitch = async () => {
    if (!integration?.cloud_id) return setSetupModal(true);
    const isCurrentlyEnabled = integration.enabled;

    const choice = isCurrentlyEnabled
      ? await confirm({
          title: t("integrations.edr:crowdStrike.title.disableCrowdStrike"),
          description: t(
            "integrations.edr:crowdStrike.description.areYouSureYouWant",
          ),
          confirmText: t("common:word.disable"),
          cancelText: t("common:word.cancel"),
          type: "warning",
        })
      : true;
    if (!choice) return;

    const groups =
      integration.groups?.map((group) =>
        typeof group === "string" ? group : group.id,
      ) || [];

    notify({
      title: t("integrations.edr:crowdStrike.title.crowdStrikeIntegration"),
      description: isCurrentlyEnabled
        ? t(
            "integrations.edr:crowdStrike.description.crowdStrikeWasSuccessfully.disabled",
          )
        : t(
            "integrations.edr:crowdStrike.description.crowdStrikeWasSuccessfully.enabled",
          ),
      promise: integrationRequest
        .put({
          ...integration,
          groups,
          secret: undefined,
          client_id: undefined,
          enabled: !isCurrentlyEnabled,
        })
        .then(() => {
          mutate("/integrations/edr/falcon");
        }),
      loadingMessage: t(
        "integrations.edr:intune.loadingMessage.updatingIntegration",
      ),
    });
  };

  return isLoading ? (
    <SkeletonIntegration loadingHeight={197} />
  ) : (
    <>
      <IntegrationCard
        name="CrowdStrike"
        description={t(
          "integrations.edr:crowdStrike.description.crowdStrikeIsACloudNative",
        )}
        url={{
          title: t("integrations.edr:crowdStrike.title.crowdstrikeCom"),
          href: "https://www.crowdstrike.com/",
        }}
        image={integrationImage}
        data={integration?.cloud_id ? integration : undefined}
        switchState={enabled}
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
        disabled={
          enabled
            ? !permission.edr.update
            : isAnyIntegrationEnabled || !permission.edr.create
        }
      >
        {integration && <ConfigurationButton config={integration} />}
      </IntegrationCard>

      <CrowdStrikeSetup
        account={account}
        open={setupModal}
        onOpenChange={setSetupModal}
        onSuccess={() => {
          setSetupModal(false);
        }}
      />
    </>
  );
};

type ConfigurationProps = {
  config: CrowdstrikeIntegration;
};
const ConfigurationButton = ({ config }: ConfigurationProps) => {
  const [configModal, setConfigModal] = useState(false);

  return (
    <>
      <div className={"flex gap-2"}>
        <Button
          variant={"secondary"}
          size={"xs"}
          className={"w-full items-center"}
          onClick={() => {
            setConfigModal(true);
          }}
        >
          <Settings size={14} />
          {t("common:word.settings")}
        </Button>
      </div>
      <CrowdStrikeConfiguration
        open={configModal}
        onOpenChange={setConfigModal}
        config={config}
      />
    </>
  );
};
