"use client";

import Button from "@components/Button";
import { Callout } from "@components/Callout";
import HelpText from "@components/HelpText";
import InlineLink, { InlineButtonLink } from "@components/InlineLink";
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
import Paragraph from "@components/Paragraph";
import { HelpTooltip } from "@components/HelpTooltip";
import { PeerGroupSelector } from "@components/PeerGroupSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/Tabs";
import { useApiCall } from "@utils/api";
import { normalizeHostCIDR } from "@utils/ip";
import { useDialog } from "@/contexts/DialogProvider";
import { usePolicies } from "@/contexts/PoliciesProvider";
import { useNetworksContext } from "@/modules/networks/NetworkProvider";
import {
  ExternalLinkIcon,
  PlusCircle,
  ShieldCheck,
  WorkflowIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/Accordion";
import React, { useMemo, useRef, useState } from "react";
import { Group } from "@/interfaces/Group";
import { Network, NetworkResource } from "@/interfaces/Network";
import { Policy } from "@/interfaces/Policy";
import useGroupHelper from "@/modules/groups/useGroupHelper";
import NetworkResourceAccessControl from "@/modules/networks/resources/NetworkResourceAccessControl";
import { ResourceSingleAddressInput } from "@/modules/networks/resources/ResourceSingleAddressInput";

import { t } from "@/i18n";
type Props = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  network: Network;
  resource?: NetworkResource;
  onCreated?: (r: NetworkResource) => void;
  onUpdated?: (r: NetworkResource) => void;
  initialTab?: string;
};

export default function NetworkResourceModal({
  network,
  open,
  setOpen,
  resource,
  onUpdated,
  onCreated,
  initialTab,
}: Props) {
  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ResourceModalContent
        key={open ? "1" : "0"}
        network={network}
        resource={resource}
        onCreated={onCreated}
        onUpdated={onUpdated}
        initialTab={initialTab}
      />
    </Modal>
  );
}

export type ResourceModalResult = {
  name: string;
  description: string;
  address: string;
  groups: Group[];
};

type ModalProps = {
  onCreated?: (r: NetworkResource) => void;
  onUpdated?: (r: NetworkResource) => void;
  network: Network;
  resource?: NetworkResource;
  initialTab?: string;
  // false → no API calls: the data comes back via onSaved and the Access
  // Control tab is hidden.
  useSave?: boolean;
  onSaved?: (data: ResourceModalResult) => void;
  // Extra uniqueness names for resources that don't exist in the API yet.
  takenNames?: string[];
};

export function ResourceModalContent({
  onCreated,
  onUpdated,
  network,
  resource,
  initialTab,
  useSave = true,
  onSaved,
  takenNames,
}: ModalProps) {
  const create = useApiCall<NetworkResource>(
    `/networks/${network.id}/resources`,
  ).post;
  const update = useApiCall<NetworkResource>(
    `/networks/${network.id}/resources/${resource?.id}`,
  ).put;

  const [name, setName] = useState(resource?.name || "");
  const [description, setDescription] = useState(resource?.description || "");
  const [address, setAddress] = useState(resource?.address || "");
  const [groups, setGroups, { save: saveGroups }] = useGroupHelper({
    initial: resource?.groups || [],
  });
  const [enabled, setEnabled] = useState<boolean>(
    resource ? resource.enabled : true,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState(initialTab || "resource");
  const [addressError, setAddressError] = useState("");

  const { confirm } = useDialog();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const { createPoliciesForResource } = usePolicies();
  const {
    assignedPolicies,
    resourceExists,
    policies: allPolicies,
  } = useNetworksContext();

  const { policies: existingPolicies } = useMemo(
    () => assignedPolicies(resource, groups),
    [assignedPolicies, resource, groups],
  );

  const allResourcePolicies = useMemo(() => {
    return [...(existingPolicies || []), ...policies];
  }, [existingPolicies, policies]);

  const groupPolicyCount = useMemo(() => {
    if (!groups.length || !allPolicies) return 0;
    const groupIds = new Set(groups.map((g) => g.id));
    return allPolicies.filter((policy) => {
      const rule = policy.rules?.[0];
      if (!rule || rule.destinationResource) return false;
      const destinations = rule.destinations as (Group | string)[] | undefined;
      return destinations?.some((d) => {
        const id = typeof d === "string" ? d : d.id;
        return !!id && groupIds.has(id);
      });
    }).length;
  }, [groups, allPolicies]);

  const isAddressValid = address.length > 0 && addressError === "";

  const nameError = useMemo(() => {
    if (name === "") return "";
    // Compared case-insensitively to match resourceExists, or two drafts
    // differing only in case both validate and clash on deploy.
    const normalized = name.trim().toLowerCase();
    if (
      resourceExists(name, resource?.id) ||
      (normalized !== resource?.name?.toLowerCase() &&
        takenNames?.some((n) => n.toLowerCase() === normalized))
    )
      return t(
        "networks.resources:networkResourceModal.text.aResourceWithThisName",
      );
    return "";
  }, [name, resourceExists, resource?.id, resource?.name, takenNames]);

  const saveDraft = () => {
    onSaved?.({
      name: name.trim(),
      description,
      address: normalizeHostCIDR(address),
      groups,
    });
  };

  const confirmMissingPolicies = async () => {
    if (allResourcePolicies.length > 0) return true;
    return confirm({
      title: t(
        "networks.resources:networkResourceModal.title.noAccessControlPoliciesConfigured",
      ),
      description: t(
        "networks.resources:networkResourceModal.description.withoutAccessControlPoliciesThis",
      ),
      type: "warning",
      confirmText: resource
        ? t("common:word.saveChanges")
        : t("networks.resources:networkResourceModal.text.addResource"),
      cancelText: t("common:word.cancel"),
      maxWidthClass: "max-w-lg",
    });
  };

  const createResource = async () => {
    if (!(await confirmMissingPolicies())) return;
    const savedGroups = await saveGroups();
    const promise = create({
      name,
      description,
      address: normalizeHostCIDR(address),
      groups: savedGroups ? savedGroups.map((g) => g.id) : undefined,
      enabled,
    }).then(async (r) => {
      await createPoliciesForResource(policies, r, savedGroups);
      onCreated?.(r);
    });

    notify({
      title: t("networks.resources:networkResourceModal.title.resourceCreated"),
      description: t(
        "networks.resources:networkResourceModal.description.theResourceHasBeenCreated",
        { name },
      ),
      loadingMessage: t(
        "networks.resources:networkResourceModal.loadingMessage.creatingResource",
      ),
      promise,
    });

    return promise;
  };

  const updateResource = async () => {
    if (!(await confirmMissingPolicies())) return;
    const savedGroups = await saveGroups();
    const promise = update({
      name,
      description,
      address: normalizeHostCIDR(address),
      groups: savedGroups ? savedGroups.map((g) => g.id) : undefined,
      enabled,
    }).then(async (r) => {
      await createPoliciesForResource(policies, r, savedGroups);
      onUpdated?.(r);
    });
    notify({
      title: t("networks.resources:networkResourceModal.title.resourceUpdated"),
      description: t(
        "networks.resources:networkResourceModal.description.resourceHasBeenUpdatedSuccessfully",
        { name },
      ),
      loadingMessage: t(
        "networks.resources:networkResourceModal.loadingMessage.updatingResource",
      ),
      promise,
    });
  };

  const canCreate = useMemo(() => {
    return name.length > 0 && isAddressValid && nameError === "";
  }, [name, isAddressValid, nameError]);

  return (
    <ModalContent
      maxWidthClass={
        tab === "access-control" ? "max-w-[790px]" : "max-w-[680px]"
      }
    >
      <ModalHeader
        icon={<WorkflowIcon size={20} />}
        title={
          resource
            ? t("networks.resources:networkResourceModal.text.editResource")
            : t("networks.resources:networkResourceModal.text.addResource")
        }
        description={
          resource
            ? `${resource.name}`
            : network?.name
            ? t(
                "networks.resources:networkResourceModal.text.addNewResourceTo",
                { name: network.name },
              )
            : // No network yet on the draft canvas, so avoid an empty string.
              t("networks.resources:networkResourceModal.text.addANewResource")
        }
        color={"yellow"}
      />

      <Tabs defaultValue={tab} onValueChange={(v) => setTab(v)} value={tab}>
        <TabsList justify={"start"} className={"px-8"}>
          <TabsTrigger value={"resource"}>
            <WorkflowIcon size={16} />
            {t("networks.resources:networkResourceModal.text.resource")}
          </TabsTrigger>
          {useSave && (
            <TabsTrigger
              value={"access-control"}
              disabled={!resource && !canCreate}
            >
              <ShieldCheck size={16} />
              {t("networks.resources:networkResourceModal.text.accessControl")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={"resource"} className={"pb-4"}>
          <div className={"px-8 flex-col flex gap-6"}>
            <div>
              <Label>{t("common:word.name")}</Label>
              <HelpText>
                {t(
                  "networks.resources:networkResourceModal.text.setAnEasilyIdentifiableName",
                )}
              </HelpText>
              <Input
                ref={nameRef}
                autoFocus={true}
                tabIndex={0}
                data-testid="resource-name-input"
                placeholder={t(
                  "networks.resources:networkResourceModal.placeholder.eGPostgresDatabase",
                )}
                value={name}
                error={nameError}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <ResourceSingleAddressInput
              value={address}
              onChange={setAddress}
              onError={setAddressError}
              description={
                <>
                  {t(
                    "networks.resources:networkResourceModal.text.enterASingle",
                  )}{" "}
                  <HelpTooltip
                    content={t(
                      "networks.resources:networkResourceModal.content.aSingleHostAddressE",
                    )}
                  >
                    {t(
                      "networks.resources:networkResourceModal.text.iPAddress",
                    )}
                  </HelpTooltip>
                  ,{" "}
                  <HelpTooltip
                    content={t(
                      "networks.resources:networkResourceModal.content.toGiveAccessToAn",
                    )}
                  >
                    {t(
                      "networks.resources:networkResourceModal.text.cIDRBlock",
                    )}
                  </HelpTooltip>{" "}
                  {t("networks.resources:networkResourceModal.text.or")}{" "}
                  <HelpTooltip
                    content={t(
                      "networks.resources:networkResourceModal.content.aDNSDomainNameE",
                    )}
                  >
                    {t(
                      "networks.resources:networkResourceModal.text.domainName",
                    )}
                  </HelpTooltip>
                </>
              }
            />

            <Accordion
              type={"multiple"}
              className={"flex flex-col gap-2 -mt-2"}
            >
              <AccordionItem value={"resource-groups"}>
                <AccordionTrigger
                  className={
                    "text-[0.8rem] tracking-wider text-nb-gray-200 py-4  my-0 leading-none gap-2 flex items-center"
                  }
                  data-testid="resource-optional-settings"
                >
                  <span className={"relative top-[1px]"}>
                    {t(
                      "networks.resources:networkResourceModal.text.optionalSettings",
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className={""}>
                  <div className={"flex flex-col gap-6 pb-4 pt-2"}>
                    <div>
                      <Label>
                        {t(
                          "networks.resources:networkResourceModal.text.description",
                        )}
                      </Label>
                      <HelpText>
                        {t(
                          "networks.resources:networkResourceModal.text.writeAShortDescriptionTo",
                        )}
                      </HelpText>
                      <Input
                        placeholder={t(
                          "networks.resources:networkResourceModal.placeholder.eGProductionDevelopment",
                        )}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        data-testid="resource-description-input"
                      />
                    </div>
                    <div>
                      <Label>
                        {t(
                          "networks.resources:networkResourceModal.text.resourceGroups",
                        )}
                      </Label>
                      <HelpText className={"mt-1"}>
                        {t(
                          "networks.resources:networkResourceModal.text.addThisResourceToA",
                        )}{" "}
                        <br />{" "}
                        {t(
                          "networks.resources:networkResourceModal.text.inAccessPoliciesToSimplify",
                        )}
                      </HelpText>
                      <PeerGroupSelector
                        side={"top"}
                        onChange={setGroups}
                        values={groups}
                        showPeerCounter={false}
                        placeholder={t(
                          "networks.resources:networkResourceModal.placeholder.addOrSelectResourceGroup",
                        )}
                        policies={allPolicies}
                      />
                      {groupPolicyCount > 0 && (
                        <Callout variant={"info"} className={"mt-3"}>
                          {t(
                            "networks.resources:networkResourceModal.text.yourSelectedResourceGroupsAre",
                          )}{" "}
                          <span className="text-white font-medium">
                            {groupPolicyCount}{" "}
                            {t(
                              "networks.resources:networkResourceModal.text.accessControl",
                            )}{" "}
                            {groupPolicyCount === 1
                              ? t("common:word.policy")
                              : t("common:word.policies")}
                          </span>
                          {t(
                            "networks.resources:networkResourceModal.text.thisResourceWillInheritAccess",
                          )}{" "}
                          {groupPolicyCount === 1
                            ? t(
                                "networks.resources:networkResourceModal.text.thisPolicy",
                              )
                            : t(
                                "networks.resources:networkResourceModal.text.thesePolicies",
                              )}
                          .
                          {useSave && (isAddressValid || resource) ? (
                            <>
                              {" "}
                              {t(
                                "networks.resources:networkResourceModal.text.pleaseReviewThemInThe",
                              )}{" "}
                              <InlineButtonLink
                                onClick={() => setTab("access-control")}
                                variant={"dashed"}
                              >
                                {t(
                                  "networks.resources:networkResourceModal.text.accessControl",
                                )}
                              </InlineButtonLink>{" "}
                              {t(
                                "networks.resources:networkResourceModal.text.tab",
                              )}
                            </>
                          ) : useSave ? (
                            t(
                              "networks.resources:networkResourceModal.text.pleaseReviewThemInThe2",
                            )
                          ) : (
                            // Draft has no Access Control tab.
                            t(
                              "networks.resources:networkResourceModal.text.reviewThemOnTheCanvas",
                            )
                          )}
                        </Callout>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>

        {/* Draft never mounts this tab: its policies live in local state that
            saveDraft discards, so they would be silently lost. */}
        {useSave && (
          <TabsContent value={"access-control"} className={"pb-8"}>
            <NetworkResourceAccessControl
              existingPolicies={existingPolicies || []}
              newPolicies={policies}
              onNewPoliciesChange={setPolicies}
              address={address}
              resourceName={name}
              resourceId={resource?.id}
              hasResourceGroups={groups.length > 0}
            />
          </TabsContent>
        )}
      </Tabs>

      <ModalFooter className={"items-center"}>
        <div className={"w-full"}>
          <Paragraph className={"text-sm mt-auto"}>
            {t("common:word.learnMoreAbout")}
            <InlineLink
              href={"https://docs.netbird.io/how-to/networks#resources"}
              target={"_blank"}
            >
              {t("common:word.resources")}
              <ExternalLinkIcon size={12} />
            </InlineLink>
          </Paragraph>
        </div>
        <div className={"flex gap-3 w-full justify-end"}>
          {!useSave ? (
            <>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
              </ModalClose>
              <ModalClose asChild={true}>
                <Button
                  variant={"primary"}
                  data-testid={"submit-resource"}
                  onClick={saveDraft}
                  disabled={!canCreate}
                >
                  {resource
                    ? t("common:word.saveChanges")
                    : t(
                        "networks.resources:networkResourceModal.text.addResource",
                      )}
                </Button>
              </ModalClose>
            </>
          ) : !resource ? (
            <>
              {tab === "resource" && (
                <>
                  <ModalClose asChild={true}>
                    <Button variant={"secondary"}>
                      {t("common:word.cancel")}
                    </Button>
                  </ModalClose>
                  <Button
                    variant={"primary"}
                    data-testid="resource-continue"
                    onClick={() => setTab("access-control")}
                    disabled={!canCreate}
                  >
                    {t("common:word.continue")}
                  </Button>
                </>
              )}

              {tab === "access-control" && (
                <>
                  <Button
                    variant={"secondary"}
                    onClick={() => setTab("resource")}
                  >
                    {t("common:word.back")}
                  </Button>
                  <Button
                    variant={"primary"}
                    data-testid={"submit-resource"}
                    onClick={createResource}
                    disabled={!canCreate}
                  >
                    <PlusCircle size={16} />
                    {t(
                      "networks.resources:networkResourceModal.text.addResource",
                    )}
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <ModalClose asChild={true}>
                <Button variant={"secondary"}>{t("common:word.cancel")}</Button>
              </ModalClose>
              <Button
                variant={"primary"}
                data-testid={"submit-route"}
                onClick={updateResource}
                disabled={!canCreate}
              >
                {t("common:word.saveChanges")}
              </Button>
            </>
          )}
        </div>
      </ModalFooter>
    </ModalContent>
  );
}
