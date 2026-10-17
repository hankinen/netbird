import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BREAKPOINTS, layoutModeFor, MEDIA } from "./breakpoints";

const themeDir = path.resolve(__dirname, "..");

function cssFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(p, out);
    else if (entry.name.endsWith(".css")) out.push(p);
  }
  return out;
}

describe("layoutModeFor", () => {
  it("switches exactly at the breakpoints", () => {
    expect(layoutModeFor(0)).toBe("phone");
    expect(layoutModeFor(BREAKPOINTS.compact - 1)).toBe("phone");
    expect(layoutModeFor(BREAKPOINTS.compact)).toBe("compact");
    expect(layoutModeFor(BREAKPOINTS.full - 1)).toBe("compact");
    expect(layoutModeFor(BREAKPOINTS.full)).toBe("full");
    expect(layoutModeFor(2560)).toBe("full");
  });

  it("builds the media queries from the same numbers", () => {
    expect(MEDIA.phone).toBe("(max-width: 767.98px)");
    expect(MEDIA.compact).toBe("(min-width: 768px) and (max-width: 1279.98px)");
    expect(MEDIA.full).toBe("(min-width: 1280px)");
    expect(MEDIA.belowFull).toBe("(max-width: 1279.98px)");
  });
});

describe("theme CSS uses only the contract's widths", () => {
  // Widths a theme stylesheet may query. Anything else is a second,
  // undocumented breakpoint and has to be added here on purpose.
  const allowed = new Set(
    Object.values(BREAKPOINTS).flatMap((px) => [px, px - 0.02]),
  );
  const files = cssFiles(themeDir);

  it("finds the theme stylesheets", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(path.relative(themeDir, file), () => {
      const css = fs.readFileSync(file, "utf8");
      const widths = [
        ...css.matchAll(/\((?:min|max)-width:\s*([\d.]+)px\)/g),
      ].map((m) => Number(m[1]));
      const strangers = widths.filter((w) => !allowed.has(w));
      expect(strangers, `unexpected widths in ${file}`).toEqual([]);
    });
  }
});
