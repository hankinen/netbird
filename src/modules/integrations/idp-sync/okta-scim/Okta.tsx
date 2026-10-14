import Button from "@components/Button";
import FullTooltip from "@components/FullTooltip";
import { notify } from "@components/Notification";
import { SkeletonIntegration } from "@components/skeletons/SkeletonIntegration";
import { useTabSwitchContext } from "@components/VerticalTabs";
import { IconInfoCircle } from "@tabler/icons-react";
import useFetchApi, { useApiCall } from "@utils/api";
import dayjs from "dayjs";
import { isEmpty } from "lodash";
import { RefreshCw, Repeat, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import integrationImage from "@/assets/integrations/okta.png";
import { usePermissions } from "@/contexts/PermissionsProvider";
import {
  IdentityProviderLog,
  OktaIntegration,
} from "@/interfaces/IdentityProvider";
import OktaConfiguration from "@/modules/integrations/idp-sync/okta-scim/OktaConfiguration";
import OktaSetup from "@/modules/integrations/idp-sync/okta-scim/OktaSetup";
import { useIntegrations } from "@/modules/integrations/idp-sync/useIntegrations";
import { IntegrationCard } from "@/modules/integrations/IntegrationCard";
import { useEnterpriseConnections } from "@/modules/integrations/sso/useEnterpriseConnections";

import { t } from "@/i18n";
export const Okta = () => {
  const { mutate } = useSWRConfig();
  const [setupModal, setSetupModal] = useState(false);
  const { isOktaConnectionActive, isDataLoading: isSSOConnectionLoading } =
    useEnterpriseConnections();
  const router = useRouter();
  const { permission } = usePermissions();

  const {
    okta: integration,
    isAnyIntegrationEnabled,
    isOktaLoading,
  } = useIntegrations();
  const oktaRequest = useApiCall<OktaIntegration>(
    "/integrations/okta-scim-idp",
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
      title: t("integrations.idp-sync:okta.title.oktaIntegration"),
      description: state
        ? t(
            "integrations.idp-sync:okta.description.oktaWasSuccessfully.enabled",
          )
        : t(
            "integrations.idp-sync:okta.description.oktaWasSuccessfully.disabled",
          ),
      promise: oktaRequest
        .put(
          {
            enabled: state,
          },
          "/" + integration.id,
        )
        .then(() => {
          mutate("/integrations/okta-scim-idp");
          setEnabled(state);
        }),
      loadingMessage: t(
        "integrations.idp-sync:azureAD.loadingMessage.updatingIntegration",
      ),
    });
  };

  const { switchTab } = useTabSwitchContext();

  return isOktaLoading ||
    isSSOConnectionLoading ||
    isOktaConnectionActive === undefined ? (
    <SkeletonIntegration loadingHeight={196} />
  ) : (
    <>
      <IntegrationCard
        name="Okta"
        description={t(
          "integrations.idp-sync:okta.description.oktaIsAPlatformTo",
        )}
        url={{
          title: t("integrations.idp-sync:okta.title.oktaCom"),
          href: "https://www.okta.com/",
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
        hideSwitch={!isOktaConnectionActive}
        customButton={
          isOktaConnectionActive ? (
            <Button
              variant={"secondary"}
              size={"xs"}
              className={"w-full items-center"}
              onClick={() => setSetupModal(true)}
            >
              <Repeat size={13} />
              {t("integrations.idp-sync:okta.text.connectOkta")}
            </Button>
          ) : (
            <FullTooltip
              content={
                <div className={"text-xs max-w-xs"}>
                  {t("integrations.idp-sync:okta.text.pleaseSetupOktaSSOFrom")}
                </div>
              }
            >
              <Button
                variant={"secondary"}
                size={"xs"}
                className={"w-full items-center"}
                onClick={() => switchTab("sso")}
              >
                {t("integrations.idp-sync:okta.text.oktaSSORequired")}
                <IconInfoCircle size={14} />
              </Button>
            </FullTooltip>
          )
        }
      >
        {integration && <ConfigurationButton config={integration} />}
      </IntegrationCard>

      <OktaSetup
        open={setupModal}
        onOpenChange={setSetupModal}
        onSuccess={() => {
          setEnabled(true);
          mutate("/integrations/okta-scim-idp");
        }}
      />
    </>
  );
};

type ConfigurationProps = {
  config: OktaIntegration;
};
const ConfigurationButton = ({ config }: ConfigurationProps) => {
  const { data: logs } = useFetchApi<IdentityProviderLog[]>(
    `/integrations/okta-scim-idp/${config.id}/logs`,
  );

  const [configModal, setConfigModal] = useState(false);

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
        <Button
          variant={"default-outline"}
          size={"xs"}
          className={"w-full items-center pointer-events-none"}
          disabled={!config.enabled}
        >
          <RefreshCw size={14} />
          {lastSync}
        </Button>

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
      <OktaConfiguration open={configModal} onOpenChange={setConfigModal} />
    </>
  );
};
