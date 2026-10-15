#!/usr/bin/env node
// Guards the AntD theme's class-name based selectors against upstream renames.
//
// 1. Every `@depends <file>: <token> | <token>` annotation in
//    src/styles/theme-antd/*.css must point at an existing file that still
//    contains each token verbatim.
// 2. Every `[class~="x"]` selector whose token is named in an @depends must
//    still match a class token under src/ (dead selector = upstream changed
//    the component). Generic colour-family selectors ([class*=], and [class~=]
//    not named in @depends) are defensive; misses are reported with --verbose.
// 3. Specificity policy (see README "Specificity policy"):
//    - every selector stays at most MAX_DEPTH compound selectors deep after
//      the `:root.theme-antd:not(.dark)` scope;
//    - `!important` only where a comment right before the rule (or inside it)
//      says why (inline style or an upstream `!` utility).
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

// Tokens named by @depends (split into single classes): a [class~=] selector
// on one of these is a component contract and must keep matching. Other
// [class~=] selectors are generic colour families and only warn.
const dependTokens = new Set();
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(themeDir, file), "utf8");
  for (const m of css.matchAll(/@depends\s+(.+?):\s+(.+?)(?=\*\/|\n|$)/g))
    for (const t of m[2].split(/[|\s]+/)) if (t) dependTokens.add(t);
}

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
  for (const m of code.matchAll(/\[class([~*])="([^"]+)"(?: i)?\]/g)) {
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
    if (m[1] === "~" && dependTokens.has(token))
      errors.push(
        `${file}: selector [class~="${token}"] matches no class under src/`,
      );
    else
      warnings.push(
        `${file}: [class${m[1]}="${token}"] currently matches nothing (generic, ok)`,
      );
  }
}

const MAX_DEPTH = 3;
let rules = 0;
function splitTop(sel, sep) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const c of sel) {
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (depth === 0 && sep.test(c)) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(themeDir, file), "utf8");
  // Rule = optional leading comment, selector, body (no nesting in these files
  // apart from @media/@supports, whose inner rules are matched too).
  for (const m of css.matchAll(
    /(\/\*(?:(?!\*\/)[\s\S])*\*\/\s*)?([^{}/]+?)\s*\{([^{}]*)\}/g,
  )) {
    const [, lead = "", rawSelector, body] = m;
    // drop a trailing `*/` fragment when a comment was not captured as `lead`
    const selector = rawSelector.replace(/^[\s\S]*\*\//, "").trim();
    if (!selector || selector.startsWith("@")) continue;
    rules++;
    const sel = selector.replace(/\s+/g, " ");
    for (const part of splitTop(sel, /,/)) {
      const scoped = part
        .replace(/^:root\.theme-antd:not\(\.dark\)/, "")
        .replace(/^html:where\((?:[^()]|\([^()]*\))*\)/, "")
        .replace(/\s*[>+~]\s*(?![^[]*\])/g, " ");
      const depth = splitTop(scoped, /\s/).length;
      if (depth > MAX_DEPTH)
        errors.push(
          `${file}: selector deeper than ${MAX_DEPTH}: ${part.slice(0, 100)}`,
        );
    }
    if (
      /!important/.test(body) &&
      !/!important/.test(lead + body.replace(/[^;]*!important\s*;?/g, ""))
    )
      errors.push(
        `${file}: !important without a comment saying why: ${sel.slice(
          0,
          100,
        )}`,
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
  `theme:check-selectors: ${depends} @depends tokens and ${attrs} attribute selectors OK; ${rules} rules within specificity policy`,
);
