import { t } from "@/i18n";
import Button from "@components/Button";
import { cn } from "@utils/helpers";
import { isNetBirdCloud } from "@utils/netbird";
import { LockIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { PlanFeatureAvailability } from "@/cloud/cloud-hooks/useIsFeatureLocked";
import { useTrial } from "@/cloud/cloud-hooks/useTrial";
import { useMSP } from "@/cloud/msp/contexts/MSPProvider";
import { useLoggedInUser } from "@/contexts/UsersProvider";
import { PlanTier } from "@/interfaces/Subscription";
import { LockedFeatureInfoCardProps } from "@/modules/billing/locked-feature/LockedFeatureInfoCard";
import { TrialOrUpgradeButton } from "@/modules/billing/trial/TrialOrUpgradeButton";

export enum PLAN_TEXT {
  TEAM = "Available on Team",
  BUSINESS = "Available on Business",
  ENTERPRISE = "Available with an Enterprise license",
}

/** Display text for a PLAN_TEXT value; the enum value itself stays English. */
export const planText = (value: PLAN_TEXT) => {
  if (value === PLAN_TEXT.TEAM)
    return t("billing.locked-feature:planText.team");
  if (value === PLAN_TEXT.BUSINESS)
    return t("billing.locked-feature:planText.business");
  return t("billing.locked-feature:planText.enterprise");
};

export const LockedFeatureContent = ({
  feature,
  isTooltip = false,
  featureText = "This",
  isCard = false,
  offerTrial = true,
}: LockedFeatureInfoCardProps) => {
  const { isMSPInTenantContext, isAccountWithMSPParent } = useMSP();
  const { isOwnerOrAdmin } = useLoggedInUser();
  const plan = PlanFeatureAvailability[feature];

  return (
    <>
      <div className={"z-10 relative"}>
        <div
          className={cn(
            "flex items-center font-normal mb-1",
            isTooltip ? "text-sm gap-1.5" : "text-base gap-2",
          )}
        >
          <LockIcon
            size={isTooltip ? 12 : 14}
            className={cn("relative", isTooltip && "-top-[1px]")}
          />
          {isNetBirdCloud()
            ? plan == "team"
              ? planText(PLAN_TEXT.TEAM)
              : planText(PLAN_TEXT.BUSINESS)
            : planText(PLAN_TEXT.ENTERPRISE)}
        </div>
        <div
          className={cn(
            "text-nb-gray-300 font-light",
            isTooltip ? "text-xs" : "",
          )}
        >
          <AvailableOnPlanText featureText={featureText} plan={plan} />
          {isCard && <br />}
          <UpgradeOrTrialText offerTrial={offerTrial} />
        </div>
      </div>
      {(isOwnerOrAdmin || !isNetBirdCloud()) && (
        <TrialOrUpgradeButton
          plan={plan}
          feature={feature}
          variant={"primary"}
          isCard={isCard}
          isTooltip={isTooltip}
          offerTrial={offerTrial}
          hidden={isAccountWithMSPParent}
        />
      )}
      {isAccountWithMSPParent && !isMSPInTenantContext && (
        <GetMSPSupportButton />
      )}
    </>
  );
};

const AvailableOnPlanText = ({
  featureText,
  plan,
}: {
  featureText: string;
  plan: PlanTier;
}) => {
  const isOrAre = featureText.includes("Posture Checks") ? "are" : "is";
  const vars = { feature: featureText };
  const team = plan == "team";
  if (!isNetBirdCloud()) {
    if (isOrAre === "are")
      return team
        ? t("billing.locked-feature:availableSelfHosted.team.plural", vars)
        : t("billing.locked-feature:availableSelfHosted.business.plural", vars);
    return team
      ? t("billing.locked-feature:availableSelfHosted.team", vars)
      : t("billing.locked-feature:availableSelfHosted.business", vars);
  }
  if (isOrAre === "are")
    return team
      ? t("billing.locked-feature:availableCloud.team.plural", vars)
      : t("billing.locked-feature:availableCloud.business.plural", vars);
  return team
    ? t("billing.locked-feature:availableCloud.team", vars)
    : t("billing.locked-feature:availableCloud.business", vars);
};

const UpgradeOrTrialText = ({
  offerTrial = true,
}: {
  offerTrial?: boolean;
}) => {
  const {
    isMSPInTenantContext,
    isAccountWithMSPParent,
    mspContact,
    hasReseller,
  } = useMSP();
  const { isTrialAvailable } = useTrial();
  const { isOwnerOrAdmin } = useLoggedInUser();

  if (!isNetBirdCloud()) {
    return <></>;
  }

  if (hasReseller) {
    return (
      <>
        {t(
          "billing.locked-feature:lockedFeatureContent.text.contactYourAccountAdministratorTo",
        )}
      </>
    );
  }

  if (isAccountWithMSPParent && !isMSPInTenantContext) {
    return (
      <>
        {t(
          "billing.locked-feature:lockedFeatureContent.text.contactYourAccountAdministrator",
        )}{" "}
        <span className={"text-nb-gray-200 font-medium"}>{mspContact}</span>{" "}
        {t("billing.locked-feature:lockedFeatureContent.text.toUpgradeThePlan")}
      </>
    );
  }

  if (!isOwnerOrAdmin)
    return t(
      "billing.locked-feature:lockedFeatureContent.text.onlyTheOwnerOrAn",
    );

  if (isTrialAvailable && offerTrial)
    return t(
      "billing.locked-feature:lockedFeatureContent.text.upgradeOrStartA14",
    );

  return t(
    "billing.locked-feature:lockedFeatureContent.text.upgradeYourPlanToAccess",
    { value: isMSPInTenantContext ? "tenants" : "current" },
  );
};

const GetMSPSupportButton = () => {
  const { mspInfo, hasReseller } = useMSP();
  const mailToEmail = mspInfo?.parent_owner_email || "support@netbird.io";
  if (hasReseller) return;

  return (
    <div className={"relative top-1 min-w-[160px]"}>
      <a
        href={`mailto:${mailToEmail}?subject=Request%20for%20Assistance%3A%20Upgrade%20Plan`}
        className={"w-full"}
      >
        <Button
          size={"xs"}
          variant={"primary"}
          className={cn("w-full h-[34px]")}
        >
          <MailIcon size={15} className={"shrink-0"} />
          {t("billing.locked-feature:lockedFeatureContent.text.getSupport")}
        </Button>
      </a>
    </div>
  );
};
