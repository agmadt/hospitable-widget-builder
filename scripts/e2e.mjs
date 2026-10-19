// End-to-end check of every widget type, in a real Chrome:
//   1. the builder connects to a dummy-mode Worker,
//   2. it generates the snippet for each widget type,
//   3. the snippet runs on a page of its own, like a website,
//   4. the result must match the builder's preview, with no raw {tags}.
// Needs the Worker (npm run dev in the kit, with HOSPITABLE_PAT=dummy) and
// the builder (npm run dev) running. Set CHROME_PATH if Chrome lives elsewhere.

import puppeteer from 'puppeteer-core';

const BUILDER = process.env.BUILDER || 'http://127.0.0.1:5173/';
const WORKER = process.env.WORKER || 'http://127.0.0.1:8787';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const widgetSrc = new URL('/hosp/widget.js', BUILDER).href;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`builder: ${e.message}`));
await page.goto(BUILDER, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto(`${BUILDER}?worker=${encodeURIComponent(WORKER)}`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.prop[aria-checked="true"]');

// Visible text only: <style> blocks are compacted in the snippet.
const visible = (el) => {
  if (!el.shadowRoot) return '';
  const copy = document.createElement('div');
  copy.innerHTML = el.shadowRoot.innerHTML;
  copy.querySelectorAll('style').forEach((s) => s.remove());
  return copy.textContent.replace(/\s+/g, ' ').trim();
};
const text = (sel) => page.$eval(sel, (el, fn) => new Function('el', `return (${fn})(el)`)(el), visible.toString());
await page.click('.step[data-step="design"]');
const types = await page.$$eval('.type', (els) => els.map((e) => e.dataset.type));
if (types.length !== 16) {
  console.log(`Expected 16 widget types, found ${types.length}`);
  process.exit(1);
}
let failed = 0;

for (const type of types) {
  await page.click('.step[data-step="design"]');
  await page.click(`.type[data-type="${type}"]`);
  await page.waitForFunction(() => document.querySelector('#preview').getAttribute('data-hosp-state') === 'dummy' && !document.querySelector('#preview').classList.contains('loading'));
  await new Promise((r) => setTimeout(r, 200));
  const preview = await text('#preview');
  await page.click('.step[data-step="copy"]');
  await page.waitForFunction(() => document.querySelector('#snippet')?.textContent.includes('data-hosp-template'));
  const snippet = await page.$eval('#snippet', (el) => el.textContent);

  const site = await browser.newPage();
  site.on('pageerror', (e) => errors.push(`${type} page: ${e.message}`));
  await site.goto(`${WORKER}/api/host`, { waitUntil: 'domcontentloaded' }); // any http origin without scripts
  await site.setContent(`<!doctype html><html><body>${snippet.replace(/src="https:\/\/cdn\.jsdelivr\.net[^"]+"/, `src="${widgetSrc}"`)}</body></html>`, { waitUntil: 'load' });
  await site.waitForFunction(() => document.querySelector('[data-hosp-template]')?.getAttribute('data-hosp-state') === 'live', { timeout: 10000 }).catch(() => {});
  const state = await site.$eval('[data-hosp-template]', (el) => el.getAttribute('data-hosp-state'));
  const rendered = await site.$eval('[data-hosp-template]', (el, fn) => new Function('el', `return (${fn})(el)`)(el), visible.toString());
  await site.close();

  // Same snippet with the Worker unreachable: the fallback snapshot must take over.
  const offline = await browser.newPage();
  await offline.goto(`${WORKER}/api/host`, { waitUntil: 'domcontentloaded' });
  await offline.setContent(`<!doctype html><html><body>${snippet.replace(/src="https:\/\/cdn\.jsdelivr\.net[^"]+"/, `src="${widgetSrc}"`).replace(/data-hosp-worker="[^"]*"/, 'data-hosp-worker="http://127.0.0.1:9"')}</body></html>`, { waitUntil: 'load' });
  await offline.waitForFunction(() => document.querySelector('[data-hosp-template]')?.getAttribute('data-hosp-state') === 'snapshot', { timeout: 10000 }).catch(() => {});
  const offlineState = await offline.$eval('[data-hosp-template]', (el) => el.getAttribute('data-hosp-state'));
  const fallback = await offline.$eval('[data-hosp-template]', (el, fn) => new Function('el', `return (${fn})(el)`)(el), visible.toString());
  await offline.close();

  const problems = [];
  if (state !== 'live') problems.push(`state is ${state}`);
  if (offlineState !== 'snapshot') problems.push(`offline state is ${offlineState}`);
  // The calendar snapshot keeps three months only, on purpose.
  if (type !== 'calendar' && fallback !== preview) problems.push('fallback differs from the preview');
  if (rendered !== preview) problems.push('differs from the preview');
  if (/\{[#^/]?[a-z_][\w.]*\}/i.test(rendered)) problems.push('shows a raw {tag}');
  if (rendered.length < 10) problems.push('rendered almost nothing');
  console.log(`${problems.length ? '✗' : '✓'} ${type.padEnd(16)} ${(snippet.length / 1024).toFixed(1).padStart(5)} KB  ${problems.join(', ')}`);
  if (problems.length) {
    failed++;
    if (rendered !== preview) console.log(`    preview:  ${preview.slice(0, 160)}\n    snippet:  ${rendered.slice(0, 160)}`);
    if (fallback !== preview) console.log(`    preview:  ${preview.slice(0, 160)}\n    fallback: ${fallback.slice(0, 160)}`);
  }
}

await browser.close();
if (errors.length) console.log(errors.join('\n'));
console.log(failed || errors.length ? `\n${failed} widget(s) failed` : '\nAll widgets match their preview.');
process.exit(failed || errors.length ? 1 : 0);
