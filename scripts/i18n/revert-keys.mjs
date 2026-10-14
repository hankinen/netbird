#!/usr/bin/env node
// Turns t("ns:key", {vars}) calls back into the English literal and removes the
// key from both languages. Use for text that must stay English (API payloads,
// analytics event names, values compared in logic).
// Usage: node scripts/i18n/revert-keys.mjs ns:key [ns:key ...] -- file [file ...]
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const args = process.argv.slice(2),
  sep = args.indexOf("--");
const keys = new Set(args.slice(0, sep)),
  files = args.slice(sep + 1);
const LOC = path.join(process.cwd(), "src/i18n/locales");
const en = (ns) =>
  JSON.parse(fs.readFileSync(path.join(LOC, "en", ns + ".json"), "utf8"));
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const edits = [];
  const visit = (n) => {
    if (
      ts.isCallExpression(n) &&
      /^(t|i18nT)$/.test(n.expression.getText(sf)) &&
      n.arguments[0] &&
      ts.isStringLiteral(n.arguments[0]) &&
      keys.has(n.arguments[0].text)
    ) {
      const [ns, key] = n.arguments[0].text.split(":");
      let text = en(ns)[key];
      const vars = {};
      const o = n.arguments[1];
      if (o && ts.isObjectLiteralExpression(o))
        for (const p of o.properties) {
          if (ts.isShorthandPropertyAssignment(p))
            vars[p.name.text] = p.name.text;
          else if (ts.isPropertyAssignment(p))
            vars[p.name.getText(sf)] = p.initializer.getText(sf);
        }
      const rep = Object.keys(vars).length
        ? "`" +
          text
            .replace(/[`\\]/g, "\\$&")
            .replace(/\$\{/g, "\\${")
            .replace(/\{\{(\w+)\}\}/g, (_, v) => "${" + vars[v] + "}") +
          "`"
        : JSON.stringify(text);
      edits.push([n.getStart(sf), n.getEnd(), rep]);
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  let out = src;
  for (const [s, e, r] of edits.sort((a, b) => b[0] - a[0]))
    out = out.slice(0, s) + r + out.slice(e);
  if (!/\b(t|i18nT)\(/.test(out.replace(/import[^;]*;/g, "")))
    out = out.replace(/\nimport \{ t( as i18nT)? \} from "@\/i18n";/, "");
  fs.writeFileSync(file, out);
  console.log(`${file}: ${edits.length} reverted`);
}
for (const k of keys) {
  const [ns, key] = k.split(":");
  for (const lang of ["en", "zh-CN"]) {
    const p = path.join(LOC, lang, ns + ".json"),
      d = JSON.parse(fs.readFileSync(p, "utf8"));
    delete d[key];
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
  }
}
