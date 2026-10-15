import Card from "@components/Card";
import Paragraph from "@components/Paragraph";
import SquareIcon from "@components/SquareIcon";
import { LockIcon } from "lucide-react";
import * as React from "react";
import Skeleton from "react-loading-skeleton";
import { t } from "@/i18n";

// Display-time lookup for the English page names callers pass in; unknown
// names are shown unchanged.
const PAGE_LABELS: Record<string, () => string> = {
  "Access Logs": () => t("components.ui:restrictedAccess.page.accessLogs"),
  "Traffic Events": () =>
    t("components.ui:restrictedAccess.page.trafficEvents"),
  "Access Control": () =>
    t("components.ui:restrictedAccess.page.accessControl"),
  Activity: () => t("components.ui:restrictedAccess.page.activity"),
  Clusters: () => t("components.ui:restrictedAccess.page.clusters"),
  Configuration: () => t("components.ui:restrictedAccess.page.configuration"),
  "Custom Domains": () =>
    t("components.ui:restrictedAccess.page.customDomains"),
  Customers: () => t("components.ui:restrictedAccess.page.customers"),
  "DNS Settings": () => t("components.ui:restrictedAccess.page.dnsSettings"),
  "DNS Zones": () => t("components.ui:restrictedAccess.page.dnsZones"),
  "Group Information": () =>
    t("components.ui:restrictedAccess.page.groupInformation"),
  Groups: () => t("components.ui:restrictedAccess.page.groups"),
  Integrations: () => t("components.ui:restrictedAccess.page.integrations"),
  Nameservers: () => t("components.ui:restrictedAccess.page.nameservers"),
  "Peer Information": () =>
    t("components.ui:restrictedAccess.page.peerInformation"),
  Peers: () => t("components.ui:restrictedAccess.page.peers"),
  Policies: () => t("components.ui:restrictedAccess.page.policies"),
  "Posture Checks": () =>
    t("components.ui:restrictedAccess.page.postureChecks"),
  Providers: () => t("components.ui:restrictedAccess.page.providers"),
  "Service Users": () => t("components.ui:restrictedAccess.page.serviceUsers"),
  Services: () => t("components.ui:restrictedAccess.page.services"),
  Settings: () => t("components.ui:restrictedAccess.page.settings"),
  "Setup Keys": () => t("components.ui:restrictedAccess.page.setupKeys"),
  Tenants: () => t("components.ui:restrictedAccess.page.tenants"),
  "Usage & Logs": () => t("components.ui:restrictedAccess.page.usageLogs"),
  "User Information": () =>
    t("components.ui:restrictedAccess.page.userInformation"),
  Users: () => t("components.ui:restrictedAccess.page.users"),
  "this page": () => t("components.ui:restrictedAccess.page.thisPage"),
};
const pageLabel = (page: string) => PAGE_LABELS[page]?.() ?? page;

type Props = {
  children?: React.ReactNode;
  hasAccess?: boolean;
  page?: string;
};

export const RestrictedAccess = ({
  children,
  hasAccess = false,
  page = "this page",
}: Props) => {
  if (hasAccess) return children;

  return (
    <div className={"px-8"}>
      <div
        className={
          "absolute left-0 top-0 h-full w-full p-10 flex items-center justify-center mx-auto backdrop-blur-sm"
        }
      >
        <Card className={" relative overflow-hidden"}>
          <div
            className={
              "absolute z-20 bg-gradient-to-b  dark:to-nb-gray-950 dark:from-nb-gray-950/40 w-full h-full"
            }
          ></div>
          <div
            className={
              "absolute w-full h-full left-0 top-0 z-10 px-5 py-3 overflow-hidden"
            }
          >
            <div className={"flex flex-col gap-2"}>
              <Skeleton className={"w-full"} height={70} duration={4} />
              <Skeleton className={"w-full"} height={70} duration={4} />
              <Skeleton className={"w-full"} height={70} duration={4} />
              <Skeleton className={"w-full"} height={70} duration={4} />
              <Skeleton className={"w-full"} height={70} duration={4} />
            </div>
          </div>
          <div className={"w-full h-full z-20 relative left-0 top-0 flex py-8"}>
            <div className={"inline-flex justify-center w-full"}>
              <div>
                <div className={"max-w-xl relative z-50"}>
                  <div className={"text-center flex flex-col gap-2 p-8"}>
                    <div className={"mx-auto"}>
                      {" "}
                      <SquareIcon
                        icon={<LockIcon size={20} />}
                        color={"red"}
                        size={"large"}
                      />
                    </div>
                    <div className={"text-center"}>
                      <h1
                        className={"text-3xl font-medium max-w-xl mx-auto mt-3"}
                      >
                        {t(
                          "components.ui:restrictedAccess.text.youDonTHaveAccess",
                        )}{" "}
                        <br /> {pageLabel(page)}
                      </h1>
                      <Paragraph className={"justify-center my-3"}>
                        {t(
                          "components.ui:restrictedAccess.text.seemsLikeYouDonT",
                        )}
                      </Paragraph>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
