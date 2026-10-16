import FeatureCard, { FeatureCardStatus } from "@components/FeatureCard";
import useFetchApi from "@utils/api";
import loadConfig from "@utils/config";
import { isNetBirdCloud } from "@utils/netbird";
import { ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useMemo } from "react";
import { AccountMFA } from "@/cloud/mfa/AccountMFASettings";
import { t } from "@/i18n";

export const AccountMfaCard = () => {
  const { data: accountMfa } = useFetchApi<AccountMFA>(
    "/service/mfa",
    true,
    true,
    !!loadConfig().authServiceUrl,
    {
      origin: loadConfig().authServiceUrl,
    },
  );

  const enabled = useMemo(() => {
    return accountMfa?.mfa || false;
  }, [accountMfa]);

  const router = useRouter();

  return (
    isNetBirdCloud() && (
      <FeatureCard
        onClick={() => router.push("/settings?tab=authentication")}
        aria-label={t(
          "cloud.mfa:accountMFACard.ariaLabel.multiFactorAuthenticationMFA",
        )}
        className={"min-w-[432px]"}
        icon={<ShieldCheckIcon size={16} />}
        title={t(
          "cloud.mfa:accountMFACard.ariaLabel.multiFactorAuthenticationMFA",
        )}
        action={<FeatureCardStatus enabled={enabled} />}
        description={t(
          "cloud.mfa:accountMFACard.description.enableNetBirdMFAIfNot",
        )}
      />
    )
  );
};
