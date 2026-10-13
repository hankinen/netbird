import FullTooltip from "@components/FullTooltip";
import { Label } from "@components/Label";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@utils/helpers";
import { isLocalDev, isProduction } from "@utils/netbird";
import { isEmpty } from "lodash";
import { GlobeIcon } from "lucide-react";
import React, { useMemo } from "react";
import RoundedFlag from "@/assets/countries/RoundedFlag";
import { useCountries } from "@/contexts/CountryProvider";
import { t } from "@/i18n";
import { ActivityEvent } from "@/interfaces/ActivityEvent";
type Props = {
  event: ActivityEvent;
};

export default function ActivityDescription({ event }: Props) {
  const m = event.meta;
  const meta = useMemo(() => {
    if (event.meta) {
      return Object.keys(event.meta)
        .map((key) => {
          if (!event.meta[key]) return;
          if (key == "peer_groups") return;
          if (key.includes("id")) return;
          if (key.includes("time")) return;
          return {
            key,
            value: event.meta[key],
          };
        })
        .filter((item) => item !== undefined);
    }
  }, [event.meta]);

  if (!m) return null;

  /**
   * Setup Key
   */

  if (event.activity_code == "setupkey.revoke")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.setupKey")}{" "}
        <Value> {m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withKey")}{" "}
        <Value>{m.key}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRevoked")}
      </div>
    );

  if (event.activity_code == "setupkey.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.setupKey")}{" "}
        <Value> {m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withKey")}{" "}
        <Value>{m.key}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "setupkey.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.setupKey")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withKey")}{" "}
        <Value>{m.key}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "peer.setupkey.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value> <PeerConnectionInfo meta={m} />{" "}
        {t(
          "activity.description:activityDescription.text.wasAddedWithTheNetBird",
        )}{" "}
        <Value>{m.ip}</Value>{" "}
        {t("activity.description:activityDescription.text.usingTheSetupKey")}{" "}
        <Value>{m.setup_key_name}</Value>
      </div>
    );

  if (event.activity_code == "setupkey.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.group}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRemovedFromThe")}{" "}
        <Value>{m.setupkey}</Value>{" "}
        {t("activity.description:activityDescription.text.setupKey2")}
      </div>
    );

  if (event.activity_code == "setupkey.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.group}</Value>{" "}
        {t("activity.description:activityDescription.text.wasAddedToThe")}{" "}
        <Value>{m.setupkey}</Value>{" "}
        {t("activity.description:activityDescription.text.setupKey2")}
      </div>
    );

  /**
   * Dashboard
   */
  if (event.activity_code == "dashboard.login")
    return (
      <div className={"inline"}>
        <Value>{m.username}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.loggedInToTheDashboard",
        )}
      </div>
    );

  /**
   * Policy
   */

  if (event.activity_code == "policy.update")
    return (
      <div className={"inline"}>
        {t("common:word.policy")} <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.hasBeenUpdated")}
      </div>
    );

  if (event.activity_code == "policy.delete")
    return (
      <div className={"inline"}>
        {t("common:word.policy")} <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "policy.add")
    return (
      <div className={"inline"}>
        {t("common:word.policy")} <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  /**
   * Route
   */

  if (event.activity_code == "route.delete") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.route")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withThe")}{" "}
        {hasDomains
          ? t("activity.description:activityDescription.text.domainS")
          : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains
          ? ""
          : t("activity.description:activityDescription.text.range")}{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );
  }

  if (event.activity_code == "route.update") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.route")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withThe")}{" "}
        {hasDomains
          ? t("activity.description:activityDescription.text.domainS")
          : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains
          ? ""
          : t("activity.description:activityDescription.text.range")}{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );
  }

  if (event.activity_code == "route.add") {
    let hasDomains = m?.domains && m?.domains.length > 0;
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.route")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withThe")}{" "}
        {hasDomains
          ? t("activity.description:activityDescription.text.domainS")
          : ""}{" "}
        <Value>{hasDomains ? m?.domains : m.network_range}</Value>{" "}
        {hasDomains
          ? ""
          : t("activity.description:activityDescription.text.range")}{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );
  }

  /**
   * User
   */

  if (event.activity_code == "user.peer.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value> <PeerConnectionInfo meta={m} />{" "}
        {t("activity.description:activityDescription.text.withNetBirdIP")}{" "}
        <Value>{m.ip}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "user.peer.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value> <PeerConnectionInfo meta={m} />{" "}
        {t(
          "activity.description:activityDescription.text.wasAddedWithTheNetBird",
        )}{" "}
        <Value>{m.ip}</Value>
      </div>
    );

  if (event.activity_code == "user.peer.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value> <PeerConnectionInfo meta={m} />{" "}
        {t("activity.description:activityDescription.text.withNetBirdIP")}{" "}
        <Value>{m.ip}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );

  if (event.activity_code == "user.join")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{m.username}</Value>{" "}
        {t("activity.description:activityDescription.text.joinedNetBird")}
      </div>
    );

  if (event.activity_code == "user.invite")
    return (
      <div className={"inline"}>
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasInvited")}
      </div>
    );

  if (event.activity_code == "user.create")
    return (
      <div className={"inline"}>
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreatedBy")}{" "}
        <Value>
          {event?.initiator_name ||
            t("activity.description:activityDescription.text.netBird")}
        </Value>
      </div>
    );

  if (event.activity_code == "user.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.group}</Value>{" "}
        {t("activity.description:activityDescription.text.wasAddedToUser")}{" "}
        <Value>{event.meta.username}</Value>
      </div>
    );

  if (event.activity_code == "user.block")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasBlocked")}
      </div>
    );

  if (event.activity_code == "user.unblock")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUnblocked")}
      </div>
    );

  if (event.activity_code == "user.delete")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "user.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.group}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRemovedFromUser")}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.role.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.role")}{" "}
        <Value>{event.meta.role}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdatedOfUser")}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.approve")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasApproved")}
      </div>
    );

  if (event.activity_code == "user.reject")
    return (
      <div className={"inline"}>
        {t("common:word.user")} <Value>{event.meta.username}</Value>{" "}
        <Value>{event.meta.email}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRejected")}
      </div>
    );

  if (event.activity_code == "user.password.change")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.passwordWasChangedForUser",
        )}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  /**
   * User Invite Link
   */

  if (event.activity_code == "user.invite.link.create")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteLinkWasCreatedFor",
        )}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.accept")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteLinkWasAcceptedBy",
        )}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.regenerate")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteLinkWasRegeneratedFor",
        )}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  if (event.activity_code == "user.invite.link.delete")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteLinkWasDeletedFor",
        )}{" "}
        <Value>{event.meta.username}</Value> <Value>{event.meta.email}</Value>
      </div>
    );

  /**
   * Service User
   */

  if (event.activity_code == "service.user.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.serviceUser")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "service.user.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.serviceUser")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  /**
   * Peer
   */

  if (event.activity_code == "peer.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.group}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasRemovedFromThePeer",
        )}{" "}
        <Value>{m.peer_ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.group}</Value>{" "}
        {t("activity.description:activityDescription.text.wasAddedToThePeer")}{" "}
        <Value>{m.peer_ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.login.expire") {
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.loginOfThePeer")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.expired")}
        {m.reason && (
          <>
            {" "}
            {t("activity.description:activityDescription.text.dueTo")}{" "}
            <Value>{m.reason}</Value>
          </>
        )}
      </div>
    );
  }

  if (event.activity_code == "peer.ssh.disable")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.sSHServerOfPeer")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDisabled")}
      </div>
    );

  if (event.activity_code == "peer.ssh.enable")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.sSHServerOfPeer")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasEnabled")}
      </div>
    );

  if (event.activity_code == "peer.login.expiration.disable")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.loginExpirationOfPeer",
        )}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDisabled")}
      </div>
    );

  if (event.activity_code == "peer.login.expiration.enable")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.loginExpirationOfPeer",
        )}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasEnabled")}
      </div>
    );

  if (event.activity_code == "peer.rename")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.peerWithTheNetBirdIP",
        )}{" "}
        <Value>{m.ip}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRenamedTo")}{" "}
        <Value>{m.name}</Value>
      </div>
    );

  if (event.activity_code == "peer.approve")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.peerWithTheNetBirdIP",
        )}{" "}
        <Value>{m.ip}</Value>{" "}
        {t("activity.description:activityDescription.text.wasApproved")}
      </div>
    );

  if (event.activity_code == "peer.ip.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.iPAddressWasUpdatedFrom",
        )}{" "}
        <Value>{m.old_ip}</Value>{" "}
        {t("activity.description:activityDescription.text.to")}{" "}
        <Value>{m.ip}</Value>
      </div>
    );

  if (event.activity_code == "peer.user.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.name}</Value> <PeerConnectionInfo meta={m} />{" "}
        {t(
          "activity.description:activityDescription.text.wasAddedWithTheNetBird",
        )}{" "}
        <Value>{m.ip}</Value>
      </div>
    );

  /**
   * Group
   */

  if (event.activity_code == "group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "group.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.old_name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasRenamedTo")}{" "}
        <Value>{event.meta.new_name}</Value>
      </div>
    );

  /**
   * Account
   */

  if (event.activity_code == "account.create")
    return (
      <div className={"inline"}>
        <Value>{event.initiator_name}</Value>{" "}
        {t("activity.description:activityDescription.text.createdAnAccount")}
      </div>
    );

  if (event.activity_code == "account.setting.peer.login.expiration.update")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.globalLoginExpirationWasUpdated",
        )}
      </div>
    );

  if (event.activity_code == "account.setting.peer.login.expiration.enable")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.globalLoginExpirationWasEnabled",
        )}
      </div>
    );

  if (event.activity_code == "account.setting.peer.login.expiration.disable")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.globalLoginExpirationWasDisabled",
        )}
      </div>
    );

  if (event.activity_code == "account.network.range.update")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.accountNetworkRangeWasUpdated",
        )}{" "}
        <Value>{m.old_network_range}</Value>{" "}
        {t("activity.description:activityDescription.text.to")}{" "}
        <Value>{m.new_network_range}</Value>
      </div>
    );

  /**
   * Nameserver
   */

  if (event.activity_code == "nameserver.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.nameserver")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasAdded")}
      </div>
    );

  if (event.activity_code == "nameserver.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.nameserver")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "nameserver.group.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.nameserver")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );

  /**
   * Personal Access Token
   */

  if (event.activity_code == "personal.access.token.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.accessToken")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.forUser")}{" "}
        <Value>{event.meta.username}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "personal.access.token.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.accessToken")}{" "}
        <Value>{event.meta.name}</Value>{" "}
        {t("activity.description:activityDescription.text.forUser")}{" "}
        <Value>{event.meta.username}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  /**
   * Integration
   */

  if (event.activity_code == "integration.create") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationCreated",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationCreated2")}
      </div>
    );
  }

  if (event.activity_code == "integration.delete") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationDeleted",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationDeleted2")}
      </div>
    );
  }

  if (event.activity_code == "integration.update") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationUpdated",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationUpdated2")}
      </div>
    );
  }

  if (event.activity_code == "integration.enable") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationEnabled",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationEnabled2")}
      </div>
    );
  }

  if (event.activity_code == "integration.disable") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationDisabled",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.integrationDisabled2",
        )}
      </div>
    );
  }

  if (event.activity_code == "integration.disable-by-system") {
    if (!event.meta.platform)
      return t(
        "activity.description:activityDescription.text.integrationDisabledBySystem",
      );
    return (
      <div className={"inline"}>
        <Value className={"capitalize"}>{event.meta.platform}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.integrationDisabledBySystem2",
        )}
        {event.meta.reason && (
          <>
            {" "}
            {t("activity.description:activityDescription.text.dueTo")}{" "}
            <Value>{event.meta.reason}</Value>
          </>
        )}
      </div>
    );
  }

  /**
   * DNS
   */

  if (event.activity_code == "dns.setting.disabled.management.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.group}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasAddedToDisabledDNS",
        )}
      </div>
    );

  if (event.activity_code == "dns.setting.disabled.management.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{event.meta.group}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasRemovedFromDisabledDNS",
        )}
      </div>
    );

  /**
   * Posture Checks
   */

  if (event.activity_code == "posture.check.updated")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.postureCheck")}{" "}
        <Value> {m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );

  if (event.activity_code == "posture.check.created")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.postureCheck")}{" "}
        <Value> {m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "posture.check.deleted")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.postureCheck")}{" "}
        <Value> {m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "transferred.owner.role")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.ownerRoleWasTransferred",
        )}
      </div>
    );

  /**
   * EDR
   */
  if (event.activity_code == "integrated-validator.api.created")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationCreated2")}
      </div>
    );

  if (event.activity_code == "integrated-validator.api.updated")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationUpdated2")}
      </div>
    );

  if (event.activity_code == "integrated-validator.api.deleted")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationDeleted2")}
      </div>
    );

  if (event.activity_code == "integrated-validator.api.enabled")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integrationEnabled2")}
      </div>
    );

  if (event.activity_code == "integrated-validator.api.disabled")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.integrationDisabled2",
        )}
      </div>
    );

  if (event.activity_code == "integrated-validator.api.disabled-by-system")
    return (
      <div className={"inline"}>
        <Value>{m?.platform}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.integrationDisabledBySystem2",
        )}
        {m?.reason && (
          <>
            {" "}
            {t("activity.description:activityDescription.text.dueTo")}{" "}
            <Value>{m.reason}</Value>
          </>
        )}
      </div>
    );

  if (event.activity_code == "integrated-validator.host-check.approved")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peerApprovedBy")}{" "}
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integration")}
      </div>
    );

  if (event.activity_code == "integrated-validator.host-check.denied")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peerRejectedBy")}{" "}
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integration")}
      </div>
    );

  if (event.activity_code == "integrated-validator.peer.compliance-bypassed")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m?.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withTheNetBirdIP")}{" "}
        <Value>{m?.ip}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.complianceBypassedFor",
        )}{" "}
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integration")}
        {m?.original_reason && (
          <>
            {" "}
            {t(
              "activity.description:activityDescription.text.originalNonCompliantReason",
            )}{" "}
            <Value>{m?.original_reason}</Value>)
          </>
        )}
      </div>
    );

  if (
    event.activity_code == "integrated-validator.peer.compliance-bypass-revoked"
  )
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m?.name}</Value>{" "}
        {t("activity.description:activityDescription.text.withTheNetBirdIP")}{" "}
        <Value>{m?.ip}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.complianceBypassRevokedFor",
        )}{" "}
        <Value>{m?.platform}</Value>{" "}
        {t("activity.description:activityDescription.text.integration")}
      </div>
    );

  /**
   * Resource
   */
  if (event.activity_code == "resource.group.add")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.addedToResource")}
        {"  "}
        <Value>{m.resource_name}</Value>
      </div>
    );

  if (event.activity_code == "resource.group.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.group")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.removedFromResource")}
        {"  "}
        <Value>{m.resource_name}</Value>
      </div>
    );

  /**
   * Reverse Proxy
   */

  if (event.activity_code == "service.peer.expose")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.peer_name}</Value>{" "}
        {t("activity.description:activityDescription.text.exposedService")}{" "}
        <Value>{m.domain}</Value>{" "}
        {t("activity.description:activityDescription.text.withAuth")}{" "}
        <Value>
          {m.auth
            ? t("activity.description:activityDescription.text.enabled")
            : t("common:word.disabled")}
        </Value>
      </div>
    );

  if (event.activity_code == "service.peer.unexpose")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.peer")}{" "}
        <Value>{m.peer_name}</Value>{" "}
        {t("activity.description:activityDescription.text.unexposedService")}{" "}
        <Value>{m.domain}</Value>
      </div>
    );

  if (event.activity_code == "service.peer.expose.expire")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.service")}{" "}
        <Value>{m.domain}</Value>{" "}
        {t("activity.description:activityDescription.text.exposedByPeer")}{" "}
        <Value>{m.peer_name}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasRemovedDueToRenewal",
        )}
      </div>
    );

  /**
   * Networks
   */

  if (event.activity_code == "network.resource.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.resource")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.createdForNetwork")}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.resource.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.resource")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.updatedForNetwork")}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.resource.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.resource")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.deletedFromNetwork")}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.create")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.routingPeerCreatedForNetwork",
        )}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.delete")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.routingPeerDeletedFromNetwork",
        )}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.router.update")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.routingPeerUpdatedFromNetwork",
        )}
        {"  "}
        <Value>{m.network_name}</Value>
      </div>
    );

  if (event.activity_code == "network.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.networkWithName")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.created")}
      </div>
    );

  if (event.activity_code == "network.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.networkWithName")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.deleted")}
      </div>
    );

  if (event.activity_code == "network.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.networkWithName")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.updated")}
      </div>
    );

  /**
   * Jobs
   */

  if (event.activity_code == "peer.job.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.remoteJob")}{" "}
        <Value>{m.job_type}</Value>{" "}
        {t("activity.description:activityDescription.text.createdForPeer")}{" "}
        <Value>{m.for_peer_name}</Value>
      </div>
    );

  /**
   * Flow Settings
   */

  if (event.activity_code == "account.settings.extra.flow.group.remove")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.limitTrafficEventGroup",
        )}{" "}
        <Value>{m.group_name}</Value>{" "}
        {t("activity.description:activityDescription.text.removed")}
      </div>
    );

  if (event.activity_code == "account.settings.extra.flow.group.add")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.limitTrafficEventGroup",
        )}{" "}
        <Value>{m.group_name}</Value>{" "}
        {t("activity.description:activityDescription.text.added")}
      </div>
    );

  /**
   * Identity Provider
   */

  if (event.activity_code == "identityprovider.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.identityProvider")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "identityprovider.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.identityProvider")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );

  if (event.activity_code == "identityprovider.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.identityProvider")}{" "}
        <Value>{m.name}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  /**
   * Reverse Proxy
   */

  if (event.activity_code == "service.create")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.service")}{" "}
        <Value>{m.domain}</Value>{" "}
        {t("activity.description:activityDescription.text.inCluster")}{" "}
        <Value>{m.proxy_cluster}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasCreatedWithAuthentication",
        )}{" "}
        <Value>
          {m.auth
            ? t("activity.description:activityDescription.text.enabled")
            : t("common:word.disabled")}
        </Value>
      </div>
    );

  if (event.activity_code == "service.update")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.service")}{" "}
        <Value>{m.domain}</Value>{" "}
        {t("activity.description:activityDescription.text.inCluster")}{" "}
        <Value>{m.proxy_cluster}</Value>{" "}
        {t(
          "activity.description:activityDescription.text.wasUpdatedWithAuthentication",
        )}{" "}
        <Value>
          {m.auth
            ? t("activity.description:activityDescription.text.enabled")
            : t("common:word.disabled")}
        </Value>
      </div>
    );

  if (event.activity_code == "service.delete")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.service")}{" "}
        <Value>{m.domain}</Value>{" "}
        {t("activity.description:activityDescription.text.inCluster")}{" "}
        <Value>{m.proxy_cluster}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  /**
   * Distributor
   */

  if (event.activity_code == "reseller.msp.created")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.customer")}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>{" "}
        {t("activity.description:activityDescription.text.wasCreated")}
      </div>
    );

  if (event.activity_code == "reseller.activated")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.distributorAccountWasActivated",
        )}
      </div>
    );

  if (event.activity_code == "reseller.msp.deleted")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.customer")}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>{" "}
        {t("activity.description:activityDescription.text.wasDeleted")}
      </div>
    );

  if (event.activity_code == "reseller.msp.unlinked")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.customer")}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUnlinked")}
      </div>
    );

  if (event.activity_code == "reseller.msp.invite.requested")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteRequestedForCustomer",
        )}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.invite.accepted")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteAcceptedByCustomer",
        )}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.invite.declined")
    return (
      <div className={"inline"}>
        {t(
          "activity.description:activityDescription.text.inviteDeclinedByCustomer",
        )}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>
      </div>
    );

  if (event.activity_code == "reseller.msp.updated")
    return (
      <div className={"inline"}>
        {t("activity.description:activityDescription.text.customer")}{" "}
        <Value>{m.msp_name}</Value>{" "}
        {t("activity.description:activityDescription.text.withDomain")}{" "}
        <Value>{m.msp_domain}</Value>{" "}
        {t("activity.description:activityDescription.text.wasUpdated")}
      </div>
    );

  return (
    <div className={"flex gap-2.5 items-center"}>
      <span className={"mb-[1px]"}>{event.activity}</span>

      {isLocalDev() && !isProduction() && (
        <FullTooltip
          content={
            <div className={"pb-1"}>
              <Label className={"mb-3"}>
                {t(
                  "activity.description:activityDescription.text.activityCode",
                )}
              </Label>
              <Value>{event.activity_code}</Value>
              <Label className={"my-3"}>
                {t("activity.description:activityDescription.text.meta")}
              </Label>
              {meta &&
                meta.map((item) => (
                  <React.Fragment key={item?.key}>
                    <div className={"inline"}>
                      <Value>
                        {item?.key} = {item?.value}
                      </Value>
                    </div>
                  </React.Fragment>
                ))}
            </div>
          }
        >
          <IconInfoCircle className={"text-nb-gray-500"} size={16} />
        </FullTooltip>
      )}
    </div>
  );
}

function Value({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return children ? (
    <span
      className={cn(
        "text-nb-gray-200 inline-flex gap-1 items-center max-h-[22px] font-medium bg-nb-gray-900 py-[3px] text-[11px] px-[5px] border border-nb-gray-800 rounded-[4px]",
        className,
      )}
    >
      {children}
    </span>
  ) : null;
}

function PeerConnectionInfo({ meta }: { meta: any }) {
  const hasMeta =
    !isEmpty(meta?.location_country_code) ||
    !isEmpty(meta?.location_connection_ip);
  const { countries } = useCountries();

  const countryText = useMemo(() => {
    if (!countries) return "Unknown";
    const country = countries.find(
      (c) => c.country_code === meta?.location_country_code,
    );
    if (!country) return "Unknown";
    if (!meta?.location_city_name) return country.country_name;
    return `${country.country_name}, ${meta?.location_city_name}`;
  }, [countries, meta]);

  return hasMeta ? (
    <>
      {" "}
      {t("activity.description:activityDescription.text.from")}{" "}
      {meta?.location_connection_ip && (
        <Value>{meta?.location_connection_ip}</Value>
      )}{" "}
      {meta?.location_country_code && (
        <Value>
          {isEmpty(meta?.location_country_code) ? (
            <GlobeIcon size={9} className={"text-nb-gray-300"} />
          ) : (
            <RoundedFlag country={meta?.location_country_code} size={9} />
          )}
          {countryText}
        </Value>
      )}
    </>
  ) : null;
}
