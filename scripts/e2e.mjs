// End-to-end check of every widget type, in a real Chrome:
//   1. the builder connects to a dummy-mode Worker,
//   2. it generates the snippet for each widget type,
//   3. the snippet runs on a page of its own, like a website,
//   4. the result must match the builder's preview, with no raw {tags},
//   5. a second visit with the Worker blocked shows the browser's last copy.
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
page.on('console', (m) => m.type() === 'warn' && /Vue warn/.test(m.text()) && errors.push(`builder: ${m.text()}`));
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
  await page.waitForFunction(() => document.querySelector('#snippet')?.textContent.includes('data-hosp-worker'));
  const snippet = await page.$eval('#snippet', (el) => el.textContent);

  const html = `<!doctype html><html><body>${snippet.replace(/src="https:\/\/cdn\.jsdelivr\.net[^"]+"/, `src="${widgetSrc}"`)}</body></html>`;
  const visible2 = visible.toString();
  const run = async (context, blockWorker) => {
    const p = await context.newPage();
    p.on('pageerror', (e) => errors.push(`${type} page: ${e.message}`));
    await p.goto(`${WORKER}/api/host`, { waitUntil: 'domcontentloaded' }); // an http origin without scripts
    if (blockWorker) {
      await p.setRequestInterception(true);
      p.on('request', (r) => (r.url().startsWith(`${WORKER}/api/`) ? r.abort() : r.continue()));
    }
    await p.setContent(html, { waitUntil: 'load' });
    await p.waitForFunction(() => /^(live|cached|unavailable)$/.test(document.querySelector('[data-hosp], [data-hosp-template]')?.getAttribute('data-hosp-state') || ''), { timeout: 15000 }).catch(() => {});
    const out = await p.$eval('[data-hosp], [data-hosp-template]', (el, fn) => ({ state: el.getAttribute('data-hosp-state'), text: new Function('el', `return (${fn})(el)`)(el) }), visible2);
    await p.close();
    return out;
  };

  // A first visit, then a second one with the Worker unreachable: the browser's copy takes over.
  const live = await run(browser.defaultBrowserContext(), false);
  const offline = await run(browser.defaultBrowserContext(), true);
  const state = live.state;
  const rendered = live.text;
  const fallback = offline.text;
  const offlineState = offline.state;

  const problems = [];
  if (state !== 'live') problems.push(`state is ${state}`);
  if (offlineState !== 'cached') problems.push(`offline state is ${offlineState}`);
  if (fallback !== preview) problems.push('cached copy differs from the preview');
  if (!snippet.includes('<template') && snippet.trim().split('\n').length !== 2) problems.push('snippet is not one element and one script');
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

// A designed widget: a preset with Google fonts, a changed option and a display choice.
{
  await page.$eval('.step[data-step="design"]', (b) => b.click());
  await page.waitForSelector('.type[data-type="amenities"]');
  await page.$eval('.type[data-type="amenities"]', (b) => b.click());
  await page.waitForSelector('.preset');
  // Terracotta: DM Sans and Lora fonts, no card border.
  await page.$$eval('.preset', (els) => els.find((b) => b.textContent.includes('Terracotta')).click());
  await page.$eval('#o-heading', (el) => { el.value = 'Inside the villa & more'; el.dispatchEvent(new Event('input')); });
  await page.$eval('#o-amenities-limit', (el) => { el.value = '4'; el.dispatchEvent(new Event('input')); });
  await new Promise((r) => setTimeout(r, 800));
  const preview = await text('#preview');
  await page.$eval('.step[data-step="copy"]', (b) => b.click());
  await page.waitForFunction(() => document.querySelector('#snippet')?.textContent.includes('data-hosp-style'));
  const snippet = await page.$eval('#snippet', (el) => el.textContent);
  const p = await browser.newPage();
  await p.goto(`${WORKER}/api/host`, { waitUntil: 'domcontentloaded' });
  await p.setContent(`<!doctype html><html><body>${snippet.replace(/src="https:\/\/cdn\.jsdelivr\.net[^"]+"/, `src="${widgetSrc}"`)}</body></html>`, { waitUntil: 'load' });
  await p.waitForFunction(() => document.querySelector('[data-hosp]')?.getAttribute('data-hosp-state') === 'live', { timeout: 15000 }).catch(() => {});
  const got = await p.$eval('[data-hosp]', (el, fn) => new Function('el', `return (${fn})(el)`)(el), visible.toString());
  const css = await p.$eval('[data-hosp]', (el) => [...el.shadowRoot.querySelectorAll('style')].map((x) => x.textContent).join(''));
  const font = await p.$eval('link[data-hosp-font]', (l) => l.href).catch(() => '');
  await p.close();
  const ok = got === preview && css.includes('--hw-accent:#c2410c') && /DM\+Sans/.test(font) && /Lora/.test(font) && snippet.includes('data-hosp-options=');
  console.log(`${ok ? '✓' : '✗'} designed widget (preset, fonts, options) matches the preview`);
  if (!ok) {
    failed++;
    console.log(`    preview: ${preview.slice(0, 120)}\n    snippet: ${got.slice(0, 120)}\n    font: ${font}`);
  }
}

// A first-time visitor while the Worker is down sees a short message.
{
  const context = await browser.createBrowserContext();
  const p = await context.newPage();
  await p.goto(`${WORKER}/api/host`, { waitUntil: 'domcontentloaded' });
  await p.setRequestInterception(true);
  p.on('request', (r) => (r.url().startsWith(`${WORKER}/api/`) ? r.abort() : r.continue()));
  await p.setContent(`<!doctype html><html><body><div data-hosp="description" data-hosp-worker="${WORKER}" data-hosp-property="x" data-hosp-data="property" data-hosp-modules=""></div><script src="${widgetSrc}" defer></script></body></html>`, { waitUntil: 'load' });
  await p.waitForFunction(() => document.querySelector('[data-hosp]')?.getAttribute('data-hosp-state'), { timeout: 15000 }).catch(() => {});
  const state = await p.$eval('[data-hosp]', (el) => el.getAttribute('data-hosp-state'));
  console.log(`${state === 'unavailable' ? '✓' : '✗'} first visit, Worker down → ${state}`);
  if (state !== 'unavailable') failed++;
  await context.close();
}

await browser.close();
if (errors.length) console.log(errors.join('\n'));
console.log(failed || errors.length ? `\n${failed} widget(s) failed` : '\nAll widgets match their preview.');
process.exit(failed || errors.length ? 1 : 0);
