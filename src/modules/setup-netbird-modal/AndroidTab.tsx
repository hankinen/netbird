import Code from "@components/Code";
import Steps from "@components/Steps";
import TabsContentPadding, { TabsContent } from "@components/Tabs";
import { getGrpcApiOrigin } from "@utils/netbird";
import { ShoppingBagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import GooglePlayButton from "@/assets/google-play-badge.png";
import { t } from "@/i18n";
import { OperatingSystem } from "@/interfaces/OperatingSystem";
export default function AndroidTab() {
  return (
    <TabsContent value={String(OperatingSystem.ANDROID)}>
      <TabsContentPadding>
        <p className={"font-medium flex gap-3 items-center text-base"}>
          <ShoppingBagIcon size={16} />
          {t("setup-netbird-modal.main:androidTab.text.installOnAndroid")}
        </p>
        <Steps>
          <Steps.Step step={1}>
            <p>
              {t(
                "setup-netbird-modal.main:androidTab.text.downloadAndInstallTheApplication",
              )}
            </p>
            <div className={"flex gap-4 mt-1"}>
              <Link
                href={
                  "https://play.google.com/store/apps/details?id=io.netbird.client"
                }
                target={"_blank"}
              >
                <Image
                  src={GooglePlayButton}
                  alt={"Download NetBird from Google Play"}
                  height={50}
                />
              </Link>
            </div>
          </Steps.Step>
          {getGrpcApiOrigin() && (
            <Steps.Step step={2}>
              <p>
                {t(
                  "setup-netbird-modal.main:androidTab.text.clickOnChangeServerAnd",
                )}
              </p>
              <Code>
                <Code.Line>{getGrpcApiOrigin()}</Code.Line>
              </Code>
            </Steps.Step>
          )}

          <Steps.Step step={getGrpcApiOrigin() ? 3 : 2}>
            <p>
              {}
              {t(
                "setup-netbird-modal.main:androidTab.text.clickOnTheConnectButton",
              )}
            </p>
          </Steps.Step>
          <Steps.Step step={getGrpcApiOrigin() ? 4 : 3} line={false}>
            <p>
              {t(
                "setup-netbird-modal.main:androidTab.text.signUpUsingYourEmail",
              )}
            </p>
          </Steps.Step>
        </Steps>
      </TabsContentPadding>
    </TabsContent>
  );
}
