"use client";

import Button from "@components/Button";
import {
  ChevronDownIcon,
  GitPullRequestArrowIcon,
  PencilLineIcon,
} from "lucide-react";
import * as React from "react";
import { t } from "@/i18n";
import { useDraftChangeset } from "@/modules/control-center/draft/DraftChangesetContext";
import { useDraftMode } from "@/modules/control-center/draft/DraftModeContext";
import { DraftStartPopover } from "@/modules/control-center/draft/DraftStartPopover";
import { ReviewDeployModal } from "@/modules/control-center/draft/modals/ReviewDeployModal";
import { useDiscardDraft } from "@/modules/control-center/draft/useDiscardDraft";
import { ANTD_THEME_ENABLED } from "@/theme/defaultTheme";
import { GraphDot, GraphSegmented, GraphTag } from "@/theme/graph";
import { DraftModeSwitcher as UpstreamDraftModeSwitcher } from "../../../modules/control-center/draft/DraftModeSwitcher";

/**
 * Live / Draft switch with the draft's Cancel and Review & Deploy actions,
 * replacing src/modules/control-center/draft/DraftModeSwitcher.tsx through
 * its alias. The header adapter portals it into the shell's page header bar;
 * `#cc-header-actions` stays, the group panel sizes itself to it.
 * @replaces-file src/modules/control-center/draft/DraftModeSwitcher.tsx sha256:b9450c2921bb67c7
 */
export * from "../../../modules/control-center/draft/DraftModeSwitcher";

type Props = Parameters<typeof UpstreamDraftModeSwitcher>[0];

export const DraftModeSwitcher = (props: Props) =>
  ANTD_THEME_ENABLED ? (
    <ThemedDraftModeSwitcher />
  ) : (
    <UpstreamDraftModeSwitcher {...props} />
  );

function ThemedDraftModeSwitcher() {
  const { isDraft, startBlankDraft, startCurrentDraft } = useDraftMode();
  const { changeCount } = useDraftChangeset();
  const { discardAndExit, exitAfterDeploy } = useDiscardDraft();
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [startOpen, setStartOpen] = React.useState(false);
  const mode = isDraft ? "draft" : "live";

  const handleSwitch = (v: string) => {
    if (v === "draft") {
      // The tab stays on Live until the chooser gets a choice; the popover
      // owns its own closing.
      setStartOpen(true);
      return;
    }
    // Switching to live destroys the draft, so it confirms while changes exist.
    setStartOpen(false);
    void discardAndExit();
  };

  // Shown in BOTH modes so the active segment always reveals the current mode.
  const modeTabs = (withChooserChevron: boolean) => (
    <GraphSegmented
      value={mode}
      onChange={handleSwitch}
      items={[
        {
          value: "live",
          label: (
            <>
              <GraphDot tone={"on"} />
              {t(
                "control-center.draft.draft-mode-switcher:draftModeSwitcher.text.live",
              )}
            </>
          ),
          testId: "cc-mode-live",
        },
        {
          value: "draft",
          icon: PencilLineIcon,
          label: t(
            "control-center.draft.draft-mode-switcher:draftModeSwitcher.text.draft",
          ),
          trailing: (
            <>
              <GraphTag tone={"draft"}>
                {t(
                  "control-center.draft.draft-mode-switcher:draftModeSwitcher.text.beta",
                )}
              </GraphTag>
              {withChooserChevron && (
                <ChevronDownIcon
                  size={14}
                  className={startOpen ? "rotate-180" : undefined}
                  aria-hidden
                />
              )}
            </>
          ),
          testId: "cc-mode-draft",
        },
      ]}
    />
  );

  return (
    // The id lets the group panel match its width to this row via ResizeObserver.
    <div id={"cc-header-actions"} className={"nb-graph-mode"}>
      {isDraft && (
        <>
          <Button
            variant={"secondary"}
            size={"sm"}
            onClick={() => void discardAndExit()}
            data-testid={"cc-draft-cancel"}
          >
            {t("common:word.cancel")}
          </Button>
          <Button
            variant={"primary"}
            size={"sm"}
            disabled={changeCount === 0}
            onClick={() => setReviewOpen(true)}
            data-testid={"cc-draft-review"}
          >
            <GitPullRequestArrowIcon size={14} />
            {t(
              "control-center.draft.draft-mode-switcher:draftModeSwitcher.text.reviewDeploy",
            )}
            {changeCount > 0 && (
              <span className={"nb-graph-mode__count"}>{changeCount}</span>
            )}
          </Button>
          {modeTabs(false)}
        </>
      )}
      {!isDraft && (
        <DraftStartPopover
          open={startOpen}
          onOpenChange={setStartOpen}
          onStartBlank={startBlankDraft}
          onUseCurrent={startCurrentDraft}
        >
          {modeTabs(true)}
        </DraftStartPopover>
      )}

      <ReviewDeployModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onDeployed={exitAfterDeploy}
      />
    </div>
  );
}
