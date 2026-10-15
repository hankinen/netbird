import Button from "@components/Button";
import Card from "@components/Card";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import Steps from "@components/Steps";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { ExternalLinkIcon, GlobeIcon } from "lucide-react";
import * as React from "react";
import { Callout } from "@components/Callout";
import { useReverseProxies } from "@/contexts/ReverseProxiesProvider";
import {
  REVERSE_PROXY_CLUSTERS_DOCS_LINK,
  REVERSE_PROXY_DOMAIN_VERIFICATION_LINK,
  ReverseProxyDomain,
  ReverseProxyDomainType,
} from "@/interfaces/ReverseProxy";
import Paragraph from "@components/Paragraph";
import InlineLink from "@components/InlineLink";
import { isNetBirdCloud } from "@/utils/netbird";

import { t } from "@/i18n";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: ReverseProxyDomain;
  onStartVerification: (domain: ReverseProxyDomain) => void;
  targetCluster?: string;
};

export const CustomDomainVerificationModal = ({
  open,
  onOpenChange,
  domain,
  onStartVerification,
  targetCluster,
}: Props) => {
  const { domains } = useReverseProxies();

  const handleStartVerification = () => {
    onStartVerification(domain);
    onOpenChange(false);
  };

  // Get free domains (proxy clusters) as CNAME targets
  const freeDomains =
    domains?.filter((d) => d.type === ReverseProxyDomainType.FREE) || [];

  // Use provided target cluster, or fall back to first available
  const cnameTarget = targetCluster || freeDomains[0]?.domain || "";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent maxWidthClass={"relative max-w-[600px]"} showClose={true}>
        <GradientFadedBackground />
        <ModalHeader
          icon={<GlobeIcon size={20} />}
          title={t(
            "reverse-proxy.domain:customDomainVerificationModal.title.verifyDomain",
          )}
          description={domain.domain}
          color={"netbird"}
        />
        <div className={"px-8 flex flex-col gap-0 pb-6"}>
          <Steps className={"pt-0 stepper-bg-variant"}>
            <Steps.Step step={1}>
              <p className={"font-normal"}>
                {t(
                  "reverse-proxy.domain:customDomainVerificationModal.text.signInToYourDomain",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={2} line={false}>
              <p className={"font-normal"}>
                {t(
                  "reverse-proxy.domain:customDomainVerificationModal.text.addThe",
                )}{" "}
                <Mark>CNAME record</Mark>{" "}
                {t(
                  "reverse-proxy.domain:customDomainVerificationModal.text.belowToYourDNSConfiguration",
                )}{" "}
                <Mark>{domain.domain}</Mark>
              </p>
            </Steps.Step>
          </Steps>
          <div className={"flex flex-col gap-6"}>
            {!cnameTarget ? (
              isNetBirdCloud() ? (
                <Callout variant={"warning"}>
                  {t(
                    "reverse-proxy.domain:customDomainModal.text.noProxyClustersAreCurrently",
                  )}{" "}
                  <InlineLink
                    href={"https://status.netbird.io/"}
                    target={"_blank"}
                  >
                    {t(
                      "reverse-proxy.domain:customDomainModal.text.netBirdStatus",
                    )}
                  </InlineLink>{" "}
                  {t(
                    "reverse-proxy.domain:customDomainModal.text.orReachOutTo",
                  )}
                  {"  "}
                  <InlineLink href={"mailto:support@netbird.io"}>
                    {t(
                      "reverse-proxy.domain:customDomainModal.text.supportNetbirdIo",
                    )}
                  </InlineLink>
                </Callout>
              ) : (
                <Callout variant={"warning"}>
                  {t(
                    "reverse-proxy.domain:customDomainVerificationModal.text.noProxyClustersAreCurrently",
                  )}{" "}
                  <br />
                  {t("common:word.learnMoreAbout")}{" "}
                  <InlineLink
                    href={REVERSE_PROXY_CLUSTERS_DOCS_LINK}
                    target={"_blank"}
                  >
                    {t(
                      "reverse-proxy.domain:customDomainModal.text.proxyClusters",
                    )}
                    <ExternalLinkIcon size={12} />
                  </InlineLink>
                </Callout>
              )
            ) : (
              <>
                <Card className={"w-full"}>
                  <Card.List>
                    <Card.ListItem
                      copy
                      copyText={`*.${domain.domain}`}
                      label={t(
                        "reverse-proxy.domain:customDomainVerificationModal.label.cNAMERecord",
                      )}
                      value={`*.${domain.domain}`}
                    />
                    <Card.ListItem
                      copy
                      copyText={cnameTarget}
                      label={t(
                        "reverse-proxy.domain:customDomainVerificationModal.label.cNAMEContent",
                      )}
                      value={cnameTarget}
                    />
                  </Card.List>
                </Card>

                {!targetCluster && freeDomains.length > 1 && (
                  <Callout variant={"info"}>
                    <span className="font-medium">
                      {t(
                        "reverse-proxy.domain:customDomainVerificationModal.text.availableProxyClusters",
                      )}
                    </span>{" "}
                    {freeDomains.map((d) => d.domain).join(", ")}
                    {t(
                      "reverse-proxy.domain:customDomainVerificationModal.text.chooseTheClusterClosestTo",
                    )}
                  </Callout>
                )}

                <Callout variant={"warning"}>
                  {t(
                    "reverse-proxy.domain:customDomainVerificationModal.text.dNSChangesMayTakeSome",
                  )}
                </Callout>
              </>
            )}
          </div>
        </div>
        <ModalFooter className={"items-center"}>
          <div className={"w-full"}>
            <Paragraph className={"text-sm mt-auto"}>
              {t("common:word.learnMoreAbout")}
              <InlineLink
                href={REVERSE_PROXY_DOMAIN_VERIFICATION_LINK}
                target={"_blank"}
              >
                {t(
                  "reverse-proxy.domain:customDomainVerificationModal.text.domainVerification",
                )}
                <ExternalLinkIcon size={12} />
              </InlineLink>
            </Paragraph>
          </div>
          <div className={"flex gap-3 w-full justify-end"}>
            <ModalClose asChild={true}>
              <Button variant={"secondary"} data-testid={"verify-domain-later"}>
                {t(
                  "reverse-proxy.domain:customDomainVerificationModal.text.verifyLater",
                )}
              </Button>
            </ModalClose>

            <Button
              variant={"primary"}
              onClick={handleStartVerification}
              disabled={!cnameTarget}
            >
              {t(
                "reverse-proxy.domain:customDomainVerificationModal.text.startVerification",
              )}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
