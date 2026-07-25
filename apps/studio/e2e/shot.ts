/**
 * Headless screenshot + FPS harness — browser verification without the Chrome MCP.
 *
 * Drives a local chromium (already installed for `bunx playwright test`) so visual
 * and perf checks stop depending on the Chrome extension being connected.
 *
 * Usage:
 *   bun run shot -- <url> [options]
 *
 *   bun run shot -- https://studio.buildwithoracle.com/map
 *   bun run shot -- "https://v4.buildwithoracle.com/?host=http://localhost:47778"
 *   bun run shot -- https://studio.buildwithoracle.com/map --fps 5 --drag
 *   bun run shot -- http://localhost:47778/graph --out /tmp/graph.png --full
 *
 * Options:
 *   --out FILE     Screenshot path (default: apps/studio/.shots/<slug>.png)
 *   --fps SECONDS  Measure frame rate over N seconds via requestAnimationFrame
 *   --drag         While measuring fps, drag across the page to rotate the globe
 *   --wait MS      Extra settle time after network idle (default: 1500)
 *   --width N      Viewport width (default: 1440)
 *   --height N     Viewport height (default: 900)
 *   --full         Full-page screenshot instead of viewport
 *   --no-shot      Skip the screenshot (fps only)
 */
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

type Args = {
  url: string;
  out: string;
  fps: number;
  drag: boolean;
  wait: number;
  width: number;
  height: number;
  full: boolean;
  shot: boolean;
  headed: boolean;
};

function parseArgs(argv: string[]): Args {
  const a = argv.slice(2);
  const url = a.find((x) => !x.startsWith('--'));
  if (!url) {
    console.error('error: a URL is required.\n  bun run shot -- <url> [--fps 5] [--drag] [--out file.png]');
    process.exit(1);
  }
  const flag = (name: string) => {
    const i = a.indexOf(`--${name}`);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const has = (name: string) => a.includes(`--${name}`);

  const slug =
    url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'shot';

  return {
    url,
    out: resolve(flag('out') ?? `${import.meta.dirname}/../.shots/${slug}.png`),
    fps: flag('fps') ? Number(flag('fps')) : 0,
    drag: has('drag'),
    wait: flag('wait') ? Number(flag('wait')) : 1500,
    width: flag('width') ? Number(flag('width')) : 1440,
    height: flag('height') ? Number(flag('height')) : 900,
    full: has('full'),
    shot: !has('no-shot'),
    headed: has('headed'),
  };
}

/** Runs in the page: counts rAF frames over `secs`, reports fps + jank. */
function measureFps(secs: number) {
  return new Promise<{ frames: number; seconds: number; fps: number; longFrames: number; maxGapMs: number }>(
    (res) => {
      let frames = 0;
      let longFrames = 0;
      let maxGap = 0;
      let last = performance.now();
      const start = last;
      function tick(now: number) {
        const gap = now - last;
        last = now;
        if (frames > 0) {
          if (gap > 33) longFrames++; // slower than ~30fps this frame
          if (gap > maxGap) maxGap = gap;
        }
        frames++;
        if (now - start < secs * 1000) requestAnimationFrame(tick);
        else {
          const elapsed = (now - start) / 1000;
          res({ frames, seconds: elapsed, fps: frames / elapsed, longFrames, maxGapMs: maxGap });
        }
      }
      requestAnimationFrame(tick);
    },
  );
}

/** Drags the mouse back and forth across the viewport to spin the 3D globe. */
async function spin(page: import('@playwright/test').Page, durationMs: number, w: number, h: number) {
  const cy = Math.round(h / 2);
  const x0 = Math.round(w * 0.35);
  const x1 = Math.round(w * 0.65);
  await page.mouse.move(x0, cy);
  await page.mouse.down();
  const end = Date.now() + durationMs;
  let dir = 1;
  let x = x0;
  while (Date.now() < end) {
    x += dir * 40;
    if (x >= x1 || x <= x0) dir *= -1;
    await page.mouse.move(x, cy, { steps: 3 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
}

async function main() {
  const args = parseArgs(process.argv);
  // Allow the deployed https studio to fetch http://localhost backends. Headless
  // Chrome otherwise blocks loopback via CORS + Private Network Access. Disabling
  // web security needs a dedicated user-data-dir to take effect, so use a
  // throwaway persistent context. Safe: local verification tool, own machine.
  const userDataDir = mkdtempSync(join(tmpdir(), 'oracle-shot-'));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: !args.headed,
    viewport: { width: args.width, height: args.height },
    args: [
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,IsolateOrigins,site-per-process',
    ],
  });
  const page = ctx.pages()[0] ?? (await ctx.newPage());

  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
  });

  console.log(`→ ${args.url}`);
  // Use 'load', not 'networkidle': a live app polls (health/stats) and never idles.
  const resp = await page.goto(args.url, { waitUntil: 'load', timeout: 30000 }).catch((e) => {
    console.error(`navigation failed: ${e.message}`);
    return null;
  });
  if (resp) console.log(`  HTTP ${resp.status()} · ${await page.title()}`);
  await page.waitForTimeout(args.wait); // settle: data fetch + 3D scene build

  if (args.fps > 0) {
    console.log(`⏱  measuring fps over ${args.fps}s${args.drag ? ' (dragging to rotate)' : ''}…`);
    const fpsPromise = page.evaluate(measureFps, args.fps);
    if (args.drag) await spin(page, args.fps * 1000, args.width, args.height);
    const r = await fpsPromise;
    console.log(
      `  fps: ${r.fps.toFixed(1)} avg · ${r.frames} frames / ${r.seconds.toFixed(1)}s · ` +
        `jank: ${r.longFrames} long frames · worst gap ${r.maxGapMs.toFixed(0)}ms`,
    );
  }

  if (args.shot) {
    mkdirSync(dirname(args.out), { recursive: true });
    await page.screenshot({ path: args.out, fullPage: args.full });
    console.log(`📸 ${args.out}`);
  }

  if (errors.length) {
    console.log(`⚠  ${errors.length} console/page error(s):`);
    for (const e of errors.slice(0, 15)) console.log(`   ${e}`);
  } else {
    console.log('✓ no console/page errors');
  }

  await ctx.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
