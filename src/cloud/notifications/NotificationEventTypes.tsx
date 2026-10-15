import * as React from "react";
import { Label } from "@components/Label";
import PeerIcon from "@/assets/icons/PeerIcon";
import Card from "@components/Card";
import FancyToggleSwitch from "@components/FancyToggleSwitch";
import TeamIcon from "@/assets/icons/TeamIcon";
import IntegrationIcon from "@/assets/icons/IntegrationIcon";
import { NotificationEventType } from "@/interfaces/NotificationChannel";

import { t as i18nT } from "@/i18n";
type EventTypeMeta = {
  key: NotificationEventType;
  label: string;
  helpText: string;
  group: "peer" | "user" | "integration";
};

const EVENT_TYPE_METADATA: EventTypeMeta[] = [
  {
    key: NotificationEventType.PeerPendingApproval,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.pendingApproval");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenAPeerIs");
  },
    group: "peer",
  },
  {
    key: NotificationEventType.PeerAdd,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.peerAdded");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenANewPeer");
  },
    group: "peer",
  },
  {
    key: NotificationEventType.RoutingPeerDisconnect,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.routingPeerDisconnected");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenARoutingPeer");
  },
    group: "peer",
  },
  {
    key: NotificationEventType.RoutingPeerDelete,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.routingPeerDeleted");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenARoutingPeer2");
  },
    group: "peer",
  },
  {
    key: NotificationEventType.UserPendingApproval,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.userPendingApproval");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenAUserIs");
  },
    group: "user",
  },
  {
    key: NotificationEventType.UserJoin,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.userJoined");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenANewUser");
  },
    group: "user",
  },
  {
    key: NotificationEventType.ServiceUserCreate,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.serviceUserCreated");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenANewService");
  },
    group: "user",
  },
  {
    key: NotificationEventType.IdpSyncTokenExpire,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.idPSyncTokenExpired");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenTheIdPSync");
  },
    group: "integration",
  },
  {
    key: NotificationEventType.EdrSyncTokenExpire,
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.eDRSyncTokenExpired");
  },
    get helpText() {
    return i18nT("cloud.notifications:notificationEventTypes.helpText.notifyWhenTheEDRSync");
  },
    group: "integration",
  },
];

const GROUP_CONFIG = {
  peer: {
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.peerNotifications");
  },
    icon: <PeerIcon size={12} />,
  },
  user: {
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.userNotifications");
  },
    icon: <TeamIcon size={12} />,
  },
  integration: {
    get label() {
    return i18nT("cloud.notifications:notificationEventTypes.label.integrationNotifications");
  },
    icon: <IntegrationIcon size={12} />,
  },
} as const;

const GROUPS: Array<"peer" | "user" | "integration"> = [
  "peer",
  "user",
  "integration",
];

type Props = {
  event_types: NotificationEventType[];
  onToggle: (type: NotificationEventType) => void;
  disabled?: boolean;
};

export const NotificationEventTypes = ({ event_types, onToggle, disabled }: Props) => {
  return (
    <>
      {GROUPS.map((group) => {
        const config = GROUP_CONFIG[group];
        const types = EVENT_TYPE_METADATA.filter((t) => t.group === group);
        return (
          <div key={group} className={"flex flex-col gap-2 relative w-full"}>
            <Label>
              {config.icon}
              {config.label}
            </Label>
            <Card
              className={
                "w-full flex flex-col border-nb-gray-910 bg-nb-gray-935"
              }
            >
              {types.map((type, index) => (
                <React.Fragment key={type.key}>
                  {index > 0 && <Separator />}
                  <FancyToggleSwitch
                    value={event_types.includes(type.key)}
                    onChange={() => onToggle(type.key)}
                    disabled={disabled}
                    data-testid={`notification-event-${type.key}`}
                    label={type.label}
                    helpText={type.helpText}
                    variant={"blank"}
                    className={
                      "px-5 py-4 hover:bg-nb-gray-930 transition-colors duration-150"
                    }
                    textWrapperClassName={""}
                  />
                </React.Fragment>
              ))}
            </Card>
          </div>
        );
      })}
    </>
  );
};

const Separator = () => (
  <span className={"h-px w-full block bg-nb-gray-920"}></span>
);
