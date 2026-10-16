import Button from "@components/Button";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Modal, ModalContent, ModalFooter } from "@components/modal/Modal";
import { notify } from "@components/Notification";
import {
  SelectDropdown,
  SelectOption,
} from "@components/select/SelectDropdown";
import Steps from "@components/Steps";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/Tooltip";
import { GradientFadedBackground } from "@components/ui/GradientFadedBackground";
import { Mark } from "@components/ui/Mark";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import {
  ExternalLinkIcon,
  Globe,
  GlobeIcon,
  InfoIcon,
  KeyRound,
  PencilLine,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import firehoseLogo from "@/assets/integrations/firehose.png";
import { t } from "@/i18n";
import { EventStream } from "@/interfaces/EventStream";
import { AmazonRegions } from "@/modules/integrations/event-streaming/amazon/AmazonRegions";
import {
  exampleAwsAccessKeyId,
  exampleAwsSecretAccessKey,
} from "@/modules/integrations/event-streaming/amazon/exampleCredentials";
import { IntegrationModalHeader } from "@/modules/integrations/IntegrationModalHeader";
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function FirehoseSetup({
  open,
  onOpenChange,
  onSuccess,
}: Readonly<Props>) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} key={open ? 1 : 0}>
      <SetupContent
        onSuccess={() => {
          onOpenChange(false);
          onSuccess && onSuccess();
        }}
      />
    </Modal>
  );
}

type ModalProps = {
  onSuccess: () => void;
};

export function SetupContent({ onSuccess }: Readonly<ModalProps>) {
  const { mutate } = useSWRConfig();

  const integrationRequest = useApiCall<EventStream>(
    "/integrations/event-streaming",
    true,
  );

  const firehoseRegions = AmazonRegions.map((region) => {
    return {
      label: region.name,
      value: region.code,
      icon: region.icon,
    } as SelectOption;
  });

  const iamDashboardURL = "https://console.aws.amazon.com/iam/home";
  const iamDocsURL =
    "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html";
  const firehoseDashboardURL = "https://console.aws.amazon.com/firehose/home";

  const [selectedRegion, setSelectedRegion] = useState(
    firehoseRegions[0].value,
  );

  const changeRegion = (region: string) => {
    setSelectedRegion(region);
  };

  const [secretKey, setSecretKey] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const accessKeyPlaceholder = useMemo(exampleAwsAccessKeyId, []);
  const secretKeyPlaceholder = useMemo(exampleAwsSecretAccessKey, []);
  const [streamName, setStreamName] = useState("");
  const [region, setRegion] = useState(firehoseRegions[0].value);
  const [step, setStep] = useState(1);

  const secretKeyEntered = secretKey.length > 0 && secretKey != "";
  const accessKeyEntered = accessKey.length > 0 && accessKey != "";
  const streamNameEntered = streamName.length > 0 && streamName != "";
  const regionEntered = region.length > 0 && region != "";

  const dataEntered =
    secretKeyEntered && accessKeyEntered && streamNameEntered && regionEntered;

  const connect = async () => {
    notify({
      title: t(
        "integrations.event-streaming:firehose.title.amazonDataFirehoseIntegration",
      ),
      description: t(
        "integrations.event-streaming:firehoseSetup.description.amazonDataFirehoseWasSuccessfully",
      ),
      promise: integrationRequest
        .post({
          platform: "firehose",
          config: {
            access_key: accessKey,
            secret_key: secretKey,
            stream_name: streamName,
            region: selectedRegion,
          },
          enabled: true,
        })
        .then(() => {
          mutate("/integrations/event-streaming");
          onSuccess();
        }),
      loadingMessage: t(
        "integrations.event-streaming:firehoseSetup.loadingMessage.settingUpIntegration",
      ),
    });
  };

  return (
    <ModalContent
      maxWidthClass={cn("relative", step === 1 ? "max-w-md" : "max-w-lg")}
      showClose={true}
      onEscapeKeyDown={(e) => step > 1 && e.preventDefault()}
      onInteractOutside={(e) => step > 1 && e.preventDefault()}
      onPointerDownOutside={(e) => step > 1 && e.preventDefault()}
    >
      <GradientFadedBackground />

      <IntegrationModalHeader
        image={firehoseLogo}
        title={t(
          "integrations.event-streaming:firehoseSetup.title.connectNetBirdWithAmazonData",
        )}
        description={t(
          "integrations.event-streaming:firehoseSetup.description.startStreamingYourNetBirdAudit",
        )}
      />

      {step == 1 && (
        <div className={"px-8 py-3 flex flex-col mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <GlobeIcon size={16} />
            {t(
              "integrations.event-streaming:firehoseSetup.text.selectYourAmazonDataFirehose",
            )}
          </p>
          <p className={"mb-3 mt-2"}>
            {t(
              "integrations.event-streaming:firehoseSetup.text.toIdentifyWhichRegionYou",
            )}{" "}
            <InlineLink
              href={firehoseDashboardURL}
              target={"_blank"}
              variant={"default"}
              className={"inline"}
            >
              {t(
                "integrations.event-streaming:firehoseSetup.text.amazonDataFirehoseDashboard",
              )}
            </InlineLink>
          </p>
          <SelectDropdown
            value={selectedRegion}
            onChange={changeRegion}
            options={firehoseRegions}
            showValues={true}
          />
          <div className={"mt-3 hidden"}>
            <Input
              type={"text"}
              className={"w-full"}
              customPrefix={
                <div className={"flex items-center gap-2"}>
                  <Globe size={16} className={"text-nb-gray-300"} />
                </div>
              }
              placeholder={t(
                "integrations.event-streaming:firehoseSetup.placeholder.euCentral1",
              )}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          <div className={"mb-3"}></div>
        </div>
      )}
      {step == 2 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={16} />
            {t(
              "integrations.event-streaming:firehoseSetup.text.createYourFirehoseStream",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.navigateToTheAmazonData",
                )}
              </p>
              <div className={"flex gap-4"}>
                <Link href={firehoseDashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    {t(
                      "integrations.event-streaming:firehoseSetup.text.amazonDataFirehoseStreamDashboard",
                    )}
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p className={"font-normal"}>
                {t("common:word.click")} <Mark>Create Firehose stream</Mark>{" "}
                {t(
                  "integrations.event-streaming:firehoseSetup.text.atTheTopRightCorner",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t("integrations.event-streaming:firehoseSetup.text.asSource")}{" "}
                <Mark>Source</Mark>
                {t("integrations.shared:word.select")} <Mark>Direct PUT</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t("integrations.event-streaming:firehoseSetup.text.asSource")}{" "}
                <Mark>Destination</Mark>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.selectTheAWSServiceYou",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={5}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.giveItADescriptiveName",
                )}{" "}
                <Mark copy>netbird-activity-events</Mark>
                {t("integrations.shared:word.andClick")}{" "}
                <Mark>Create Firehose stream</Mark>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon
                      size={16}
                      className={"inline-block ml-1 text-netbird"}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={"max-w-[200px] text-xs"}>
                      {t(
                        "integrations.event-streaming:firehoseSetup.text.youCanTransformAndConvert",
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </p>
            </Steps.Step>
            <Steps.Step step={6} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.enterYourFirehoseStreamName",
                )}
              </p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <PencilLine size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={t(
                    "integrations.event-streaming:firehoseSetup.text.netbirdActivityEvents",
                  )}
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                />
              </div>
            </Steps.Step>
          </Steps>
        </div>
      )}
      {step == 3 && (
        <div className={"px-8 py-3 flex flex-col gap-0 mt-4 z-0"}>
          <p className={"font-medium flex gap-3 items-center text-base"}>
            <KeyRound size={16} />
            {t(
              "integrations.event-streaming:firehoseSetup.text.createIAMCredential",
            )}
          </p>
          <Steps>
            <Steps.Step step={1}>
              <p>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.navigateToTheAmazonIAM",
                )}
              </p>
              <div className={"flex gap-4"}>
                <Link href={iamDashboardURL} passHref target={"_blank"}>
                  <Button variant={"primary"} size={"xs"}>
                    <ExternalLinkIcon size={14} />
                    {t(
                      "integrations.event-streaming:firehoseSetup.text.amazonIAMDashboard",
                    )}
                  </Button>
                </Link>
              </div>
            </Steps.Step>
            <Steps.Step step={2}>
              <p>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.createAnIAMUserFor",
                )}{" "}
                <InlineLink href={iamDocsURL} target={"_blank"}>
                  {t(
                    "integrations.event-streaming:firehoseSetup.text.amazonDocs",
                  )}
                  <ExternalLinkIcon size={12} />
                </InlineLink>
                )
              </p>
            </Steps.Step>
            <Steps.Step step={3}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.createAndAssignAPolicy",
                )}{" "}
                <Mark>firehose:PutRecord</Mark>
                {t("common:word.and")} <Mark>firehose:PutRecordBatch</Mark>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.toTheUserAndScope",
                )}
              </p>
            </Steps.Step>
            <Steps.Step step={4}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.selectTheUserAndGo",
                )}{" "}
                <Mark>Security Credentials</Mark>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.tabAndSelect",
                )}{" "}
                <Mark>Create access key</Mark>
              </p>
            </Steps.Step>
            <Steps.Step step={5}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.enterYourAccessKey",
                )}
              </p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <KeyRound size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={accessKeyPlaceholder}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
              </div>
            </Steps.Step>
            <Steps.Step step={6} line={false}>
              <p className={"font-normal"}>
                {t(
                  "integrations.event-streaming:firehoseSetup.text.enterYourSecretKey",
                )}
              </p>
              <div className={"mb-4"}>
                <Input
                  type={"text"}
                  className={"w-full"}
                  customPrefix={
                    <div className={"flex items-center gap-2"}>
                      <KeyRound size={16} className={"text-nb-gray-300"} />
                    </div>
                  }
                  placeholder={secretKeyPlaceholder}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
              </div>
            </Steps.Step>
          </Steps>
        </div>
      )}

      <ModalFooter className={"items-center gap-4"}>
        {step == 1 && (
          <Button
            variant={"primary"}
            className={"w-full"}
            disabled={!regionEntered}
            onClick={() => setStep(2)}
          >
            {t("common:word.continue")}
            <IconArrowRight size={16} />
          </Button>
        )}
        {step == 2 && (
          <>
            <Button
              variant={"secondary"}
              className={"w-full"}
              onClick={() => setStep(1)}
            >
              <IconArrowLeft size={16} />
              {t("common:word.back")}
            </Button>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={!streamNameEntered}
              onClick={() => setStep(3)}
            >
              {t("common:word.continue")}
              <IconArrowRight size={16} />
            </Button>
          </>
        )}
        {step == 3 && (
          <>
            <Button
              variant={"secondary"}
              className={"w-full"}
              onClick={() => setStep(2)}
            >
              <IconArrowLeft size={16} />
              {t("common:word.back")}
            </Button>
            <Button
              variant={"primary"}
              className={"w-full"}
              disabled={!dataEntered}
              onClick={connect}
            >
              <Repeat size={16} />
              {t("common:word.connect")}
            </Button>
          </>
        )}
      </ModalFooter>
    </ModalContent>
  );
}
