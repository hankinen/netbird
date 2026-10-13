import InlineLink from "@components/InlineLink";
import SquareIcon from "@components/SquareIcon";
import AddPeerDropdown from "@components/ui/AddPeerDropdown";
import GetStartedTest from "@components/ui/GetStartedTest";
import { ExternalLinkIcon } from "lucide-react";
import * as React from "react";
import PeerIcon from "@/assets/icons/PeerIcon";
import { t } from "@/i18n";
type Props = {
  showBackground?: boolean;
};

export const NoPeersGettingStarted = ({
  showBackground = true,
}: Readonly<Props>) => {
  return (
    <GetStartedTest
      showBackground={showBackground}
      icon={
        <SquareIcon
          icon={<PeerIcon className={"fill-nb-gray-200"} size={20} />}
          color={"gray"}
          size={"large"}
        />
      }
      title={t(
        "components.core:noPeersGettingStarted.title.getStartedWithNetBird",
      )}
      description={t(
        "components.core:noPeersGettingStarted.text.itLooksLikeYouDon",
      )}
      button={<AddPeerDropdown />}
      learnMore={
        <>
          {t("components.core:noPeersGettingStarted.text.learnMoreInOur")}{" "}
          <InlineLink
            href={"https://docs.netbird.io/how-to/getting-started"}
            target={"_blank"}
          >
            {t(
              "components.core:noPeersGettingStarted.text.gettingStartedGuide",
            )}
            <ExternalLinkIcon size={12} />
          </InlineLink>
        </>
      }
    />
  );
};
