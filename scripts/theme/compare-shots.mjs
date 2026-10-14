#!/usr/bin/env node
// Pixel comparison for the theme visual guard. Replaces reg-cli for this job:
// reg-cli aborts the whole run on one undecodable PNG ("ImageDiff(Decode)"),
// here an unreadable or missing shot is reported per story instead.
//
//   node scripts/theme/compare-shots.mjs <baselineDir> <currentDir> [--mask file]
//        [--tolerance 8] [--max-ratio 0] [--out report.json]
//
// --tolerance  per-channel difference ignored as anti-aliasing noise (0-255)
// --max-ratio  share of differing pixels a story may have (0 = must be identical)
// --mask       file of story-id prefixes (one per line, # comments) that are
//              skipped because they animate (e.g. control-center edges)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [baseDir, curDir, ...rest] = process.argv.slice(2);
const flag = (name, def) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : def;
};
const tolerance = Number(flag("tolerance", "8"));
const maxRatio = Number(flag("max-ratio", "0"));
const maskFile = flag("mask", "");
const outFile = flag("out", "");
if (!baseDir || !curDir) {
  console.error(
    "usage: compare-shots.mjs <baselineDir> <currentDir> [--mask f]",
  );
  process.exit(2);
}
const masks = maskFile
  ? fs
      .readFileSync(maskFile, "utf8")
      .split("\n")
      .map((l) => l.replace(/#.*/, "").trim())
      .filter(Boolean)
  : [];

const pngs = (d) =>
  new Set(fs.readdirSync(d).filter((f) => f.endsWith(".png")));
const base = pngs(baseDir);
const cur = pngs(curDir);
const result = {
  identical: 0,
  masked: [],
  changed: [],
  unreadable: [],
  onlyBaseline: [],
  onlyCurrent: [],
};

async function raw(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

for (const f of [...cur].sort()) {
  const id = f.replace(/\.png$/, "");
  if (masks.some((m) => id.startsWith(m))) {
    result.masked.push(id);
    continue;
  }
  if (!base.has(f)) {
    result.onlyCurrent.push(id);
    continue;
  }
  let a, b;
  try {
    [a, b] = await Promise.all([
      raw(path.join(baseDir, f)),
      raw(path.join(curDir, f)),
    ]);
  } catch (e) {
    result.unreadable.push(`${id}: ${e.message}`);
    continue;
  }
  if (a.w !== b.w || a.h !== b.h) {
    result.changed.push({ id, reason: `size ${a.w}x${a.h} -> ${b.w}x${b.h}` });
    continue;
  }
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) > tolerance ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > tolerance ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > tolerance
    )
      diff++;
  }
  const ratio = diff / (a.w * a.h);
  if (ratio > maxRatio)
    result.changed.push({
      id,
      reason: `${diff} px (${(ratio * 100).toFixed(3)} %)`,
    });
  else result.identical++;
}
for (const f of base)
  if (!cur.has(f)) result.onlyBaseline.push(f.replace(/\.png$/, ""));

if (outFile) fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(
  `identical ${result.identical}, changed ${result.changed.length}, masked ${result.masked.length}, ` +
    `unreadable ${result.unreadable.length}, only-baseline ${result.onlyBaseline.length}, only-current ${result.onlyCurrent.length}`,
);
for (const c of result.changed) console.log(`  changed  ${c.id}: ${c.reason}`);
for (const u of result.unreadable) console.log(`  unreadable ${u}`);
for (const o of result.onlyBaseline)
  console.log(`  missing  ${o} (captured in baseline only)`);
process.exit(
  result.changed.length ||
    result.unreadable.length ||
    result.onlyBaseline.length
    ? 1
    : 0,
);
