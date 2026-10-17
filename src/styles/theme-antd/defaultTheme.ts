/**
 * Default theme selection for the Ant Design theme (dev branch).
 *
 * NEXT_PUBLIC_DEFAULT_THEME (build time, like NEXT_PUBLIC_DEFAULT_LANG):
 *   "antd"  (default) light theme with the Ant Design look  -> <html class="light theme-antd">
 *   "light" upstream light theme                             -> <html class="light">
 *   "dark"  upstream dark theme (upstream default)           -> <html class="dark">
 *
 * The `theme-antd` class only marks the Ant Design look; ThemeProvider still
 * toggles `dark` / `light`, and every AntD rule is scoped to
 * `.theme-antd:not(.dark)`, so the dark theme stays exactly upstream.
 */
type DefaultTheme = "antd" | "light" | "dark";

const raw = process.env.NEXT_PUBLIC_DEFAULT_THEME;
export const DEFAULT_THEME_SETTING: DefaultTheme =
  raw === "light" || raw === "dark" ? raw : "antd";

export const ANTD_THEME_ENABLED = DEFAULT_THEME_SETTING === "antd";

export const DEFAULT_RESOLVED_THEME: "dark" | "light" =
  DEFAULT_THEME_SETTING === "dark" ? "dark" : "light";

export const HTML_THEME_PROPS = {
  className: ANTD_THEME_ENABLED ? "light theme-antd" : DEFAULT_RESOLVED_THEME,
  style: { colorScheme: DEFAULT_RESOLVED_THEME },
} as const;

// Outside AppLayout (Storybook, tests) nothing renders the <html> element, so
// mark it here; ThemeProvider never removes this class.
if (ANTD_THEME_ENABLED && typeof document !== "undefined") {
  document.documentElement.classList.add("theme-antd");
}
