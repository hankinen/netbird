import type { Config } from "tailwindcss";

/**
 * Wraps the upstream Tailwind config without editing it (merge friendly).
 *
 * - `netbird` and `nb-gray` colours become CSS variables whose fallback is the
 *   upstream value, e.g. `rgb(var(--nb-400, 246 131 48) / <alpha-value>)`.
 *   Without the variables (dark theme, upstream light theme) every utility
 *   renders exactly the upstream colour; tokens.css sets them only under
 *   `.theme-antd:not(.dark)`.
 * - borderRadius / boxShadow scales read variables whose fallback is the
 *   Tailwind default, so again nothing changes unless the AntD theme is on.
 *   `rounded-full` / `rounded-none` are left alone.
 */
type Palette = Record<string, string>;

const PALETTES: Record<string, string> = {
  netbird: "nb",
  "nb-gray": "nbg",
};

function hexToChannels(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function toVariables(palette: Palette, prefix: string): Palette {
  return Object.fromEntries(
    Object.entries(palette).map(([shade, hex]) => [
      shade,
      `rgb(var(--${prefix}-${shade}, ${hexToChannels(hex)}) / <alpha-value>)`,
    ]),
  );
}

const RADIUS = {
  sm: ["--radius-sm", "0.125rem"],
  DEFAULT: ["--radius", "0.25rem"],
  md: ["--radius-md", "0.375rem"],
  lg: ["--radius-lg", "0.5rem"],
  xl: ["--radius-xl", "0.75rem"],
  "2xl": ["--radius-2xl", "1rem"],
  "3xl": ["--radius-3xl", "1.5rem"],
};

const SHADOW = {
  sm: ["--shadow-sm", "0 1px 2px 0 rgb(0 0 0 / 0.05)"],
  DEFAULT: [
    "--shadow",
    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  ],
  md: [
    "--shadow-md",
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  ],
  lg: [
    "--shadow-lg",
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  ],
  xl: [
    "--shadow-xl",
    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  ],
};

const asVars = (scale: Record<string, string[]>) =>
  Object.fromEntries(
    Object.entries(scale).map(([k, [v, fallback]]) => [
      k,
      `var(${v}, ${fallback})`,
    ]),
  );

export function withAntdTheme(config: Config): Config {
  const extend = { ...(config.theme?.extend ?? {}) };
  const colors = { ...((extend.colors as Record<string, Palette>) ?? {}) };
  for (const [name, prefix] of Object.entries(PALETTES)) {
    if (colors[name]) colors[name] = toVariables(colors[name], prefix);
  }
  return {
    ...config,
    theme: {
      ...config.theme,
      extend: {
        ...extend,
        colors,
        borderRadius: { ...asVars(RADIUS), ...(extend.borderRadius ?? {}) },
        boxShadow: { ...asVars(SHADOW), ...(extend.boxShadow ?? {}) },
      },
    },
  };
}
