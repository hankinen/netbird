export const languages = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
] as const;
export type Language = (typeof languages)[number]["code"];

/** localStorage key that stores the chosen language. */
export const LANGUAGE_STORAGE_KEY = "netbird-lang";

/** Namespaces loaded before the app renders. */
export const PRELOADED_NAMESPACES = ["common", "nav"] as const;

/** Build-time default, used when neither localStorage nor the browser picks a supported language. */
export const defaultLanguage: Language =
  normalizeLanguage(process.env.NEXT_PUBLIC_DEFAULT_LANG) ?? "en";

export function normalizeLanguage(value?: string | null): Language | undefined {
  if (!value) return undefined;
  const v = value.toLowerCase();
  if (v.startsWith("zh")) return "zh-CN";
  if (v.startsWith("en")) return "en";
  return undefined;
}
