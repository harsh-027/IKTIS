import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..', '..');
const baseURL = 'http://127.0.0.1:4178';
await mkdir(directory, { recursive: true });
const server = spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { cwd: root, stdio: 'ignore' });
let browser;
const results = { startedAt: new Date().toISOString(), baseURL, checks: [], consoleErrors: [], failedRequests: [], videoEvents: [] };

try {
  let ready = false;
  for (let i = 0; i < 60; i += 1) {
    try { const response = await fetch(baseURL); if (response.ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Vite server did not become ready');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') results.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => results.consoleErrors.push(error.message));
  page.on('requestfailed', (request) => results.failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  await page.addInitScript(() => {
    window.__videoEvents = [];
    for (const eventName of ['loadedmetadata', 'loadeddata', 'canplay', 'seeked', 'error', 'stalled', 'waiting']) {
      document.addEventListener(eventName, (event) => { if (event.target instanceof HTMLVideoElement) window.__videoEvents.push({ event: eventName, time: event.target.currentTime, readyState: event.target.readyState }); }, true);
    }
  });
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(directory, 'initial.png'), fullPage: false });
  const initial = await page.locator('video').evaluate((v) => ({ readyState: v.readyState, currentTime: v.currentTime, duration: v.duration, poster: v.poster, posterLayerOpacity: getComputedStyle(v.parentElement.children[0]).opacity }));
  results.checks.push({ name: 'initial-load', ...initial });

  const samples = [];
  for (const [name, y] of [['forward-20', 0.2], ['forward-55', 0.55], ['forward-90', 0.9], ['backward-35', 0.35], ['rapid-80', 0.8], ['rapid-10', 0.1]]) {
    await page.evaluate((ratio) => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ratio), y);
    await page.waitForTimeout(name.startsWith('rapid') ? 180 : 850);
    const sample = await page.locator('video').evaluate((v) => ({ currentTime: v.currentTime, duration: v.duration, readyState: v.readyState, seeking: v.seeking, canvasOpacity: getComputedStyle(document.querySelector('canvas')).opacity }));
    samples.push({ name, ...sample });
    await page.screenshot({ path: path.join(directory, `${name}.png`), fullPage: false });
  }
  results.checks.push({ name: 'scroll-samples', samples });

  await page.waitForTimeout(45000);
  const completed = await page.locator('canvas').evaluate((canvas) => ({ opacity: getComputedStyle(canvas).opacity, width: canvas.width, height: canvas.height }));
  results.checks.push({ name: 'cache-after-45s', ...completed });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.65));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(directory, 'after-cache.png'), fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.45));
  await page.waitForTimeout(1000);
  results.checks.push({ name: 'mobile-390', ...(await page.locator('video').evaluate((v) => ({ currentTime: v.currentTime, duration: v.duration, canvasOpacity: getComputedStyle(document.querySelector('canvas')).opacity, viewportWidth: innerWidth, docWidth: document.documentElement.scrollWidth }))) });
  await page.screenshot({ path: path.join(directory, 'mobile-390.png'), fullPage: false });
  results.videoEvents = await page.evaluate(() => window.__videoEvents);
} catch (error) {
  results.fatalError = error.stack || String(error);
} finally {
  results.finishedAt = new Date().toISOString();
  await writeFile(path.join(directory, 'results.json'), JSON.stringify(results, null, 2));
  await writeFile(path.join(directory, 'console-errors.json'), JSON.stringify(results.consoleErrors, null, 2));
  await writeFile(path.join(directory, 'network-failures.json'), JSON.stringify(results.failedRequests, null, 2));
  await browser?.close();
  server.kill();
}
console.log(JSON.stringify(results, null, 2));
if (results.fatalError) process.exitCode = 1;
