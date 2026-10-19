"use client";

import Button from "@components/Button";
import { HelpTooltip } from "@components/HelpTooltip";
import { useGuardedRouter } from "@utils/navigation-guard";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  type PageAction,
  usePageHeaderSpec,
  usePageHeaderStore,
  useTitleHosted,
} from "./pageHeader";

/** Runs a page action: its handler, else its link through the guarded router. */
export function useRunAction() {
  const router = useGuardedRouter();
  return React.useCallback(
    (action: PageAction) => {
      if (action.onClick) action.onClick();
      else if (action.href) router.push(action.href);
    },
    [router],
  );
}

export function ActionButton({
  action,
  className,
}: {
  action: PageAction;
  className?: string;
}) {
  const run = useRunAction();
  const variant =
    action.variant === "primary"
      ? "primary"
      : action.variant === "danger"
      ? "danger"
      : "default";
  return (
    <Button
      variant={variant}
      size={"sm"}
      className={className}
      disabled={action.disabled}
      data-testid={action["data-testid"]}
      onClick={() => run(action)}
    >
      {action.icon}
      {action.label}
    </Button>
  );
}

/**
 * Title row of a page that registered a header: back arrow, title, count,
 * help icon on the left; secondary and primary actions on the right, plus
 * whatever the DataTable adapter teleports there (the actions row is the
 * "header" host of the store). Desktops and tablets only; on phones the
 * title is in the app bar and the actions in the bottom bar (shell.css
 * hides this bar there). The `nb-pageheader__extra` element, first in the
 * actions row, is the slot pages portal their own controls into
 * (usePageHeaderSlot, the control-center mode switch).
 */
export function PageHeaderBar() {
  const spec = usePageHeaderSpec();
  const store = usePageHeaderStore();
  const titleHosted = useTitleHosted();
  const setHost = React.useCallback(
    (el: HTMLDivElement | null) => store?.setHost("header", el),
    [store],
  );
  const setTitleHost = React.useCallback(
    (el: HTMLHeadingElement | null) => store?.setHost("title", el),
    [store],
  );
  if (!spec) return null;
  const primary = spec.primaryAction
    ? { ...spec.primaryAction, variant: "primary" as const }
    : undefined;
  return (
    <div className={"nb-pageheader"} data-testid={"page-header"}>
      <div className={"nb-pageheader__lead"}>
        {spec.backHref && (
          <Link
            href={spec.backHref}
            className={"nb-pageheader__back"}
            aria-label={t_back()}
          >
            <ArrowLeftIcon size={16} />
          </Link>
        )}
        <h1
          className={"nb-pageheader__title"}
          ref={setTitleHost}
          title={spec.titleText}
        >
          {titleHosted ? null : spec.title}
        </h1>
        {spec.subtitle && (
          <span className={"nb-pageheader__subtitle"}>{spec.subtitle}</span>
        )}
        {spec.count !== undefined && (
          <span className={"nb-pageheader__count"}>{spec.count}</span>
        )}
        {spec.help && (
          <HelpTooltip
            content={spec.help}
            interactive
            iconSize={14}
            triggerClassName={"nb-pageheader__help"}
          />
        )}
      </div>
      <div className={"nb-pageheader__actions"} ref={setHost}>
        <div className={"nb-pageheader__extra"} ref={store?.setSlot} />
        {spec.secondaryActions?.map((a, i) => (
          <ActionButton key={a.key ?? i} action={a} />
        ))}
        {primary && <ActionButton action={primary} />}
      </div>
    </div>
  );
}

// Lazy import keeps the i18n dependency out of the hot path of the store.
import { t } from "@/i18n";
const t_back = () => t("common:word.back");
