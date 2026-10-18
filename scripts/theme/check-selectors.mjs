#!/usr/bin/env node
// Guards the AntD theme's class-name based selectors against upstream renames.
//
// 1. Every `@depends <file>: <token> | <token>` annotation in
//    src/theme/**/*.css must point at an existing file that still
//    contains each token verbatim.
// 2. Every `[class~="x"]` selector whose token is named in an @depends must
//    still match a class token under src/ (dead selector = upstream changed
//    the component). Generic colour-family selectors ([class*=], and [class~=]
//    not named in @depends) are defensive; misses are reported with --verbose.
// 3. Specificity policy (see README "Specificity policy"):
//    - every selector stays at most MAX_DEPTH compound selectors deep after
//      the `:root.theme-antd:not(.dark)` scope (responsive.css: any colour
//      mode, `:root.theme-antd:is(.dark, :not(.dark))`, same weight);
//    - `!important` only where a comment right before the rule (or inside it)
//      says why (inline style or an upstream `!` utility).
//
// 4. Replaced components: every `@replaces <file> <export> sha256:<hash>` in
//    src/theme/adapters/*.tsx must still match the upstream
//    file's exported function and its props interface (whitespace-normalised).
//
// 5. Upstream touch points: every line of scripts/theme/touch-points.txt
//    (file :: required text [:: forbidden regex]) still holds, and every
//    non-theme file under src/ carrying an `@theme` marker is listed there.
//
// Exit code 1 lists what broke. Run: npm run theme:check-selectors
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../..",
);
const themeDir = path.join(root, "src/theme");
// Every stylesheet of the theme (css/, tokens/, ...), as paths relative to themeDir.
function walkCss(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkCss(p, out);
    else if (e.name.endsWith(".css")) out.push(path.relative(themeDir, p));
  }
  return out.sort();
}
const cssFiles = walkCss(themeDir);

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
        .replace(/^:root\.theme-antd(?::(?:not\(\.dark\)|is\(\.dark, :not\(\.dark\)\))|\.dark)?(?=\s|$)/, "")
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

let replaced = 0;
const componentsDir = path.join(themeDir, "adapters");
const signatureOf = (src, name) => {
  const iface = src.match(
    new RegExp(`interface ${name}Props<TData> \\{[\\s\\S]*?\\n\\}`),
  );
  const fn = src.match(
    new RegExp(`export function ${name}<TData>\\([\\s\\S]*?\\) \\{`),
  );
  if (!fn) return null;
  return ((iface ? iface[0] + "\n" : "") + fn[0]).replace(/\s+/g, " ");
};
if (fs.existsSync(componentsDir))
  for (const file of fs.readdirSync(componentsDir)) {
    if (!/\.tsx?$/.test(file)) continue;
    const text = fs.readFileSync(path.join(componentsDir, file), "utf8");
    for (const m of text.matchAll(
      /@replaces\s+(\S+)\s+(\w+)\s+sha256:([0-9a-f]+)/g,
    )) {
      replaced++;
      const [, target, name, want] = m;
      const abs = path.join(root, target);
      if (!fs.existsSync(abs)) {
        errors.push(`adapters/${file}: replaced file ${target} is gone`);
        continue;
      }
      const sig = signatureOf(fs.readFileSync(abs, "utf8"), name);
      if (!sig) {
        errors.push(
          `adapters/${file}: ${target} no longer exports function ${name}<TData>`,
        );
        continue;
      }
      const got = crypto
        .createHash("sha256")
        .update(sig)
        .digest("hex")
        .slice(0, want.length);
      if (got !== want)
        errors.push(
          `adapters/${file}: ${target} ${name} props/signature changed ` +
            `(sha256 ${want} -> ${got}); review the wrapper, then update @replaces`,
        );
    }
  }

// 4b. Replaced files: `@replaces-file <file> sha256:<hash>` in src/theme/**
// pins the whole upstream file (shell replacements copy a provider stack or
// a behaviour from it; any upstream change there is worth a look).
let replacedFiles = 0;
(function walkTheme(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkTheme(p);
    else if (/\.(tsx?|css)$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name)) {
      const text = fs.readFileSync(p, "utf8");
      for (const m of text.matchAll(/@replaces-file\s+(\S+)\s+sha256:([0-9a-f]+)/g)) {
        replacedFiles++;
        const [, target, want] = m;
        const abs = path.join(root, target);
        const rel = path.relative(themeDir, p);
        if (!fs.existsSync(abs)) {
          errors.push(`${rel}: replaced file ${target} is gone`);
          continue;
        }
        const got = crypto
          .createHash("sha256")
          .update(fs.readFileSync(abs, "utf8").replace(/\r\n/g, "\n"))
          .digest("hex")
          .slice(0, want.length);
        if (got !== want)
          errors.push(
            `${rel}: ${target} changed upstream (sha256 ${want} -> ${got}); ` +
              `review the replacement, then update @replaces-file`,
          );
      }
    }
  }
})(themeDir);

// 5. Upstream touch points.
let touchPoints = 0;
const tpFile = path.join(root, "scripts/theme/touch-points.txt");
const listed = new Set();
if (fs.existsSync(tpFile))
  for (const line of fs.readFileSync(tpFile, "utf8").split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [file, must, mustNot] = line.split(" :: ").map((x) => x?.trim());
    listed.add(file);
    touchPoints++;
    const abs = path.join(root, file);
    if (!fs.existsSync(abs)) {
      errors.push(`touch-points: ${file} is gone`);
      continue;
    }
    const text = fs.readFileSync(abs, "utf8");
    if (!text.includes(must))
      errors.push(`touch-points: ${file} lost the theme change ("${must}")`);
    if (mustNot && new RegExp(mustNot).test(text))
      errors.push(
        `touch-points: ${file} has upstream code back (/${mustNot}/)`,
      );
  }
for (const abs of walk(path.join(root, "src"))) {
  const rel = path.relative(root, abs);
  if (/@theme\b/.test(fs.readFileSync(abs, "utf8")) && !listed.has(rel))
    errors.push(
      `touch-points: ${rel} has an @theme marker but is not in scripts/theme/touch-points.txt`,
    );
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
  `theme:check-selectors: ${depends} @depends tokens and ${attrs} attribute selectors OK; ${rules} rules within specificity policy; ${replaced} replaced component(s) and ${replacedFiles} replaced file(s) match upstream; ${touchPoints} upstream touch point(s) intact`,
);
