"use client";

import { DropdownMenuItem } from "@components/DropdownMenu";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { i18n, setLanguage, t } from "@/i18n";
import { languages } from "@/i18n/config";

/** Language items for the user dropdown; the choice is stored in localStorage. */
export default function LanguageDropdownItems() {
  return (
    <>
      <div
        className={
          "flex gap-3 items-center px-3 pt-2 pb-1 text-xs dark:text-nb-gray-400"
        }
      >
        <LanguagesIcon size={14} />
        {t("common:language.label")}
      </div>
      {languages.map((l) => (
        <DropdownMenuItem
          key={l.code}
          onClick={() => l.code !== i18n.language && setLanguage(l.code)}
          data-testid={`language-${l.code}`}
        >
          <div className={"flex gap-3 items-center w-full pl-[26px]"}>
            {l.label}
            {i18n.language === l.code && (
              <CheckIcon size={14} className={"ml-auto"} />
            )}
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}
