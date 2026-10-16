#!/usr/bin/env node
// Build guard: everything nginx serves as immutable must be config-free and
// content-addressed. Fails the build otherwise, then writes
// out/.asset-manifest.json (sha256 per file) for the release pipeline, which
// keeps the files of recent releases available for open tabs.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";

const OUT = resolve(process.argv[2] ?? "out");
const MANIFEST = ".asset-manifest.json";
// Deployment config must come from /runtime-config.json at runtime only.
const PLACEHOLDER = /\$\{?(AUTH_|NETBIRD_|USE_AUTH0)/;
const HASHED_NAME = /[0-9A-Za-z_~-]{8,}/;
const BUILD_ID_DIRS = new Set(["chunks", "css", "media"]);

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const errors = [];
const files = walk(OUT)
  .map((file) => relative(OUT, file).split(sep).join("/"))
  .filter((file) => file !== MANIFEST)
  .sort();

const manifest = {};
for (const file of files) {
  const bytes = readFileSync(join(OUT, file));
  if (!file.endsWith(".gz") && PLACEHOLDER.test(bytes.toString("latin1"))) {
    errors.push(`${file}: contains a config placeholder`);
  }
  manifest[file] = createHash("sha256").update(bytes).digest("hex");

  const name = basename(file).replace(/\.gz$/, "");
  if (file.startsWith("_next/static/")) {
    const [, , first] = file.split("/");
    // _next/static/<buildId>/… is hashed by its directory.
    const byBuildId = !BUILD_ID_DIRS.has(first) && HASHED_NAME.test(first);
    if (!byBuildId && !HASHED_NAME.test(name.replace(/\.[^.]+$/, ""))) {
      errors.push(`${file}: immutable path without a content hash`);
    }
  } else if (/^assets\/chunk\./.test(file)) {
    // nginx serves exactly /assets/chunk.<8 hex>.js as immutable; other
    // /assets files (flags, icons) are no-cache.
    const match = /^chunk\.([0-9a-f]{8})\.js$/.exec(name);
    if (!match) {
      errors.push(`${file}: chunk name is not chunk.<md5-8>.js`);
    } else if (!file.endsWith(".gz")) {
      const md5 = createHash("md5").update(bytes).digest("hex").slice(0, 8);
      if (md5 !== match[1]) {
        errors.push(`${file}: name hash ${match[1]} != content md5 ${md5}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`IMMUTABLE CHECK FAILED (${errors.length}):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

writeFileSync(
  join(OUT, MANIFEST),
  `${JSON.stringify({ version: 1, files: manifest }, null, 2)}\n`,
);
console.log(`IMMUTABLE OK (${files.length} files, ${MANIFEST} written)`);
