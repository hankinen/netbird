#!/usr/bin/env node
// Checks: en/zh-CN file + key parity, flat string values, size cap,
// interpolation variable parity, keys used in src but missing, unused keys.
// Run: npm run i18n:check   (exit code 1 on errors; unused keys are warnings)
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LOC = path.join(ROOT, "src/i18n/locales");
const MAX_KEYS = 150, MAX_BYTES = 12 * 1024;
const errors = [], warnings = [];
const load = (l) => Object.fromEntries(fs.readdirSync(path.join(LOC, l)).filter((f) => f.endsWith(".json")).map((f) => [f.slice(0, -5), JSON.parse(fs.readFileSync(path.join(LOC, l, f), "utf8"))]));
const en = load("en"), zh = load("zh-CN");
const vars = (s) => [...s.matchAll(/\{\{\s*(\w+)[^}]*\}\}/g)].map((m) => m[1]).sort().join(",");
const base = (k) => k.replace(/_(zero|one|two|few|many|other)$/, "");

for (const ns of new Set([...Object.keys(en), ...Object.keys(zh)])) {
  if (!en[ns]) { errors.push(`zh-CN/${ns}.json has no en file`); continue; }
  if (!zh[ns]) { errors.push(`en/${ns}.json has no zh-CN file`); continue; }
  for (const [lang, data] of [["en", en[ns]], ["zh-CN", zh[ns]]]) {
    const bytes = fs.statSync(path.join(LOC, lang, ns + ".json")).size, n = Object.keys(data).length;
    if (n > MAX_KEYS) errors.push(`${lang}/${ns}.json has ${n} keys (cap ${MAX_KEYS}); split it by feature`);
    if (bytes > MAX_BYTES) errors.push(`${lang}/${ns}.json is ${bytes} bytes (cap ${MAX_BYTES}); split it by feature`);
    for (const [k, v] of Object.entries(data)) if (typeof v !== "string") errors.push(`${lang}/${ns}.json: "${k}" is not a string (keys must be flat)`);
  }
  const zb = new Set(Object.keys(zh[ns]).map(base)), eb = new Set(Object.keys(en[ns]).map(base));
  for (const k of eb) if (!zb.has(k)) errors.push(`zh-CN/${ns}.json missing key "${k}"`);
  for (const k of zb) if (!eb.has(k)) errors.push(`zh-CN/${ns}.json has extra key "${k}"`);
  for (const [k, v] of Object.entries(en[ns])) {
    const z = zh[ns][k] ?? zh[ns][base(k) + "_other"];
    if (typeof z === "string" && vars(v) !== vars(z)) errors.push(`${ns}:${k} interpolation differs: en {${vars(v)}} zh-CN {${vars(z)}}`);
  }
}

// usage scan
const used = new Set();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of walk(path.join(ROOT, "src"))) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/\b(?:t|i18nT|translate)\(\s*["'`]([\w.-]+):([^"'`$]+)["'`]/g)) {
    used.add(`${m[1]}:${m[2]}`);
    if (!en[m[1]]) errors.push(`${path.relative(ROOT, f)}: unknown namespace "${m[1]}"`);
    else if (en[m[1]][m[2]] === undefined && en[m[1]][m[2] + "_other"] === undefined) errors.push(`${path.relative(ROOT, f)}: missing key "${m[1]}:${m[2]}"`);
  }
  for (const m of src.matchAll(/["'`]([\w.-]+):([\w.-]+)["'`]/g)) used.add(`${m[1]}:${m[2]}`);
}
for (const [ns, data] of Object.entries(en)) for (const k of Object.keys(data)) if (!used.has(`${ns}:${base(k)}`) && !used.has(`${ns}:${k}`)) warnings.push(`unused key ${ns}:${k}`);

const nKeys = Object.values(en).reduce((a, d) => a + Object.keys(d).length, 0);
for (const w of warnings) console.warn("warn  " + w);
for (const e of errors) console.error("error " + e);
console.log(`i18n:check: ${Object.keys(en).length} namespaces, ${nKeys} keys, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
