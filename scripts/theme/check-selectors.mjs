#!/usr/bin/env node
// Guards the AntD theme's class-name based selectors against upstream renames.
//
// 1. Every `@depends <file>: <token> | <token>` annotation in
//    src/styles/theme-antd/*.css must point at an existing file that still
//    contains each token verbatim.
// 2. Every `[class~="x"]` selector must still match a class token somewhere
//    under src/ (dead selector = upstream changed the component).
//    `[class*="x"]` colour-family selectors are defensive; misses are only
//    reported with --verbose.
//
// Exit code 1 lists what broke. Run: npm run theme:check-selectors
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../..",
);
const themeDir = path.join(root, "src/styles/theme-antd");
const cssFiles = fs.readdirSync(themeDir).filter((f) => f.endsWith(".css"));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (
      /\.(tsx|ts)$/.test(e.name) &&
      !/\.(test|stories)\.tsx?$/.test(e.name) &&
      !p.startsWith(themeDir)
    )
      out.push(p);
  }
  return out;
}
const sources = walk(path.join(root, "src")).map((f) =>
  fs.readFileSync(f, "utf8"),
);
const corpus = sources.join("\n");

const errors = [];
const warnings = [];
let depends = 0;
let attrs = 0;

for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(themeDir, file), "utf8");

  for (const m of css.matchAll(/@depends\s+(.+?):\s+(.+?)(?=\*\/|\n|$)/g)) {
    const target = m[1].trim();
    if (target.startsWith("<")) continue; // documentation example
    const tokens = m[2]
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean);
    const abs = path.join(root, target);
    if (!fs.existsSync(abs)) {
      errors.push(`${file}: @depends file not found: ${target}`);
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    for (const t of tokens) {
      depends++;
      if (!text.includes(t))
        errors.push(`${file}: "${t}" no longer in ${target}`);
    }
  }

  // strip comments before scanning selectors
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const seen = new Set();
  for (const m of code.matchAll(/\[class([~*])="([^"]+)"\]/g)) {
    const key = m[1] + m[2];
    if (seen.has(key)) continue;
    seen.add(key);
    attrs++;
    const token = m[2];
    const found =
      m[1] === "*"
        ? corpus.includes(token)
        : new RegExp(
            `(^|[\\s"'\`])${token.replace(
              /[.*+?^${}()|[\]\\/]/g,
              "\\$&",
            )}(?=[\\s"'\`]|$)`,
            "m",
          ).test(corpus);
    if (found) continue;
    // [class~=] keys on one component class: a miss means upstream renamed it.
    // [class*=] is a defensive colour family (e.g. any bg-red-6xx): warn only.
    if (m[1] === "~")
      errors.push(
        `${file}: selector [class~="${token}"] matches no class under src/`,
      );
    else
      warnings.push(
        `${file}: [class*="${token}"] currently matches nothing (defensive, ok)`,
      );
  }
}

if (warnings.length && process.argv.includes("--verbose"))
  console.warn(warnings.join("\n"));
if (errors.length) {
  console.error(
    `theme:check-selectors: ${errors.length} problem(s)\n  ` +
      errors.join("\n  "),
  );
  process.exit(1);
}
console.log(
  `theme:check-selectors: ${depends} @depends tokens and ${attrs} attribute selectors OK`,
);
