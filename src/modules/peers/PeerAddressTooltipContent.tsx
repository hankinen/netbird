import CopyToClipboardText from "@components/CopyToClipboardText";
import { ListItem } from "@components/ListItem";
import { FlagIcon, GlobeIcon, MapPin, NetworkIcon } from "lucide-react";
import * as React from "react";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import { useCountries } from "@/contexts/CountryProvider";
import { t } from "@/i18n";
import { Peer } from "@/interfaces/Peer";
type Props = {
  peer: Peer;
};
export const PeerAddressTooltipContent = ({ peer }: Props) => {
  const { isLoading, getRegionByPeer } = useCountries();

  const countryText = useMemo(() => {
    const region = getRegionByPeer(peer);
    // Display only: "Unknown" is the provider's fallback, not backend data.
    return region === "Unknown" ? t("common:word.unknownRegion") : region;
  }, [getRegionByPeer, peer]);

  return (
    <div
      className={"text-xs flex flex-col"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <ListItem
        icon={<MapPin size={14} />}
        label={t("peers.main:peerAddressTooltipContent.label.netBirdIP")}
        value={
          <CopyToClipboardText
            iconAlignment={"right"}
            message={t(
              "peers.main:peerAddressTooltipContent.message.netBirdIPHasBeenCopied",
            )}
            alwaysShowIcon={true}
          >
            {peer.ip}
          </CopyToClipboardText>
        }
      />
      {peer.ipv6 && (
        <ListItem
          icon={<MapPin size={14} />}
          label={t("peers.main:peerAddressTooltipContent.label.netBirdIPv6")}
          value={
            <CopyToClipboardText
              iconAlignment={"right"}
              message={t(
                "peers.main:peerAddressTooltipContent.message.netBirdIPv6HasBeenCopied",
              )}
              alwaysShowIcon={true}
            >
              {peer.ipv6}
            </CopyToClipboardText>
          }
        />
      )}
      <ListItem
        icon={<NetworkIcon size={14} />}
        label={t("peers.main:peerAddressTooltipContent.label.publicIP")}
        value={
          <CopyToClipboardText
            iconAlignment={"right"}
            message={t(
              "peers.main:peerAddressTooltipContent.message.publicIPHasBeenCopied",
            )}
            alwaysShowIcon={true}
          >
            {peer.connection_ip}
          </CopyToClipboardText>
        }
      />
      <ListItem
        icon={<GlobeIcon size={14} />}
        label={t("peers.main:peerAddressTooltipContent.label.domain")}
        className={
          peer?.extra_dns_labels && peer.extra_dns_labels.length > 0
            ? "items-start"
            : ""
        }
        value={
          <div className={"text-right flex flex-col gap-[6px]"}>
            <CopyToClipboardText
              iconAlignment={"right"}
              message={t(
                "peers.main:peerAddressCell.message.dNSLabelHasBeenCopied",
              )}
              className={"text-right justify-end"}
              alwaysShowIcon={true}
            >
              {peer.dns_label}
            </CopyToClipboardText>

            {peer?.extra_dns_labels?.map((label) => (
              <CopyToClipboardText
                key={label}
                className={"text-right justify-end"}
                iconAlignment={"right"}
                message={t(
                  "peers.main:peerAddressCell.message.dNSLabelHasBeenCopied",
                )}
                alwaysShowIcon={true}
              >
                {label}
              </CopyToClipboardText>
            ))}
          </div>
        }
      />
      <ListItem
        icon={<FlagIcon size={14} />}
        label={t("peers.main:peerAddressTooltipContent.label.region")}
        value={
          isLoading && !countryText ? (
            <Skeleton width={100} />
          ) : (
            <CopyToClipboardText
              iconAlignment={"right"}
              message={t(
                "peers.main:peerAddressTooltipContent.message.regionHasBeenCopiedTo",
              )}
              alwaysShowIcon={true}
            >
              {countryText}
            </CopyToClipboardText>
          )
        }
      />
    </div>
  );
};
