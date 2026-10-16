#!/usr/bin/env node
// Writes a .gz sibling next to every compressible file in out/ so nginx can
// serve it with gzip_static instead of compressing on every request.
// Deterministic: same input bytes give the same .gz bytes (no name/mtime in
// the gzip header), so the immutable-asset sha256 check stays meaningful.
import { readdirSync, readFileSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { constants, gzipSync } from "node:zlib";

const OUT = resolve(process.argv[2] ?? "out");
const EXTENSIONS = new Set([
  ".js", ".css", ".html", ".txt", ".json", ".svg", ".map", ".ico", ".wasm", ".xml", ".ttf",
]);
const MIN_BYTES = 1024;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

let written = 0;
let saved = 0;
for (const file of walk(OUT)) {
  if (!EXTENSIONS.has(extname(file))) continue;
  const input = readFileSync(file);
  if (input.length < MIN_BYTES) continue;
  const gz = gzipSync(input, { level: constants.Z_BEST_COMPRESSION });
  if (gz.length >= input.length * 0.95) continue; // not worth a second file
  writeFileSync(`${file}.gz`, gz);
  // gzip_static derives Last-Modified/ETag from the .gz file.
  const { atime, mtime } = statSync(file);
  utimesSync(`${file}.gz`, atime, mtime);
  written++;
  saved += input.length - gz.length;
}
console.log(
  `precompress: ${written} .gz files, ${(saved / 1024 / 1024).toFixed(1)} MiB saved`,
);
