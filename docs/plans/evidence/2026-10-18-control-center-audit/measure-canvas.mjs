// Measures a few facts about the Control Center canvas as rendered in the
// static Storybook build at 1440x960: final zoom, effective on-screen font
// sizes, chrome/node overlap in draft mode, edge count. Prints JSON.
// Usage: node metrics.mjs <storybook-static>
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { chromium } from "@playwright/test";

const [dir] = process.argv.slice(2);
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff",
};
const server = http.createServer((req, res) => {
  const file = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    res.end(data);
  });
}).listen(0, "127.0.0.1");
await new Promise((r) => server.on("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

async function measure(id, theme = "light", vp = [1440, 960]) {
  const context = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};flavor:selfhosted`, { waitUntil: "domcontentloaded" });
  try {
    await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length > 0 && !document.querySelector(".cc-prefit"), null, { timeout: 30_000 });
  } catch {}
  await page.waitForTimeout(2500);
  const data = await page.evaluate(() => {
    const vpEl = document.querySelector(".react-flow__viewport");
    const m = /scale\(([\d.]+)\)/.exec(vpEl?.style.transform ?? "");
    const zoom = m ? Number(m[1]) : null;
    const px = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : null);
    const policyPort = document.querySelector('.react-flow__node[data-id^="policy-"] .font-mono');
    const policyName = document.querySelector('.react-flow__node[data-id^="policy-"] .truncate');
    const groupTitle = document.querySelector('.cc-group-node .text-nb-gray-200, .cc-group-node [class*="text-nb-gray-200"]');
    const groupSub = document.querySelector('.cc-group-node [class*="text-nb-gray-400"]');
    const deviceName = document.querySelector('.react-flow__node [class*="text-\\[0\\.85rem\\]"]');
    const nodes = [...document.querySelectorAll(".react-flow__node")];
    const edges = document.querySelectorAll(".react-flow__edge").length;
    const pane = document.querySelector(".react-flow")?.getBoundingClientRect();
    const rects = nodes.map((n) => n.getBoundingClientRect());
    const minY = Math.min(...rects.map((r) => r.top));
    const maxY = Math.max(...rects.map((r) => r.bottom));
    const minX = Math.min(...rects.map((r) => r.left));
    const maxX = Math.max(...rects.map((r) => r.right));
    // chrome at the top of the canvas (absolute header row)
    const header = document.querySelector('[data-testid="cc-mode-live"]')?.closest(".absolute");
    const hb = header?.getBoundingClientRect();
    const overlapping = hb ? nodes.filter((n) => { const r = n.getBoundingClientRect(); return r.top < hb.bottom && r.bottom > hb.top && r.left < hb.right && r.right > hb.left; }).length : 0;
    const bgColor = getComputedStyle(document.querySelector(".react-flow__background") ?? document.body).backgroundColor;
    const edgeStrokes = [...new Set([...document.querySelectorAll(".react-flow__edge path")].map((p) => p.style.stroke || p.getAttribute("stroke")).filter(Boolean))];
    const fontMonoCount = document.querySelectorAll(".react-flow__node .font-mono").length;
    return {
      zoom, nodes: nodes.length, edges, edgeStrokes, canvasBg: bgColor,
      effectivePx: {
        policyPort: policyPort && zoom ? +(px(policyPort) * zoom).toFixed(1) : null,
        policyName: policyName && zoom ? +(px(policyName) * zoom).toFixed(1) : null,
        groupTitle: groupTitle && zoom ? +(px(groupTitle) * zoom).toFixed(1) : null,
        groupSub: groupSub && zoom ? +(px(groupSub) * zoom).toFixed(1) : null,
        deviceName: deviceName && zoom ? +(px(deviceName) * zoom).toFixed(1) : null,
      },
      pane: pane && { w: Math.round(pane.width), h: Math.round(pane.height) },
      usedBox: { w: Math.round(maxX - minX), h: Math.round(maxY - minY), top: Math.round(minY), left: Math.round(minX) },
      headerBox: hb && { top: Math.round(hb.top), bottom: Math.round(hb.bottom) },
      nodesUnderHeader: overlapping,
      fontMonoCount,
    };
  });
  await context.close();
  return { id, theme, vp: vp.join("x"), ...data };
}

const out = [];
for (const id of ["peers-view", "networks-view", "groups-view", "users-view", "draft-mode"]) {
  out.push(await measure(`pages-core-controlcenter--${id}`));
}
out.push(await measure("pages-core-controlcenter--peers-view", "dark"));
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
