import Button from "@components/Button";
import Code from "@components/Code";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import Paragraph from "@components/Paragraph";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import Separator from "@components/Separator";
import { IconRepeat } from "@tabler/icons-react";
import { useApiCall } from "@utils/api";
import { cn } from "@utils/helpers";
import { trim } from "lodash";
import {
  AlarmClock,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
  MonitorSmartphoneIcon,
  PlusCircle,
  PowerOffIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import SetupKeysIcon from "@/assets/icons/SetupKeysIcon";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { SetupKey } from "@/interfaces/SetupKey";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import SetupModal from "@/modules/setup-netbird-modal/SetupModal";
type Props = {
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  name?: string;
  showOnlyRoutingPeerOS?: boolean;
  groups?: Group[];
};

const copyMessage = "Setup-Key was copied to your clipboard!";

export default function SetupKeyModal({
  children,
  open,
  setOpen,
  name,
  showOnlyRoutingPeerOS,
  groups,
}: Readonly<Props>) {
  const [successModal, setSuccessModal] = useState(false);
  const [setupKey, setSetupKey] = useState<SetupKey>();
  const [installModal, setInstallModal] = useState(false);
  const handleSuccess = (setupKey: SetupKey) => {
    setSetupKey(setupKey);
    setSuccessModal(true);
  };

  return (
    <>
      <Modal open={open} onOpenChange={setOpen} key={open ? 1 : 0}>
        {children && <ModalTrigger asChild>{children}</ModalTrigger>}
        <SetupKeyModalContent
          onSuccess={handleSuccess}
          predefinedName={name}
          groups={groups}
        />
      </Modal>

      <Modal
        open={installModal}
        onOpenChange={(state) => {
          setInstallModal(state);
          setOpen(false);
        }}
        key={installModal ? 2 : 3}
      >
        <SetupModal
          showClose={true}
          setupKey={setupKey?.key}
          showOnlyRoutingPeerOS={showOnlyRoutingPeerOS}
        />
      </Modal>

      <Modal
        open={successModal}
        onOpenChange={(open) => {
          setSuccessModal(open);
          setOpen(open);
        }}
      >
        <ModalContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          maxWidthClass={"max-w-md"}
          className={"mt-20"}
          showClose={false}
        >
          <div className={"pb-6 px-8"}>
            <div className={"flex flex-col items-center justify-center gap-3"}>
              <div>
                <h2 className={"text-2xl text-center mb-2"}>
                  {t(
                    "setup-keys.main:setupKeyModal.text.setupKeyCreatedSuccessfully",
                  )}
                </h2>
                <Paragraph className={"mt-0 text-sm text-center"}>
                  {t("setup-keys.main:setupKeyModal.text.thisKeyWillNotBe")}
                </Paragraph>
              </div>
            </div>
          </div>

          <div
            className={"px-8 pb-6"}
            data-testid={"setup-key-copy-input"}
            data-testid-setup-key-value={setupKey?.key || ""}
          >
            <Code message={copyMessage}>
              <Code.Line>
                {setupKey?.key ||
                  t("setup-keys.main:setupKeyModal.text.couldNotBeCreated")}
              </Code.Line>
            </Code>
          </div>
          <ModalFooter className={"items-center"}>
            <div className={"flex gap-3 w-full"}>
              <ModalClose asChild={true}>
                <Button
                  variant={"secondary"}
                  className={"w-full"}
                  tabIndex={-1}
                  data-testid={"setup-key-close"}
                >
                  {t("common:word.close")}
                </Button>
              </ModalClose>
              <Button
                variant={"primary"}
                className={"w-full"}
                onClick={() => setInstallModal(true)}
              >
                <DownloadIcon size={14} />
                {t("setup-keys.main:setupKeyModal.text.installNetBird")}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

type ModalProps = {
  onSuccess?: (setupKey: SetupKey) => void;
  predefinedName?: string;
  groups?: Group[];
};

export function SetupKeyModalContent({
  onSuccess,
  predefinedName = "",
  groups,
}: Readonly<ModalProps>) {
  const setupKeyRequest = useApiCall<SetupKey>("/setup-keys", true);
  const { mutate } = useSWRConfig();

  const [name, setName] = useState(predefinedName);
  const [reusable, setReusable] = useState(false);
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresIn, setExpiresIn] = useState("7");
  const [ephemeralPeers, setEphemeralPeers] = useState(false);
  const [allowExtraDNSLabels, setAllowExtraDNSLabels] = useState(false);

  const [selectedGroups, setSelectedGroups, { save: saveGroups }] =
    useGroupHelper({
      initial: groups ?? [],
    });

  const usageLimitPlaceholder = useMemo(() => {
    return reusable
      ? t("setup-keys.main:setupKeyModal.placeholder.unlimited")
      : "1";
  }, [reusable]);

  const isDisabled = useMemo(() => {
    const trimmedName = trim(name);
    return trimmedName.length === 0;
  }, [name]);

  const submit = () => {
    if (!selectedGroups) return;

    notify({
      title: t("setup-keys.main:setupKeyModal.title.createSetupKey"),
      description: t(
        "setup-keys.main:setupKeyModal.description.setupKeyCreatedSuccessfullyYou",
      ),
      promise: saveGroups().then(async (groups) => {
        return setupKeyRequest
          .post({
            name,
            type: reusable ? "reusable" : "one-off",
            expires_in: parseInt(expiresIn || "0") * 24 * 60 * 60, // Days to seconds, defaults to 7 days
            revoked: false,
            auto_groups: groups.map((group) => group.id),
            usage_limit: reusable ? parseInt(usageLimit) : 1,
            ephemeral: ephemeralPeers,
            allow_extra_dns_labels: allowExtraDNSLabels,
          })
          .then((setupKey) => {
            onSuccess && onSuccess(setupKey);
            mutate("/setup-keys");
            mutate("/groups");
          });
      }),
      loadingMessage: t(
        "setup-keys.main:setupKeyModal.loadingMessage.creatingYourSetupKey",
      ),
    });
  };

  return (
    <ModalContent maxWidthClass={"max-w-xl"}>
      <ModalHeader
        icon={<SetupKeysIcon className={"fill-netbird"} />}
        title={t("setup-keys.main:setupKeyModal.title.createNewSetupKey")}
        description={t(
          "setup-keys.main:setupKeyModal.description.useThisKeyToRegister",
        )}
        color={"netbird"}
      />

      <Separator />

      <div className={"px-8 py-6 flex flex-col gap-8"}>
        {/* Name Field */}
        <div>
          <Label>{t("common:word.name")}</Label>
          <HelpText>
            {t(
              "setup-keys.main:setupKeyModal.text.setAnEasilyIdentifiableName",
            )}
          </HelpText>
          <Input
            placeholder={t(
              "setup-keys.main:setupKeyModal.placeholder.eGAWSServers",
            )}
            value={name}
            data-testid={"setup-key-name"}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Reusable Toggle */}
        <div>
          <FancyToggleSwitch
            value={reusable}
            onChange={setReusable}
            label={
              <>
                <IconRepeat size={15} />
                {t("setup-keys.main:setupKeyModal.text.makeThisKeyReusable")}
              </>
            }
            helpText={t(
              "setup-keys.main:setupKeyModal.helpText.useThisTypeToEnroll",
            )}
          />
        </div>

        {/* Usage Limit */}
        <div className={cn("flex justify-between", !reusable && "opacity-50")}>
          <div>
            <Label>{t("setup-keys.main:setupKeyModal.text.usageLimit")}</Label>
            <HelpText className={"max-w-[200px]"}>
              {t("setup-keys.main:setupKeyModal.text.forExampleSetTo30")}
            </HelpText>
          </div>

          <Input
            min={1}
            maxWidthClass={"max-w-[200px]"}
            disabled={!reusable}
            value={usageLimit}
            type={"number"}
            data-testid={"setup-key-usage-limit"}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder={usageLimitPlaceholder}
            customPrefix={
              <MonitorSmartphoneIcon size={16} className={"text-nb-gray-300"} />
            }
            customSuffix={t("common:word.peerS")}
          />
        </div>

        {/* Expires in Days */}
        <div className={"flex justify-between"}>
          <div>
            <Label>{t("setup-keys.main:setupKeyModal.text.expiresIn")}</Label>
            <HelpText>
              {t("setup-keys.main:setupKeyModal.text.daysUntilTheKeyExpires")}
              <br />
              {t(
                "setup-keys.main:setupKeyModal.text.leaveEmptyForNoExpiration",
              )}
            </HelpText>
          </div>
          <Input
            maxWidthClass={"max-w-[202px]"}
            placeholder={t(
              "setup-keys.main:setupKeyModal.placeholder.unlimited",
            )}
            min={1}
            value={expiresIn}
            errorTooltip={true}
            type={"number"}
            data-testid={"setup-key-expire-in-days"}
            onChange={(e) => setExpiresIn(e.target.value)}
            customPrefix={
              <AlarmClock size={16} className={"text-nb-gray-300"} />
            }
            customSuffix={t("common:word.dayS")}
          />
        </div>

        {/* Ephemeral Peers Toggle */}
        <div>
          <FancyToggleSwitch
            value={ephemeralPeers}
            onChange={setEphemeralPeers}
            label={
              <>
                <PowerOffIcon size={15} />
                {t("setup-keys.main:setupKeyModal.text.ephemeralPeers")}
              </>
            }
            helpText={t(
              "setup-keys.main:setupKeyModal.helpText.peersThatAreOfflineFor",
            )}
          />
        </div>

        {/* Allow Extra DNS Labels Toggle */}
        <div>
          <FancyToggleSwitch
            value={allowExtraDNSLabels}
            onChange={setAllowExtraDNSLabels}
            label={
              <>
                <GlobeIcon size={15} />
                {t("setup-keys.main:setupKeyModal.text.allowExtraDNSLabels")}
              </>
            }
            helpText={t(
              "setup-keys.main:setupKeyModal.helpText.enableMultipleSubdomainLabelsWhen",
            )}
          />
        </div>

        {/* Auto-Assigned Groups */}
        <div>
          <Label>
            {t("setup-keys.main:setupKeyModal.text.autoAssignedGroups")}
          </Label>
          <HelpText>
            {t(
              "setup-keys.main:setupKeyGroupsCell.description.theseGroupsWillBeAutomatically",
            )}
          </HelpText>
          <PeerGroupSelector
            onChange={setSelectedGroups}
            values={selectedGroups}
            hideAllGroup={true}
          />
        </div>
      </div>

      {/* Footer */}
      <ModalFooter className={"items-center"}>
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common:word.learnMoreAbout")}
            <InlineLink
              href={
                "https://docs.netbird.io/how-to/register-machines-using-setup-keys"
              }
              target={"_blank"}
            >
              {t("common:word.setupKeys")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-3 w-full justify-end"}>
          <ModalClose asChild={true}>
            <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
          </ModalClose>

          <Button
            variant={"primary"}
            onClick={submit}
            disabled={isDisabled}
            data-testid={"create-setup-key"}
          >
            <PlusCircle size={16} />
            {t("setup-keys.main:setupKeyModal.title.createSetupKey")}
          </Button>
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
