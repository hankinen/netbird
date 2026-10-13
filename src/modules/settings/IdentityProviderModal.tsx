import Button from "@components/Button";
import Code from "@components/Code";
import HelpText from "@components/HelpText";
import InlineLink from "@components/InlineLink";
import { Input } from "@components/Input";
import { Label } from "@components/Label";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalFooter,
} from "@components/modal/Modal";
import ModalHeader from "@components/modal/ModalHeader";
import { notify } from "@components/Notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/Select";
import Separator from "@components/Separator";
import { useApiCall } from "@utils/api";
import loadConfig from "@utils/config";
import { trim } from "lodash";
import {
  FingerprintIcon,
  GlobeIcon,
  IdCard,
  KeyIcon,
  PlusCircle,
  SaveIcon,
  TagIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSWRConfig } from "swr";
import { idpIcon } from "@/assets/icons/IdentityProviderIcons";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import {
  SSOIdentityProvider,
  SSOIdentityProviderOptions,
  SSOIdentityProviderRequest,
  SSOIdentityProviderType,
} from "@/interfaces/IdentityProvider";
const issuerHints: Partial<Record<SSOIdentityProviderType, string>> = {
  keycloak: "https://keycloak.example.com/realms/{REALM}",
  authentik: "https://authentik.example.com/application/o/{APP_SLUG}/",
  zitadel: "https://{INSTANCE}.zitadel.cloud",
  okta: "https://{ORG}.okta.com",
  entra: "https://login.microsoftonline.com/{TENANT_ID}/v2.0",
  pocketid: "https://pocketid.example.com",
  adfs: "https://adfs.example.com/adfs",
};

const defaultNames: Record<SSOIdentityProviderType, string> = {
  oidc: "Generic OIDC",
  google: "Google",
  microsoft: "Microsoft",
  entra: "Microsoft Entra",
  okta: "Okta",
  zitadel: "Zitadel",
  pocketid: "PocketID",
  authentik: "Authentik",
  keycloak: "Keycloak",
  adfs: "Microsoft AD FS",
};

type Props = {
  open: boolean;
  onClose: () => void;
  provider?: SSOIdentityProvider | null;
};

const config = loadConfig();
const redirectUrl = `${config.apiOrigin}/oauth2/callback`;
const logoutUrl = `${config.apiOrigin}/oauth2/logout/callback`;

export default function IdentityProviderModal({
  open,
  onClose,
  provider,
}: Readonly<Props>) {
  const { mutate } = useSWRConfig();
  const { permission } = usePermissions();
  const isEditing = !!provider;

  const createRequest = useApiCall<SSOIdentityProvider>("/identity-providers");
  const updateRequest = useApiCall<SSOIdentityProvider>(
    "/identity-providers/" + provider?.id,
  );

  const [type, setType] = useState<SSOIdentityProviderType>(
    provider?.type ?? "oidc",
  );
  const [name, setName] = useState(provider?.name ?? "");
  const [issuer, setIssuer] = useState(provider?.issuer ?? "");
  const [clientId, setClientId] = useState(provider?.client_id ?? "");
  const [clientSecret, setClientSecret] = useState("");

  const requiresIssuer = type !== "google" && type !== "microsoft";

  const clientIdChanged = isEditing && trim(clientId) !== provider?.client_id;

  const isDisabled = useMemo(() => {
    const trimmedName = trim(name);
    const trimmedIssuer = trim(issuer);
    const trimmedClientId = trim(clientId);
    const trimmedClientSecret = trim(clientSecret);

    if (trimmedName.length === 0) return true;
    if (requiresIssuer && trimmedIssuer.length === 0) return true;
    if (trimmedClientId.length === 0) return true;
    // Client secret required for new providers, or when client ID changed during edit
    if ((!isEditing || clientIdChanged) && trimmedClientSecret.length === 0)
      return true;

    return false;
  }, [
    name,
    issuer,
    clientId,
    clientSecret,
    isEditing,
    clientIdChanged,
    requiresIssuer,
  ]);

  const submit = () => {
    const payload: SSOIdentityProviderRequest = {
      type,
      name: trim(name),
      issuer: trim(issuer),
      client_id: trim(clientId),
      client_secret: trim(clientSecret),
    };

    if (isEditing) {
      notify({
        title: t(
          "settings.authentication-tab:identityProviderModal.title.updateIdentityProvider",
        ),
        description: t(
          "settings.authentication-tab:identityProviderModal.description.identityProviderWasUpdatedSuccessfully",
        ),
        promise: updateRequest.put(payload).then(() => {
          mutate("/identity-providers");
          onClose();
        }),
        loadingMessage: t(
          "settings.authentication-tab:identityProviderModal.loadingMessage.updatingIdentityProvider",
        ),
      });
    } else {
      notify({
        title: t(
          "settings.authentication-tab:identityProviderModal.title.createIdentityProvider",
        ),
        description: t(
          "settings.authentication-tab:identityProviderModal.description.identityProviderWasCreatedSuccessfully",
        ),
        promise: createRequest.post(payload).then(() => {
          mutate("/identity-providers");
          onClose();
        }),
        loadingMessage: t(
          "settings.authentication-tab:identityProviderModal.loadingMessage.creatingIdentityProvider",
        ),
      });
    }
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={(state) => !state && onClose()}
        key={open ? 1 : 0}
      >
        <ModalContent maxWidthClass={"max-w-xl"}>
          <ModalHeader
            icon={<FingerprintIcon size={20} />}
            title={
              isEditing
                ? t(
                    "settings.authentication-tab:identityProviderModal.text.editIdentityProvider",
                  )
                : t(
                    "settings.authentication-tab:identityProviderModal.text.addIdentityProvider",
                  )
            }
            description={
              isEditing
                ? t(
                    "settings.authentication-tab:identityProviderModal.text.updateTheIdentityProviderConfiguration",
                  )
                : t(
                    "settings.authentication-tab:identityProviderModal.text.configureANewIdentityProvider",
                  )
            }
            color={"netbird"}
          />

          <Separator />

          <div className={"px-8 py-6 flex flex-col gap-6"}>
            <div>
              <Label>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.providerType",
                )}
              </Label>
              <HelpText>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.selectTheTypeOfIdentity",
                )}
              </HelpText>
              <Select
                value={type}
                onValueChange={(v) => {
                  const newType = v as SSOIdentityProviderType;
                  setType(newType);
                  if (!isEditing) {
                    setName(defaultNames[newType]);
                  }
                }}
                disabled={isEditing}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      "settings.authentication-tab:identityProviderModal.placeholder.selectProviderType",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {SSOIdentityProviderOptions.map((idp) => (
                    <SelectItem key={idp.value} value={idp.value}>
                      <div className="flex items-center gap-2">
                        {idpIcon(idp.value)}
                        <span>{idp.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("common:word.name")}</Label>
              <HelpText>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.aFriendlyNameToIdentify",
                )}
              </HelpText>
              <Input
                placeholder={t(
                  "settings.authentication-tab:identityProviderModal.placeholder.eGCorporateSSO",
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                customPrefix={
                  <TagIcon size={16} className="text-nb-gray-300" />
                }
              />
            </div>

            {requiresIssuer && (
              <div>
                <Label>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.issuerURL",
                  )}
                </Label>
                <HelpText>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.theOIDCIssuerURLFor",
                  )}
                </HelpText>
                <Input
                  placeholder={
                    issuerHints[type] ??
                    t(
                      "settings.authentication-tab:identityProviderModal.text.httpsLoginExampleCom",
                    )
                  }
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  customPrefix={
                    <GlobeIcon size={16} className="text-nb-gray-300" />
                  }
                />
              </div>
            )}

            <div>
              <Label>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.clientID",
                )}
              </Label>
              <HelpText>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.theOAuth2ConfidentialClientID",
                )}
              </HelpText>
              <Input
                placeholder={t(
                  "settings.authentication-tab:identityProviderModal.placeholder.enterClientID",
                )}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                customPrefix={<IdCard size={16} className="text-nb-gray-300" />}
              />
            </div>

            <div>
              <Label>
                {t(
                  "settings.authentication-tab:identityProviderModal.text.clientSecret",
                )}
              </Label>
              <HelpText>
                {isEditing
                  ? clientIdChanged
                    ? t(
                        "settings.authentication-tab:identityProviderModal.text.requiredWhenClientIDIs",
                      )
                    : t(
                        "settings.authentication-tab:identityProviderModal.text.leaveEmptyToKeepThe",
                      )
                  : t(
                      "settings.authentication-tab:identityProviderModal.text.theOAuth2ClientSecret",
                    )}
              </HelpText>
              <Input
                type="password"
                placeholder={
                  isEditing
                    ? "••••••••"
                    : t(
                        "settings.authentication-tab:identityProviderModal.text.enterClientSecret",
                      )
                }
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                customPrefix={
                  <KeyIcon size={16} className="text-nb-gray-300" />
                }
              />
            </div>

            <Separator />

            <div className={"flex flex-col gap-3"}>
              <div>
                <Label>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.endpointURLs",
                  )}
                </Label>
                <HelpText margin={false}>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.addTheseToYourIdentity",
                  )}
                </HelpText>
              </div>

              <div>
                <Label className={"text-xs mb-1"}>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.redirectCallback",
                  )}
                </Label>
                <Code
                  codeToCopy={redirectUrl}
                  message={t(
                    "settings.identity-providers-tab:redirectUrlCopied",
                  )}
                >
                  <Code.Line>{redirectUrl}</Code.Line>
                </Code>
              </div>

              <div>
                <Label className={"text-xs mb-1"}>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.logout",
                  )}
                </Label>
                <Code
                  codeToCopy={logoutUrl}
                  message={t("settings.identity-providers-tab:logoutUrlCopied")}
                >
                  <Code.Line>{logoutUrl}</Code.Line>
                </Code>
                <HelpText margin={false} className={"mt-1.5"}>
                  {t(
                    "settings.authentication-tab:identityProviderModal.text.notAllIdentityProvidersSupport",
                  )}{" "}
                  <InlineLink
                    href={
                      "https://docs.netbird.io/selfhosted/identity-providers"
                    }
                    target={"_blank"}
                  >
                    {t("common:word.learnMore")}
                  </InlineLink>
                </HelpText>
              </div>
            </div>
          </div>

          <ModalFooter className={"items-center"}>
            <div className={"flex gap-3 w-full justify-end"}>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
              </ModalClose>

              <Button
                variant={"primary"}
                onClick={submit}
                disabled={
                  isDisabled ||
                  (isEditing
                    ? !permission.identity_providers.update
                    : !permission.identity_providers.create)
                }
              >
                {isEditing ? (
                  <>
                    <SaveIcon size={16} />
                    {t("common:word.saveChanges")}
                  </>
                ) : (
                  <>
                    <PlusCircle size={16} />
                    {t(
                      "settings.authentication-tab:identityProviderModal.text.addProvider",
                    )}
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
