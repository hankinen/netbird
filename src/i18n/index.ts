import "dayjs/locale/zh-cn";
import dayjs from "dayjs";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  defaultLanguage,
  Language,
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  PRELOADED_NAMESPACES,
} from "./config";
import { enResources, loaders, Namespace } from "./namespaces.generated";

/** Modules used on many routes (header, dialogs, providers); loaded at start. */
const SHARED_MODULES = [
  "billing",
  "cloud.main",
  "integrations.event-streaming",
  "integrations.idp-sync",
  "components",
  "users",
  "setup-netbird-modal",
  "search",
  "contexts",
  "auth",
  "hooks",
  "error",
  "account",
  "common-table-rows",
  "titles",
];

// English is bundled so t() works synchronously everywhere (tests, stories,
// fallback). Other languages are loaded per namespace on demand.
i18next.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "zh-CN"],
  defaultNS: "common",
  ns: Object.keys(enResources),
  resources: { en: enResources },
  partialBundledLanguages: true,
  keySeparator: false,
  nsSeparator: ":",
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

export const i18n = i18next;

/** Translate a key ("namespace:key"). Safe outside React; reads the current language. */
export const t = i18next.t.bind(i18next) as typeof i18next.t;

/** Language order: localStorage, browser language, NEXT_PUBLIC_DEFAULT_LANG, en. */
export function detectLanguage(): Language {
  if (typeof window === "undefined") return defaultLanguage;
  const detector = new LanguageDetector(null, {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    caches: [],
  });
  const found = detector.detect();
  const list = Array.isArray(found) ? found : found ? [found] : [];
  for (const l of list) {
    const n = normalizeLanguage(l);
    if (n) return n;
  }
  return defaultLanguage;
}

/** Load namespaces of the current language (no-op for en, which is bundled). */
export async function loadNamespaces(ns: readonly string[]) {
  const lang = i18next.language;
  const table = loaders[lang];
  if (!table) return;
  await Promise.all(
    ns.map(async (n) => {
      if (i18next.hasResourceBundle(lang, n)) return;
      const load = table[n as Namespace];
      if (!load) return;
      try {
        const mod = await load();
        i18next.addResourceBundle(lang, n, mod.default, true, true);
      } catch (e) {
        console.warn(`i18n: could not load ${lang}/${n}`, e);
      }
    }),
  );
}

/** Namespaces whose name equals a prefix or starts with "prefix.". */
export function namespacesFor(prefixes: readonly string[]): string[] {
  return Object.keys(enResources).filter((n) =>
    prefixes.some((p) => n === p || n.startsWith(p + ".")),
  );
}

/** Switch language at startup: dayjs locale, <html lang>, preloaded namespaces. */
export async function initLanguage(lang: Language) {
  await i18next.changeLanguage(lang);
  dayjs.locale(lang === "zh-CN" ? "zh-cn" : "en");
  if (typeof document !== "undefined") document.documentElement.lang = lang;
  await loadNamespaces([
    ...PRELOADED_NAMESPACES,
    ...namespacesFor(SHARED_MODULES),
  ]);
}

/** Persist the choice and reload, so every string (including ones outside React) re-renders. */
export function setLanguage(lang: Language) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  window.location.reload();
}
