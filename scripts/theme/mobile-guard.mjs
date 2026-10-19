#!/usr/bin/env node
// Overflow guard for the AntD theme (light and dark colour mode), phones,
// tablets AND desktops. Opens every page story at each width and measures how
// far the page can be scrolled sideways (document + PageContainer scroller).
// Fails when a story overflows more than scripts/theme/mobile-allow.json
// allows. Desktop widths (--desktop-vp, default 1280,1440: the layout-mode
// boundary and the common laptop width with the sider open) catch toolbars
// and tables that push the primary action off screen; only the overflow
// check runs there.
// Below 768px it also checks the layout (not allowlistable):
//   - no flex row shows two tall (>= 150px) blocks side by side (detail
//     pages' info card + groups/role column must stack);
//   - every visible table with a header row is laid out as cards.
// Passes: light at --vp (375,390,768), dark at --dark-vp (390), the
// detail-page stories (id matches --narrow-filter, "detail") at 360 light+dark,
// and light at --desktop-vp (1280,1440).
// Allowlist keys: <story>@<width> (light), <story>@<width>:dark.
//
//   node scripts/theme/mobile-guard.mjs                    # builds Storybook first
//   node scripts/theme/mobile-guard.mjs --storybook <dir>  # reuse a static build
//   options: --vp 375,390,768  --dark-vp 390  --narrow-vp 360  --narrow-filter detail
//            --desktop-vp 1280,1440  --filter pages-  --concurrency N  --update
//            --report <file.json>
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
const list = (v) => (v ? v.split(",").map(Number) : []);
const narrowRe = new RegExp(flag("narrow-filter", "detail"));
const passes = [
  ...list(flag("vp", "375,390,768")).map((vw) => ({ vw, theme: "light" })),
  ...list(flag("dark-vp", "390")).map((vw) => ({ vw, theme: "dark" })),
  ...list(flag("narrow-vp", "360")).flatMap((vw) => [
    { vw, theme: "light", only: narrowRe },
    { vw, theme: "dark", only: narrowRe },
  ]),
  ...list(flag("desktop-vp", "1280,1440")).map((vw) => ({ vw, theme: "light" })),
];
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
  // Escape hatch for machines that cannot download the pinned browser
  // (offline runners, sandboxes with a preinstalled Chromium).
  executablePath: process.env.THEME_GUARD_CHROMIUM || undefined,
  args: ["--hide-scrollbars", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"],
});

const measured = {};
const layout = {};
const errors = [];
for (const { vw, theme, only } of passes) {
  const suffix = theme === "dark" ? ":dark" : "";
  const passStories = only ? stories.filter((s) => only.test(s.id)) : stories;
  const queue = [...passStories];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const context = await browser.newContext({
        viewport: { width: vw, height: vw < 700 ? 812 : vw < 1280 ? 1024 : 900 },
        isMobile: vw < 700,
        hasTouch: vw < 1280,
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
        const key = `${s.id}@${vw}${suffix}`;
        // One retry on a fresh page: a load that failed under machine load (a
        // 404 from the static server out of file handles, a hung render) is
        // not a layout fact. A story that still cannot be measured fails the
        // run below: a screen the guard never saw is not green.
        for (let attempt = 1; ; attempt++) {
          try {
            const r = await withTimeout(measure(page, s, theme), 45_000);
            measured[key] = r.overflow;
            if (vw < 768 && r.layout.length) layout[key] = r.layout;
            break;
          } catch (e) {
            // A hung page would block the rest of this worker's queue.
            await page.close().catch(() => {});
            page = await context.newPage();
            if (attempt === 2) {
              errors.push(`${key}: ${String(e.message).split("\n")[0]}`);
              break;
            }
          }
        }
      }
      await context.close();
    }),
  );
  const mine = (k) => k.endsWith(`@${vw}${suffix}`);
  const over = Object.entries(measured).filter(([k, v]) => mine(k) && v > SLACK).length;
  const bad = Object.keys(layout).filter(mine).length;
  console.log(`› ${vw}px ${theme}: ${passStories.length} stories, ${over} overflow sideways, ${bad} layout problems`);
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
for (const [k, v] of Object.entries(layout)) console.error(`✗ ${k}: ${v.join("; ")}`);
for (const e of errors) console.error(`! ${e}`);
if (errors.length) console.error(`✗ ${errors.length} story screen(s) could not be measured (the ! lines above); rerun, and look at the story if it repeats`);
if (fixed.length) console.log(`fixed, can be removed from mobile-allow.json:\n  ${fixed.join("\n  ")}`);
if (failures.length || Object.keys(layout).length || errors.length) process.exit(1);
console.log(`✓ theme:mobile-guard: no new sideways overflow on phones, tablets or desktops (${Object.keys(allow).length} known, listed in mobile-allow.json)`);

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))),
  ]).finally(() => clearTimeout(timer));
}

async function measure(page, story, theme = "light") {
  const flavor = story.tags?.includes("cloud") ? "cloud" : "selfhosted";
  await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};flavor:${flavor}`, {
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
    if (now === last) break;
    last = now;
  }
  return { overflow: last, layout: await page.evaluate(layoutProblems) };
}

/* Runs in the page. Phone layout problems that do not show up as sideways
   overflow (upstream's squeezed two-column detail pages, wide tables that
   scroll inside their box instead of becoming cards). Skipped while a modal
   is open (the page behind it is not what is being looked at). */
function layoutProblems() {
  const problems = [];
  if (window.innerWidth >= 768 || document.querySelector('[role="dialog"]')) return problems;
  const main = document.querySelector('[class~="overflow-auto"][class~="flex-auto"]') ?? document.body;
  const shown = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const name = (el) => `<${el.tagName.toLowerCase()} class="${String(el.className?.baseVal ?? el.className).slice(0, 60)}">`;
  for (const el of main.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (!cs.display.includes("flex") || !cs.flexDirection.startsWith("row")) continue;
    const tall = [...el.children].filter(shown).map((k) => k.getBoundingClientRect()).filter((r) => r.height >= 150 && r.width >= 80);
    for (let i = 1; i < tall.length; i++) {
      const [a, b] = [tall[i - 1], tall[i]];
      if (b.left >= a.right - 1 && Math.abs(b.top - a.top) < a.height / 2) {
        problems.push(`columns side by side (${Math.round(a.width)}px | ${Math.round(b.width)}px) in ${name(el)}`);
        break;
      }
    }
  }
  for (const t of main.querySelectorAll("table")) {
    const row = t.querySelector("tbody > tr");
    if (!shown(t) || !t.querySelector("thead th") || !row) continue;
    if (getComputedStyle(row).display === "table-row")
      problems.push(`table not shown as cards (${Math.round(t.getBoundingClientRect().width)}px${t.hasAttribute("data-nb-cards") ? "" : ", no data-nb-cards"})`);
  }
  return problems;
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
