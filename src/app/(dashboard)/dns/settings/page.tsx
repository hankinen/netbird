"use client";

import Button from "@components/Button";
import Card from "@components/Card";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Label } from "@components/Label";
import { notify } from "@components/Notification";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { RestrictedAccess } from "@components/ui/RestrictedAccess";
import { IconSettings2 } from "@tabler/icons-react";
import useFetchApi, { useApiCall } from "@utils/api";
import { ExternalLinkIcon } from "lucide-react";
import React from "react";
import Skeleton from "react-loading-skeleton";
import { useSWRConfig } from "swr";
import DNSIcon from "@/assets/icons/DNSIcon";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { useHasChanges } from "@/hooks/useHasChanges";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { NameserverSettings } from "@/interfaces/NameserverSettings";
import PageContainer from "@/layouts/PageContainer";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import { useGroupIdsToGroups } from "@/modules/groups/useGroupIdsToGroups";
import { usePageHeader } from "@/theme/shell/pageHeader";
export default function NameServerSettings() {
  const { permission } = usePermissions();

  const { data: settings, isLoading } =
    useFetchApi<NameserverSettings>("/dns/settings");

  const initialDNSGroups = useGroupIdsToGroups(
    settings?.disabled_management_groups,
  );
  // @theme: page-template. Header declared to the shell (breadcrumb to the top bar,
  // title / count / help to the page header bar); see src/theme/README.md.
  const pageHelp = React.useMemo(
    () => (
      <>
        {t("dns.page:page.text.manageYourAccountSDNS")}{" "}
        <InlineLink
          href={"https://docs.netbird.io/how-to/manage-dns-in-your-network"}
          target={"_blank"}
        >
          {t("common:word.learnMore")}
          <ExternalLinkIcon size={12} />
        </InlineLink>
      </>
    ),
    [],
  );
  const pageCrumbs = React.useMemo(
    () => [
      { label: "DNS", href: "/dns", icon: <DNSIcon size={13} /> },
      {
        label: t("dns.page:page.label.dNSSettings"),
        href: "/dns/settings",
        icon: <IconSettings2 size={15} />,
      },
    ],
    [],
  );
  usePageHeader({
    title: t("dns.page:page.label.dNSSettings"),
    breadcrumb: pageCrumbs,
    help: pageHelp,
  });

  return (
    <PageContainer>
      <div className={"p-default py-6"}>
        <RestrictedAccess page={"DNS Settings"} hasAccess={permission.dns.read}>
          {!isLoading && initialDNSGroups !== undefined ? (
            <SettingDisabledManagementGroups initialGroups={initialDNSGroups} />
          ) : (
            <div>
              <Skeleton
                width={"100%"}
                className={"mt-8 max-w-xl"}
                height={240}
              />
            </div>
          )}
        </RestrictedAccess>
      </div>
    </PageContainer>
  );
}

const SettingDisabledManagementGroups = ({
  initialGroups,
}: {
  initialGroups: Group[];
}) => {
  const settingRequest = useApiCall<NameserverSettings>("/dns/settings");
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();

  const [selectedGroups, setSelectedGroups, { save: saveGroups }] =
    useGroupHelper({
      initial: initialGroups,
    });

  const { hasChanges, updateRef: updateChangesRef } = useHasChanges([
    selectedGroups,
  ]);

  const saveSettings = async () => {
    const savedGroups = await saveGroups();
    notify({
      title: t("dns.page:page.label.dNSSettings"),
      description: t("dns.page:page.description.settingsSavedSuccessfully"),
      promise: settingRequest
        .put({
          disabled_management_groups: savedGroups.map((g) => g.id),
        })
        .then(() => {
          mutate("/dns/settings");
          updateChangesRef([selectedGroups]);
        }),
      loadingMessage: t("dns.page:page.loadingMessage.savingTheSettings"),
    });
  };

  return (
    <Card className={"mt-8 max-w-xl"}>
      <div className={"px-8 py-8"}>
        <Label>{t("dns.page:page.text.disableDNSManagementForThese")}</Label>
        <HelpText>{t("dns.page:page.text.peersInTheseGroupsWill")}</HelpText>
        <PeerGroupSelector
          data-testid={"dns-groups-selector"}
          onChange={setSelectedGroups}
          values={selectedGroups}
          disabled={!permission.dns.update}
        />
      </div>
      <div
        className={
          "flex justify-end bg-nb-gray-900/20 border-t border-nb-gray-900 px-8 py-5"
        }
      >
        <Button
          variant={"primary"}
          size={"sm"}
          onClick={saveSettings}
          disabled={!hasChanges || !permission.dns.update}
          data-testid={"save-changes"}
        >
          {t("common:word.saveChanges")}
        </Button>
      </div>
    </Card>
  );
};
