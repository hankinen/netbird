#!/usr/bin/env node
// Legibility guard for the Control Center canvas (AntD theme, light and
// dark). Opens the canvas page stories at desktop widths, waits for the
// view's first fit, and measures what a user actually gets on screen:
//   - the smallest effective font size (CSS size × canvas zoom) of the text
//     the graph primitives mark with data-graph-text, over every visible
//     node;
//   - how many nodes end up under the chrome (the row above the canvas and
//     the bottom dock).
// Fails when a story's smallest text is below --min px (default 12) and the
// story is not allowlisted at that number in graph-legibility-allow.json
// (keys <story>@<width>:<theme>), or when any node sits under the chrome.
// --update rewrites the allowlist with today's failing numbers (review the
// diff!); an entry is dropped again once the story passes.
//
//   node scripts/theme/graph-legibility.mjs --storybook <dir>
//   options: --vp 1280,1440  --filter pages-core-controlcenter--  --min 12
//            --theme light,dark  --update  --report <file.json>
//   THEME_GUARD_CHROMIUM=<path> uses a preinstalled browser.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const ALLOW = path.join(REPO, "scripts/theme/graph-legibility-allow.json");
const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const widths = flag("vp", "1280,1440").split(",").map(Number);
const themes = flag("theme", "light,dark").split(",");
const filter = flag("filter", "pages-core-controlcenter--");
const MIN = Number(flag("min", "12"));
const update = args.includes("--update");
const report = flag("report", "");
// Stories whose canvas is a view (the chooser / menus / context-menu stories
// repeat one of them).
const VIEWS = /--(peers-view|users-view|groups-view|networks-view|draft-mode)$/;

let dir = flag("storybook", "");
if (!dir) {
  dir = path.join(REPO, ".theme-guard/legibility/storybook");
  console.log(`› building Storybook → ${path.relative(REPO, dir)}`);
  execFileSync(
    "npx",
    [
      "storybook",
      "build",
      "--test",
      "--quiet",
      "--disable-telemetry",
      "-o",
      dir,
    ],
    {
      cwd: REPO,
      stdio: ["ignore", "ignore", "inherit"],
    },
  );
}

const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const stories = Object.values(index.entries).filter(
  (e) => e.type === "story" && e.id.startsWith(filter) && VIEWS.test(e.id),
);
const allow = fs.existsSync(ALLOW)
  ? JSON.parse(fs.readFileSync(ALLOW, "utf8"))
  : {};
const server = await serve(dir);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.THEME_GUARD_CHROMIUM || undefined,
  args: [
    "--hide-scrollbars",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ],
});

const results = {};
const errors = [];
for (const theme of themes) {
  for (const vw of widths) {
    const context = await browser.newContext({
      viewport: { width: vw, height: 960 },
      reducedMotion: "reduce",
      timezoneId: "UTC",
      locale: "en-US",
    });
    const page = await context.newPage();
    for (const s of stories) {
      const key = `${s.id}@${vw}:${theme}`;
      try {
        results[key] = await measure(page, s, theme);
      } catch (e) {
        errors.push(`${key}: ${String(e.message).split("\n")[0]}`);
      }
    }
    await context.close();
  }
}
await browser.close();
server.close();

const fails = [];
const nextAllow = {};
const rows = [];
for (const [key, r] of Object.entries(results)) {
  const tooSmall = r.minFont !== null && r.minFont < MIN;
  const allowed = allow[key] !== undefined && r.minFont >= allow[key] - 0.3;
  const fontOk = !tooSmall || allowed;
  const chromeOk = r.underChrome === 0;
  rows.push(
    `${fontOk && chromeOk ? "✓" : "✗"} ${key}  zoom ${r.zoom?.toFixed(
      2,
    )}  min ${r.minFont}px (${r.minFontText})  under chrome ${
      r.underChrome
    }  nodes ${r.nodes}` +
      (tooSmall && allowed ? `  [allowlisted at ${allow[key]}px]` : ""),
  );
  if (tooSmall) nextAllow[key] = r.minFont;
  if (!fontOk)
    fails.push(
      `${key}: smallest text ${r.minFont}px (${r.minFontText}) < ${MIN}px`,
    );
  if (!chromeOk)
    fails.push(`${key}: ${r.underChrome} node(s) under the chrome`);
}
rows.sort().forEach((l) => console.log(l));
if (report)
  fs.writeFileSync(report, JSON.stringify({ results, min: MIN }, null, 2));
if (update) {
  fs.writeFileSync(ALLOW, JSON.stringify(sortKeys(nextAllow), null, 2) + "\n");
  console.log(
    `allowlist rewritten with ${
      Object.keys(nextAllow).length
    } entries → review the diff`,
  );
}
if (errors.length)
  console.log(`\ncould not measure:\n  ${errors.join("\n  ")}`);
if (fails.length && !update) {
  console.error(
    `\ngraph-legibility: ${fails.length} failure(s)\n  ${fails.join("\n  ")}`,
  );
  process.exit(1);
}
console.log(
  `graph-legibility: ${
    Object.keys(results).length
  } measurement(s) OK (min ${MIN}px)` +
    (errors.length ? `, ${errors.length} unmeasured` : ""),
);
process.exit(errors.length ? 1 : 0);

async function measure(page, story, theme) {
  const url = `${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};flavor:selfhosted`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".react-flow__node").length > 0 &&
      !document.querySelector(".cc-prefit"),
    null,
    { timeout: 40_000 },
  );
  // The story's play function ends with the first fit; give the camera a moment.
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const vp = document.querySelector(".react-flow__viewport");
    const m = /scale\(([\d.]+)\)/.exec(vp?.style.transform ?? "");
    const zoom = m ? Number(m[1]) : null;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    let minFont = null;
    let minFontText = "";
    const nodes = [...document.querySelectorAll(".react-flow__node")].filter(
      visible,
    );
    for (const node of nodes) {
      for (const el of node.querySelectorAll("[data-graph-text]")) {
        if (!visible(el)) continue;
        const px = parseFloat(getComputedStyle(el).fontSize) * (zoom ?? 1);
        if (minFont === null || px < minFont) {
          minFont = Math.round(px * 10) / 10;
          minFontText = el.getAttribute("data-graph-text") ?? "";
        }
      }
    }
    const chrome = [
      ...document.querySelectorAll(
        ".nb-graph-chrome, .nb-graph-dock, .nb-pageheader",
      ),
    ]
      .filter(visible)
      .map((el) => el.getBoundingClientRect());
    const underChrome = nodes.filter((n) => {
      const r = n.getBoundingClientRect();
      return chrome.some(
        (c) =>
          r.top < c.bottom &&
          r.bottom > c.top &&
          r.left < c.right &&
          r.right > c.left,
      );
    }).length;
    return { zoom, minFont, minFontText, underChrome, nodes: nodes.length };
  });
}

function sortKeys(o) {
  return Object.fromEntries(
    Object.entries(o).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function serve(root) {
  const MIME = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
  };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const file = path.join(root, decodeURIComponent(req.url.split("?")[0]));
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          "content-type":
            MIME[path.extname(file)] ?? "application/octet-stream",
        });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}
