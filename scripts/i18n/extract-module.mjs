#!/usr/bin/env node
// Codemod: replace literal UI text in the given folders/files with t() calls
// and write the English strings into src/i18n/locales/en/*.json.
// Usage: node scripts/i18n/extract-module.mjs [--dry] src/modules/peers ...
// zh-CN entries are added with the English value; translate them afterwards.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const LOC = path.join(ROOT, "src/i18n/locales");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const GETTERS = args.includes("--getters");
const GETTER_ALL = args.includes("--getters-all");
const targets = args.filter((a) => !a.startsWith("--"));

const ATTRS = new Set([
  "label",
  "text",
  "placeholder",
  "content",
  "customSuffix",
  "customPrefix",
  "title",
  "searchPlaceholder",
  "description",
  "message",
  "copyText",
  "helpText",
  "emptyText",
  "featureText",
  "emptyTableTitle",
  "buttonText",
  "tooltip",
  "subtitle",
  "aria-label",
  "confirmText",
  "cancelText",
  "loadingMessage",
  "errorMessage",
  "heading",
  "hint",
]);
const PROPS = new Set([
  "label",
  "title",
  "description",
  "loadingMessage",
  "confirmText",
  "cancelText",
  "errorMessage",
  "message",
  "placeholder",
  "tooltip",
  "helpText",
  "text",
  "subtitle",
]);
const SKIP_TAGS = new Set(["code", "Code", "Kbd", "pre", "style", "script"]);
const HUMAN = /[a-z]{2,}/;

const MAX_KEYS = 140,
  MAX_BYTES = 11 * 1024;

function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory())
    for (const f of fs.readdirSync(p)) walk(path.join(p, f), out);
  else if (
    /\.tsx?$/.test(p) &&
    !/\.(stories|test|spec)\.tsx?$/.test(p) &&
    !p.endsWith(".d.ts")
  )
    out.push(p);
  return out;
}

export function baseNamespace(file) {
  const rel = path.relative(path.join(ROOT, "src"), file).split(path.sep);
  if (rel[0] === "layouts") return "nav";
  if (rel[0] === "components")
    return "components." + (rel.length > 2 ? rel[1] : "core");
  if (rel[0] === "cloud")
    return "cloud." + (rel.length > 2 ? rel[1] : "main");
  if (rel[0] === "modules")
    return rel[1] + "." + (rel.length > 3 ? rel[2] : "main");
  if (rel[0] === "app") {
    const segs = rel.slice(1).filter((s) => !s.startsWith("("));
    return (segs.length > 1 ? segs[0] : "app") + ".page";
  }
  return rel[0] + ".main";
}

const camel = (s) =>
  s
    .replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toLowerCase());
const slug = (s) => {
  const words = s
    .replace(/\{\{\w+\}\}/g, " ")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  return camel(words.join(" ")) || "text";
};
const norm = (s) => s.replace(/\s+/g, " ");

function enclosingFunction(n) {
  if (process.env.I18N_MODULE_LEVEL) return true; // list-only mode
  for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return p;
  return null;
}

function varName(expr, used) {
  let name = ts.isIdentifier(expr)
    ? expr.text
    : ts.isPropertyAccessExpression(expr)
    ? expr.name.text
    : ts.isCallExpression(expr) &&
      ts.isPropertyAccessExpression(expr.expression)
    ? expr.expression.name.text
    : "value";
  if (!/^[A-Za-z_]\w*$/.test(name)) name = "value";
  let n = name,
    i = 2;
  while (used.has(n)) n = name + i++;
  used.add(n);
  return n;
}
const simpleExpr = (e) =>
  e &&
  (ts.isIdentifier(e) ||
    ts.isPropertyAccessExpression(e) ||
    ts.isElementAccessExpression(e) ||
    ts.isCallExpression(e) ||
    ts.isNumericLiteral(e));

const SENTENCE = /^[A-Z][A-Za-z']*(\s+\S+)+/;
const BLOCK_CALLEE =
  /(^|\.)(console|mutate|request|fetch|push|replace|includes|startsWith|endsWith|test|match|split|get|set|has|del|put|post|useFetch|useApiCall|querySelector|getItem|setItem|trackEvent|track|log|warn|error|debug|info|Error|RegExp|encodeURIComponent|t|i18nT|singularize|pluralize)$/;
function BLOCK_PARENT(n) {
  let up = n.parent;
  while (
    up &&
    ((ts.isBinaryExpression(up) &&
      up.operatorToken.kind !== ts.SyntaxKind.PlusToken &&
      up.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken) ||
      ts.isParenthesizedExpression(up) ||
      ts.isConditionalExpression(up))
  )
    up = up.parent;
  if (
    up &&
    ts.isPropertyAssignment(up) &&
    /^(key|id|value|type|href|url|name|email|data|path)$/.test(
      up.name.getText(),
    )
  )
    return true;
  if (ts.isPropertyAccessExpression(n.parent)) return true;
  const p = n.parent;
  if (!p) return true;
  if (
    ts.isImportDeclaration(p) ||
    ts.isExportDeclaration(p) ||
    ts.isLiteralTypeNode(p) ||
    ts.isCaseClause(p) ||
    ts.isElementAccessExpression(p) ||
    (ts.isPropertyAssignment(p) && p.name === n)
  )
    return true;
  if (
    ts.isBinaryExpression(p) &&
    [
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsToken,
    ].includes(p.operatorToken.kind)
  )
    return true;
  if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.expression !== n) {
    const c = p.expression.getText();
    if (BLOCK_CALLEE.test(c)) return true;
  }
  if (
    ts.isJsxAttribute(p) ||
    (ts.isJsxExpression(p) &&
      p.parent &&
      ts.isJsxAttribute(p.parent) &&
      !ATTRS.has(p.parent.name.getText()))
  )
    return true;
  if (
    ts.isPropertyAssignment(p) &&
    !PROPS.has(p.name.getText()) &&
    /^(key|id|value|type|href|url|className|variant|name|email|data|path|icon)$/.test(
      p.name.getText(),
    )
  )
    return true;
  return false;
}
function isSentenceHost(n) {
  if (
    ts.isBinaryExpression(n) &&
    n.operatorToken.kind === ts.SyntaxKind.PlusToken
  )
    return !(
      ts.isBinaryExpression(n.parent) &&
      n.parent.operatorToken.kind === ts.SyntaxKind.PlusToken
    );
  if (
    ts.isStringLiteral(n) ||
    ts.isNoSubstitutionTemplateLiteral(n) ||
    ts.isTemplateExpression(n)
  )
    return !(
      ts.isBinaryExpression(n.parent) &&
      n.parent.operatorToken.kind === ts.SyntaxKind.PlusToken
    );
  return false;
}
function flattenConcat(n) {
  if (ts.isParenthesizedExpression(n)) return flattenConcat(n.expression);
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
    return [n.text];
  if (ts.isTemplateExpression(n)) {
    const out = [n.head.text];
    for (const s of n.templateSpans) {
      if (
        !simpleExpr(s.expression) &&
        !ts.isConditionalExpression(s.expression) &&
        !ts.isBinaryExpression(s.expression)
      )
        return null;
      out.push(s.expression, s.literal.text);
    }
    return out;
  }
  if (
    ts.isBinaryExpression(n) &&
    n.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const a = flattenConcat(n.left),
      b = flattenConcat(n.right);
    if (!a || !b) return null;
    if (
      !a.some((x) => typeof x === "string") &&
      !b.some((x) => typeof x === "string")
    )
      return null;
    return [...a, ...b];
  }
  if (simpleExpr(n)) return [n];
  return null;
}

// Collect candidate edits for one file. Each edit: {start,end,kind,text,vars:[[name,exprText]],wrap}
function collect(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const edits = [];
  const claimed = new Set();
  const area = camel(path.basename(file).replace(/\.tsx?$/, ""));

  function tagName(el) {
    const o = ts.isJsxElement(el) ? el.openingElement : el;
    return o.tagName.getText(sf);
  }
  function inSkipped(n) {
    for (let p = n.parent; p; p = p.parent)
      if (ts.isJsxElement(p) && SKIP_TAGS.has(tagName(p))) return true;
    return false;
  }

  function visit(n) {
    // a) whole-children interpolation
    if (
      ts.isJsxElement(n) &&
      !SKIP_TAGS.has(tagName(n)) &&
      enclosingFunction(n)
    ) {
      const ch = n.children;
      const allSimple =
        ch.length > 0 &&
        ch.every(
          (c) =>
            ts.isJsxText(c) ||
            (ts.isJsxExpression(c) &&
              (simpleExpr(c.expression) ||
                (c.expression && ts.isStringLiteral(c.expression)))),
        );
      const hasText = ch.some((c) => ts.isJsxText(c) && HUMAN.test(c.text));
      const hasExpr = ch.some(
        (c) =>
          ts.isJsxExpression(c) &&
          c.expression &&
          !ts.isStringLiteral(c.expression),
      );
      if (allSimple && hasText && hasExpr && !inSkipped(n)) {
        const used = new Set();
        const vars = [];
        let text = "";
        for (const c of ch) {
          if (ts.isJsxText(c)) text += c.text;
          else if (ts.isStringLiteral(c.expression)) text += c.expression.text;
          else {
            const v = varName(c.expression, used);
            vars.push([v, c.expression.getText(sf)]);
            text += `{{${v}}}`;
          }
        }
        text = norm(text).trim();
        const start = ch[0].getStart(sf),
          end = ch[ch.length - 1].getEnd();
        // keep leading/trailing JSX whitespace layout by replacing the full range
        edits.push({
          start: ch[0].pos,
          end,
          kind: "text",
          text,
          vars,
          jsx: true,
        });
        for (const c of ch) claimed.add(c);
        ts.forEachChild(n.openingElement, visit);
        return;
      }
    }
    if (
      ts.isJsxText(n) &&
      !claimed.has(n) &&
      HUMAN.test(n.text) &&
      !inSkipped(n) &&
      enclosingFunction(n)
    ) {
      const raw = n.text;
      const text = norm(raw).trim();
      const lead =
        /^[ \t]+\S/.test(raw) ||
        (/^\s/.test(raw) && !raw.slice(0, raw.search(/\S/)).includes("\n"));
      const trail =
        /\s$/.test(raw) && !raw.slice(raw.search(/\s*$/)).includes("\n");
      edits.push({
        start: n.pos,
        end: n.end,
        kind: "text",
        text,
        vars: [],
        jsx: true,
        lead: lead && /^\s/.test(raw),
        trail,
        rawLeadNl: raw.slice(0, raw.search(/\S/)),
        rawTrailNl: raw.slice(raw.search(/\s*$/)),
      });
    }
    if (
      ts.isJsxAttribute(n) &&
      ATTRS.has(n.name.getText(sf)) &&
      n.initializer &&
      enclosingFunction(n)
    ) {
      let lit = n.initializer;
      if (ts.isJsxExpression(lit)) lit = lit.expression;
      if (
        lit &&
        (ts.isStringLiteral(lit) || ts.isNoSubstitutionTemplateLiteral(lit)) &&
        HUMAN.test(lit.text)
      ) {
        edits.push({
          start: n.initializer.getStart(sf),
          end: n.initializer.getEnd(),
          kind: camel(n.name.getText(sf)),
          text: norm(lit.text).trim(),
          vars: [],
          attr: true,
        });
        return;
      }
    }
    if (
      ts.isPropertyAssignment(n) &&
      PROPS.has(n.name.getText(sf)) &&
      enclosingFunction(n)
    ) {
      const lit = n.initializer;
      if (
        (ts.isStringLiteral(lit) || ts.isNoSubstitutionTemplateLiteral(lit)) &&
        HUMAN.test(lit.text)
      ) {
        edits.push({
          start: lit.getStart(sf),
          end: lit.getEnd(),
          kind: camel(n.name.getText(sf)),
          text: norm(lit.text).trim(),
          vars: [],
        });
        return;
      }
      if (
        ts.isTemplateExpression(lit) &&
        HUMAN.test(
          lit.head.text + lit.templateSpans.map((s) => s.literal.text).join(""),
        )
      ) {
        const used = new Set();
        const vars = [];
        let text = lit.head.text;
        for (const s of lit.templateSpans) {
          const v = varName(s.expression, used);
          vars.push([v, s.expression.getText(sf)]);
          text += `{{${v}}}` + s.literal.text;
        }
        edits.push({
          start: lit.getStart(sf),
          end: lit.getEnd(),
          kind: camel(n.name.getText(sf)),
          text: norm(text).trim(),
          vars,
        });
        return;
      }
    }
    // e) sentences anywhere in a function body (returns, variables, defaults, concatenations)
    if (enclosingFunction(n) && !inSkipped(n) && isSentenceHost(n)) {
      const parts = flattenConcat(n);
      if (parts) {
        const used = new Set();
        const vars = [];
        let text = "";
        for (const p of parts) {
          if (typeof p === "string") text += p;
          else {
            const v = varName(p, used);
            vars.push([v, p.getText(sf)]);
            text += `{{${v}}}`;
          }
        }
        text = norm(text).trim();
        if (SENTENCE.test(text) && !BLOCK_PARENT(n)) {
          edits.push({
            start: n.getStart(sf),
            end: n.getEnd(),
            kind: "text",
            text,
            vars,
          });
          return;
        }
      }
    }
    // f) --getters: module-level object properties become getters resolved at render
    if (
      GETTERS &&
      ts.isPropertyAssignment(n) &&
      !enclosingFunction(n) &&
      (PROPS.has(n.name.getText(sf)) ||
        n.name.getText(sf) === "note" ||
        GETTER_ALL) &&
      (ts.isStringLiteral(n.initializer) ||
        ts.isNoSubstitutionTemplateLiteral(n.initializer)) &&
      HUMAN.test(n.initializer.text)
    ) {
      edits.push({
        start: n.getStart(sf),
        end: n.getEnd(),
        kind: camel(n.name.getText(sf)),
        text: norm(n.initializer.text).trim(),
        vars: [],
        getter: n.name.getText(sf),
      });
      return;
    }
    // d) string literals inside JSX child expressions via ?: && ||
    if (ts.isStringLiteral(n) && HUMAN.test(n.text) && enclosingFunction(n)) {
      let p = n.parent,
        ok = false;
      while (
        p &&
        (ts.isConditionalExpression(p) ||
          ts.isParenthesizedExpression(p) ||
          (ts.isBinaryExpression(p) &&
            [
              ts.SyntaxKind.AmpersandAmpersandToken,
              ts.SyntaxKind.BarBarToken,
              ts.SyntaxKind.QuestionQuestionToken,
            ].includes(p.operatorToken.kind)))
      ) {
        if (ts.isConditionalExpression(p) && p.condition === n) break;
        p = p.parent;
      }
      if ((p && p !== n.parent) || (p && ts.isJsxExpression(p))) {
        if (
          ts.isJsxExpression(p) &&
          p.parent &&
          (ts.isJsxElement(p.parent) ||
            ts.isJsxFragment(p.parent) ||
            (ts.isJsxAttribute(p.parent) &&
              ATTRS.has(p.parent.name.getText(sf))))
        )
          ok =
            n.parent !== p ||
            ts.isJsxElement(p.parent) ||
            ts.isJsxFragment(p.parent);
        if (
          ts.isPropertyAssignment(p) &&
          PROPS.has(p.name.getText(sf)) &&
          p.initializer !== n
        )
          ok = true;
      }
      if (ok && !inSkipped(n))
        edits.push({
          start: n.getStart(sf),
          end: n.getEnd(),
          kind: "text",
          text: norm(n.text).trim(),
          vars: [],
        });
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
  const hasLocalT =
    /\b(const|let|var|function)\s+t\b|[(,]\s*t\s*[,)=:]|\bt\s*=>/.test(src) ||
    /\{\s*t\s*[,}]/.test(src.replace(/import[^;]*;/g, ""));
  return { src, sf, edits, area, hasLocalT };
}

function main() {
  const files = targets.flatMap((t) => walk(path.resolve(t)));
  const perFile = files
    .map((f) => ({ file: f, base: baseNamespace(f), ...collect(f) }))
    .filter((x) => x.edits.length);
  // existing locale data
  const readJson = (lang, ns) => {
    const p = path.join(LOC, lang, ns + ".json");
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
  };
  // common: short strings used in >=3 base namespaces
  const textNs = new Map();
  for (const f of perFile)
    for (const e of f.edits)
      if (
        !e.vars.length &&
        e.text.split(" ").length <= 3 &&
        e.text.length <= 24
      ) {
        if (!textNs.has(e.text)) textNs.set(e.text, new Set());
        textNs.get(e.text).add(f.base);
      }
  const common = readJson("en", "common");
  const commonByText = new Map(Object.entries(common).map(([k, v]) => [v, k]));
  for (const [text, set] of textNs)
    if (set.size >= 3 && !commonByText.has(text)) {
      let k = "word." + slug(text),
        i = 2;
      while (common[k]) k = "word." + slug(text) + i++;
      common[k] = text;
      commonByText.set(text, k);
    }
  // group files per base namespace, split by caps
  const byBase = new Map();
  for (const f of perFile) {
    if (!byBase.has(f.base)) byBase.set(f.base, []);
    byBase.get(f.base).push(f);
  }
  const nsData = {};
  for (const [base, fl] of byBase) {
    const groups = [];
    let cur = null;
    const estimate = (f) =>
      f.edits
        .filter((e) => !(commonByText.has(e.text) && !e.vars.length))
        .reduce((a, e) => a + e.text.length + 40, 0);
    const count = (f) =>
      f.edits.filter((e) => !(commonByText.has(e.text) && !e.vars.length))
        .length;
    const total = fl.reduce((a, f) => a + count(f), 0),
      bytes = fl.reduce((a, f) => a + estimate(f), 0);
    if (total <= MAX_KEYS && bytes <= MAX_BYTES)
      groups.push({ ns: base, files: fl });
    else
      for (const f of fl) {
        if (
          !cur ||
          cur.n + count(f) > MAX_KEYS ||
          cur.b + estimate(f) > MAX_BYTES
        ) {
          cur = {
            ns:
              base.replace(/\.main$/, "") +
              "." +
              path
                .basename(f.file)
                .replace(/\.tsx?$/, "")
                .replace(/([a-z])([A-Z])/g, "$1-$2")
                .toLowerCase(),
            files: [],
            n: 0,
            b: 0,
          };
          groups.push(cur);
        }
        cur.files.push(f);
        cur.n += count(f);
        cur.b += estimate(f);
      }
    for (const g of groups) {
      const data = nsData[g.ns] ?? readJson("en", g.ns);
      nsData[g.ns] = data;
      const byText = new Map(Object.entries(data).map(([k, v]) => [v, k]));
      for (const f of g.files) {
        f.ns = g.ns;
        for (const e of f.edits) {
          if (!e.vars.length && commonByText.has(e.text)) {
            e.key = "common:" + commonByText.get(e.text);
            continue;
          }
          let k = byText.get(e.text);
          if (!k) {
            const b = `${f.area}.${e.kind}.${slug(e.text)}`;
            k = b;
            let i = 2;
            while (data[k] !== undefined) k = b + i++;
            data[k] = e.text;
            byText.set(e.text, k);
          }
          e.key = g.ns + ":" + k;
        }
      }
    }
  }
  let nEdits = 0;
  for (const f of perFile) {
    nEdits += f.edits.length;
    const already = /import \{ t as i18nT \} from "@\/i18n";/.test(f.src)
      ? "i18nT"
      : /import \{ t \} from "@\/i18n";/.test(f.src)
      ? "t"
      : null;
    const fn = already ?? (f.hasLocalT ? "i18nT" : "t");
    let out = f.src;
    const edits = [...f.edits].sort((a, b) => b.start - a.start);
    for (const e of edits) {
      const opts = e.vars.length
        ? `, { ${e.vars
            .map(([n, x]) => (n === x ? n : `${n}: ${x}`))
            .join(", ")} }`
        : "";
      const call = `${fn}(${JSON.stringify(e.key)}${opts})`;
      let rep;
      if (e.getter) rep = `get ${e.getter}() {\n    return ${call};\n  }`;
      else if (e.attr) rep = `{${call}}`;
      else if (e.jsx) {
        const raw = f.src.slice(e.start, e.end);
        const lead = raw.match(/^\s*/)[0],
          trail = raw.match(/\s*$/)[0];
        const keepLead = lead && !lead.includes("\n") ? `{" "}` : lead;
        const keepTrail = trail && !trail.includes("\n") ? `{" "}` : trail;
        rep =
          (lead.includes("\n") ? lead : keepLead) +
          `{${call}}` +
          (trail.includes("\n") ? trail : keepTrail);
      } else rep = call;
      out = out.slice(0, e.start) + rep + out.slice(e.end);
    }
    const imp = f.hasLocalT
      ? `import { t as i18nT } from "@/i18n";\n`
      : `import { t } from "@/i18n";\n`;
    const imports = [
      ...out.matchAll(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm),
    ];
    if (already) {
    } else if (imports.length) {
      const last = imports[imports.length - 1];
      const at = last.index + last[0].length;
      out = out.slice(0, at) + "\n" + imp.trimEnd() + out.slice(at);
    } else {
      const m = out.match(/^(["']use client["'];?\s*\n)/);
      out = m ? m[1] + imp + out.slice(m[1].length) : imp + out;
    }
    if (!DRY) fs.writeFileSync(f.file, out);
  }
  if (!DRY) {
    const write = (lang, ns, data) => {
      fs.mkdirSync(path.join(LOC, lang), { recursive: true });
      fs.writeFileSync(
        path.join(LOC, lang, ns + ".json"),
        JSON.stringify(data, null, 2) + "\n",
      );
    };
    write("en", "common", common);
    const zc = readJson("zh-CN", "common");
    for (const k in common) zc[k] ??= common[k];
    write("zh-CN", "common", zc);
    for (const [ns, data] of Object.entries(nsData)) {
      write("en", ns, data);
      const z = readJson("zh-CN", ns);
      for (const k in data) z[k] ??= data[k];
      write("zh-CN", ns, z);
    }
  }
  if (process.env.I18N_LIST)
    for (const f of perFile)
      for (const e of f.edits)
        console.log(path.relative(ROOT, f.file), "|", e.text);
  const sizes = Object.entries(nsData).map(
    ([ns, d]) => `${ns}=${Object.keys(d).length}`,
  );
  console.log(
    `files changed: ${perFile.length}, replacements: ${nEdits}, common keys: ${
      Object.keys(common).length
    }, namespaces: ${sizes.length}`,
  );
  console.log(sizes.join(" "));
}
main();
