#!/usr/bin/env node
// Phone/tablet overflow guard for the AntD light theme.
// Opens every page story at phone and tablet widths and measures how far the
// page can be scrolled sideways (document + PageContainer scroller). Fails when
// a story overflows more than scripts/theme/mobile-allow.json allows.
//
//   node scripts/theme/mobile-guard.mjs                    # builds Storybook first
//   node scripts/theme/mobile-guard.mjs --storybook <dir>  # reuse a static build
//   options: --vp 375,390,768  --filter pages-  --concurrency N  --update  --report <file.json>
// --update rewrites the allowlist with today's numbers (review the diff!).
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ALLOW = path.join(REPO, "scripts/theme/mobile-allow.json");
const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const viewports = flag("vp", "375,390,768").split(",").map(Number);
const filter = flag("filter", "pages-");
const concurrency = Number(flag("concurrency", Math.min(6, os.availableParallelism())));
const update = args.includes("--update");
const SLACK = 4; // px: sub-pixel rounding and font differences between machines

let dir = flag("storybook", "");
if (!dir) {
  dir = path.join(REPO, ".theme-guard/mobile/storybook");
  console.log(`› building Storybook → ${path.relative(REPO, dir)}`);
  execFileSync("npx", ["storybook", "build", "--test", "--quiet", "--disable-telemetry", "-o", dir], {
    cwd: REPO,
    stdio: ["ignore", "ignore", "inherit"],
  });
}

const index = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8"));
const stories = Object.values(index.entries).filter((e) => e.type === "story" && e.id.startsWith(filter));
const allow = fs.existsSync(ALLOW) ? JSON.parse(fs.readFileSync(ALLOW, "utf8")) : {};
const server = await serve(dir);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  args: ["--hide-scrollbars", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

const measured = {};
const errors = [];
for (const vw of viewports) {
  const queue = [...stories];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const context = await browser.newContext({
        viewport: { width: vw, height: vw < 700 ? 812 : 1024 },
        isMobile: vw < 700,
        hasTouch: true,
        reducedMotion: "reduce",
        timezoneId: "UTC",
        locale: "en-US",
      });
      await context.addInitScript(() => {
        // Fixed clock, as in the visual-regression capture.
        const RealDate = Date, start = performance.now(), now = Date.parse("2026-10-08T12:00:00Z");
        // eslint-disable-next-line no-global-assign
        Date = class extends RealDate {
          constructor(...a) { super(...(a.length ? a : [now + performance.now() - start])); }
          static now() { return now + performance.now() - start; }
        };
      });
      let page = await context.newPage();
      for (let s = queue.shift(); s; s = queue.shift()) {
        try {
          measured[`${s.id}@${vw}`] = await withTimeout(measure(page, s), 45_000);
        } catch (e) {
          errors.push(`${s.id}@${vw}: ${String(e.message).split("\n")[0]}`);
          // A hung page would block the rest of this worker's queue.
          await page.close().catch(() => {});
          page = await context.newPage();
        }
      }
      await context.close();
    }),
  );
  const over = Object.entries(measured).filter(([k, v]) => k.endsWith(`@${vw}`) && v > SLACK).length;
  console.log(`› ${vw}px: ${stories.length} stories, ${over} overflow sideways`);
}
await browser.close();
server.close();

const report = flag("report", "");
if (report) fs.writeFileSync(report, JSON.stringify(measured, null, 1));

if (update) {
  const next = Object.fromEntries(Object.entries(measured).filter(([, v]) => v > SLACK).sort());
  fs.writeFileSync(ALLOW, JSON.stringify(next, null, 2) + "\n");
  console.log(`✓ wrote ${Object.keys(next).length} entries to ${path.relative(REPO, ALLOW)}`);
  process.exit(0);
}

const failures = Object.entries(measured).filter(([k, v]) => v > (allow[k] ?? 0) + SLACK);
const fixed = Object.keys(allow).filter((k) => k in measured && measured[k] <= SLACK);
for (const [k, v] of failures) console.error(`✗ ${k}: page scrolls sideways by ${v}px (allowed ${allow[k] ?? 0})`);
for (const e of errors) console.error(`! ${e}`);
if (fixed.length) console.log(`fixed, can be removed from mobile-allow.json:\n  ${fixed.join("\n  ")}`);
if (failures.length) process.exit(1);
console.log(`✓ theme:mobile-guard: no new sideways overflow (${Object.keys(allow).length} known, listed in mobile-allow.json)`);

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))),
  ]).finally(() => clearTimeout(timer));
}

async function measure(page, story) {
  const flavor = story.tags?.includes("cloud") ? "cloud" : "selfhosted";
  await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:light;flavor:${flavor}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(
    () => ["finished", "completed", "errored", "aborted", "playErrored"].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase),
    undefined,
    { timeout: 20_000, polling: 100 },
  );
  // Same settling as the visual-regression capture: no transitions, finished
  // animations (a modal mid zoom-in is wider than at rest), fonts loaded.
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}",
  });
  await page.evaluate(() => {
    document.getAnimations().forEach((a) => a.finish?.());
    return document.fonts.ready;
  });
  // Mocked data and late layout effects can still shift the page for a few
  // frames: measure until two readings 150ms apart agree.
  let last = -1;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(150);
    const now = await overflow(page);
    if (now === last) return now;
    last = now;
  }
  return last;
}

function overflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement.scrollWidth - window.innerWidth;
    // PageContainer: the dashboard's own scrolling area.
    const main = document.querySelector('[class~="overflow-auto"][class~="flex-auto"]');
    const inner = main ? main.scrollWidth - main.clientWidth : 0;
    return Math.max(0, doc, inner);
  });
}

function serve(root) {
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf" };
  const rootPath = path.resolve(root);
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const file = path.resolve(rootPath, "." + decodeURIComponent(new URL(req.url, "http://x").pathname));
      if (file !== rootPath && !file.startsWith(rootPath + path.sep)) return res.writeHead(404).end();
      const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, "index.html") : file;
      fs.readFile(target, (err, data) => {
        if (err) return res.writeHead(404).end();
        res.writeHead(200, { "content-type": types[path.extname(target)] ?? "application/octet-stream" }).end(data);
      });
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
}
