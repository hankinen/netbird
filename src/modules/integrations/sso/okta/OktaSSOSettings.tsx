import Button from "@components/Button";
import Card from "@components/Card";
import HelpText from "@components/HelpText";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import { Modal, ModalContent } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { cn } from "@utils/helpers";
import { AlertOctagon, GlobeIcon, KeyRound, Settings } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import integrationImage from "@/assets/integrations/okta.png";
import { useDialog } from "@/contexts/DialogProvider";
import { t } from "@/i18n";
import { DomainValidationStatus } from "@/interfaces/Account";
import {
  EnterpriseConnection,
  EnterpriseConnectionDomain,
} from "@/interfaces/IdentityProvider";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
import { DomainVerificationCard } from "@/modules/integrations/sso/DomainVerificationCard";
import { DomainVerificationModal } from "@/modules/integrations/sso/DomainVerificationModal";
import { useEnterpriseConnections } from "@/modules/integrations/sso/useEnterpriseConnections";
type Props = {
  config: EnterpriseConnection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
export const OktaSsoSettings = ({ open, onOpenChange, config }: Props) => {
  const { deleteConnection, addDomain, verifyDomain, mutate } =
    useEnterpriseConnections();
  const [tab, setTab] = useState("domains");
  const [domain, setDomain] = useState("");
  const { confirm } = useDialog();

  const deleteIntegration = async () => {
    const choice = await confirm({
      title: t("integrations.sso:oktaSSOSettings.title.deleteIntegration"),
      description: t(
        "integrations.sso:oktaSSOSettings.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });

    if (!choice) return;

    notify({
      title: t("integrations.sso:oidcSetupModal.title.oktaSSOIntegration"),
      description: t(
        "integrations.sso:oktaSSOSettings.description.oktaWasSuccessfullyDeleted",
      ),
      promise: deleteConnection(config.id).then(() => {
        onOpenChange(false);
        mutate();
      }),
      loadingMessage: t("integrations.shared:word.deletingIntegration"),
    });
  };

  const addDomainHandler = async () => {
    notify({
      title: t("integrations.sso:domainVerificationCard.title.oktaDomains"),
      description: t(
        "integrations.sso:oktaSSOSettings.description.hasBeenAdded",
        { domain },
      ),
      promise: addDomain(config.id, domain).then((res) => {
        const result = res as unknown as EnterpriseConnectionDomain;
        mutate();
        if (result?.validation_status == DomainValidationStatus.PENDING) {
          setDomainVerification({
            name: result?.name || "",
            token: result?.validation_token || "",
          });
          setDomainVerificationModal(true);
        }
      }),
      loadingMessage: t(
        "integrations.sso:oktaSSOSettings.loadingMessage.addingDomain",
      ),
    });
  };

  const [domainVerificationModal, setDomainVerificationModal] = useState(false);
  const [domainVerification, setDomainVerification] = useState({
    name: "",
    token: "",
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      <DomainVerificationModal
        open={domainVerificationModal}
        onOpenChange={setDomainVerificationModal}
        domain={domainVerification.name}
        token={domainVerification.token}
        onVerify={() => verifyDomain(config.id, domainVerification.name)}
      />
      <ModalContent
        maxWidthClass={cn("relative max-w-xl")}
        showClose={true}
        className={""}
        autoFocus={false}
      >
        <GradientFadedBackground />

        <IntegrationModalHeader
          image={integrationImage}
          title={t(
            "integrations.sso:oktaSSOSettings.title.oktaSSOConfiguration",
          )}
          description={t(
            "integrations.sso:oktaSSOSettings.description.useOktaAsASingle",
          )}
        />

        <Tabs
          defaultValue={tab}
          onValueChange={(v) => setTab(v)}
          className={"mt-6"}
        >
          <TabsList justify={"start"} className={"px-8"}>
            <TabsTrigger value={"domains"}>
              <GlobeIcon
                size={16}
                className={
                  "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
                }
              />
              {t("integrations.sso:domainVerificationTable.text.domains")}
            </TabsTrigger>
            <TabsTrigger value={"settings"}>
              <Settings
                size={16}
                className={
                  "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
                }
              />
              {t("integrations.sso:oktaSSOSettings.text.configuration")}
            </TabsTrigger>
            <TabsTrigger value={"danger"}>
              <AlertOctagon
                size={16}
                className={
                  "text-nb-gray-500 group-data-[state=active]/trigger:text-netbird transition-all"
                }
              />
              {t("integrations.shared:word.dangerZone")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value={"settings"} className={"px-8 text-sm"}>
            <div className={"flex-col gap-3 flex"}>
              <Card className={"w-full"}>
                <Card.List>
                  <Card.ListItem
                    copy
                    copyText={config?.client_id}
                    label={
                      <>
                        <GlobeIcon size={16} />
                        {t("integrations.sso:oktaSSOSettings.text.oktaDomain")}
                      </>
                    }
                    value={config?.discovery_domain}
                  />
                  <Card.ListItem
                    copy
                    copyText={config?.client_id}
                    label={
                      <>
                        <KeyRound size={16} />
                        {t("integrations.shared:word.clientID")}
                      </>
                    }
                    value={config?.client_id}
                  />
                  <Card.ListItem
                    label={
                      <>
                        <KeyRound size={16} />
                        {t("integrations.shared:word.clientSecret")}
                      </>
                    }
                    value={"********"}
                  />
                </Card.List>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value={"domains"} className={"px-8"}>
            <form
              className={"flex gap-4 w-full justify-between mb-6"}
              onSubmit={(e) => {
                e.preventDefault();
                addDomainHandler().then();
              }}
            >
              <div className={"w-full"}>
                <Input
                  className={"w-full text-sm"}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={t(
                    "integrations.sso:oktaSSOSettings.placeholder.eGCompanyCom",
                  )}
                />
              </div>
              <Button type={"submit"} variant={"secondaryLighter"}>
                {t("integrations.sso:oktaSSOSettings.text.addDomain")}
              </Button>
            </form>
            <div className={"flex flex-col gap-3"}>
              {config?.domains?.map((domain) => (
                <DomainVerificationCard
                  key={domain.name}
                  domain={domain}
                  connectionId={config.id}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value={"danger"} className={"px-8"}>
            <div>
              <Label>
                <div className={"flex gap-2 items-center"}>
                  <AlertOctagon size={16} />
                  {t("integrations.shared:word.deleteIntegration")}
                </div>
              </Label>
              <HelpText className={"max-w-lg mt-2"}>
                {t(
                  "integrations.sso:oktaSSOSettings.text.deletingThisIntegrationWillRemove",
                )}{" "}
                <br />{" "}
                {t(
                  "integrations.sso:oktaSSOSettings.text.ifYouDeleteTheIntegration",
                )}
              </HelpText>
            </div>
            <Button
              variant={"danger"}
              size={"xs"}
              className={"mt-3"}
              onClick={deleteIntegration}
            >
              {t("integrations.shared:word.deleteIntegration")}
            </Button>
          </TabsContent>
        </Tabs>
      </ModalContent>
    </Modal>
  );
};
