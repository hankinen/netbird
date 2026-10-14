import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import useFetchApi, { useApiCall } from "@utils/api";
import dayjs from "dayjs";
import { isEmpty } from "lodash";
import { RefreshCw, Settings } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/entra-id.png";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  AzureADIntegration,
  IdentityProviderLog,
} from "@/interfaces/IdentityProvider";
import AzureADConfiguration from "@/modules/integrations/idp-sync/azure-ad/AzureADConfiguration";
import AzureADSetup from "@/modules/integrations/idp-sync/azure-ad/AzureADSetup";
import { useIntegrations } from "@/modules/integrations/idp-sync/useIntegrations";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";

import { t } from "@/i18n";
export const AzureAD = () => {
  const { mutate } = useSWRConfig();
  const [setupModal, setSetupModal] = useState(false);
  const { permission } = usePermissions();

  const {
    azure: integration,
    isAnyIntegrationEnabled,
    isAzureLoading,
  } = useIntegrations();
  const azureRequest = useApiCall<AzureADIntegration>(
    "/integrations/azure-idp",
  );

  const [enabled, setEnabled] = useState(
    integration ? integration.enabled : false,
  );

  useEffect(() => {
    setEnabled(integration?.enabled ?? false);
  }, [integration]);

  const toggleSwitch = async (state: boolean) => {
    if (!integration) return setSetupModal(true);

    notify({
      title: t("integrations.idp-sync:azureAD.title.entraIDAPIIntegration"),
      description: state
        ? t(
            "integrations.idp-sync:azureAD.description.entraIDAPIWasSuccessfully.enabled",
          )
        : t(
            "integrations.idp-sync:azureAD.description.entraIDAPIWasSuccessfully.disabled",
          ),
      promise: azureRequest
        .put(
          {
            enabled: state,
          },
          "/" + integration.id,
        )
        .then(() => {
          mutate("/integrations/azure-idp");
          setEnabled(state);
        }),
      loadingMessage: t(
        "integrations.idp-sync:azureAD.loadingMessage.updatingIntegration",
      ),
    });
  };

  return isAzureLoading ? (
    <SkeletonIntegration loadingHeight={196} />
  ) : (
    <>
      <IntegrationCard
        name="Entra ID (API)"
        description={t(
          "integrations.idp-sync:azureAD.description.microsoftEntraIDIsA",
        )}
        url={{
          title: t("integrations.idp-sync:azureAD.title.microsoftCom"),
          href: "https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id",
        }}
        image={integrationImage}
        data={integration}
        disabled={
          enabled
            ? !permission.idp.update
            : isAnyIntegrationEnabled || !permission.idp.create
        }
        switchState={enabled}
        onEnabledChange={toggleSwitch}
        onSetup={() => setSetupModal(true)}
      >
        {integration && <ConfigurationButton config={integration} />}
      </IntegrationCard>
      <AzureADSetup
        open={setupModal}
        onOpenChange={setSetupModal}
        onSuccess={() => setEnabled(true)}
      />
    </>
  );
};

type ConfigurationProps = {
  config: AzureADIntegration;
};
const ConfigurationButton = ({ config }: ConfigurationProps) => {
  const { data: logs } = useFetchApi<IdentityProviderLog[]>(
    `/integrations/azure-idp/${config.id}/logs`,
  );
  const { mutate } = useSWRConfig();
  const syncRequest = useApiCall<{ response: boolean }>(
    `/integrations/azure-idp/${config.id}/sync`,
  );

  const [configModal, setConfigModal] = useState(false);

  const forceSync = async () => {
    notify({
      title: t("integrations.idp-sync:azureAD.title.entraIDAPIIntegration"),
      description: t(
        "integrations.idp-sync:azureAD.description.entraIDAPIWasSuccessfully2",
      ),
      loadingMessage: t(
        "integrations.idp-sync:azureAD.loadingMessage.syncingIntegration",
      ),
      promise: syncRequest.post({}).then(() => {
        mutate(`/integrations/azure-idp/${config.id}/logs`);
      }),
    });
  };

  const lastSync = useMemo(() => {
    if (isEmpty(logs))
      return t("integrations.idp-sync:azureAD.text.notSynchronized");
    return t("integrations.idp-sync:azureAD.text.synced", {
      to: dayjs().to(logs?.[0]?.timestamp),
    });
  }, [logs]);

  return (
    <>
      <div className={"flex gap-2"}>
        <FullTooltip
          content={
            <div className={"text-xs"}>
              {t(
                "integrations.idp-sync:azureAD.text.forceSynchronizationOfUsersAnd",
              )}
            </div>
          }
          disabled={!config.enabled}
          className={"w-full"}
          interactive={false}
        >
          <Button
            variant={"secondary"}
            size={"xs"}
            className={"w-full items-center"}
            onClick={forceSync}
            disabled={!config.enabled}
          >
            <RefreshCw size={14} />
            {lastSync}
          </Button>
        </FullTooltip>

        <Button
          variant={"secondary"}
          size={"xs"}
          className={"items-center"}
          onClick={() => {
            setConfigModal(true);
          }}
        >
          <Settings size={14} />
        </Button>
      </div>
      <AzureADConfiguration open={configModal} onOpenChange={setConfigModal} />
    </>
  );
};
