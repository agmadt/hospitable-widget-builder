// End-to-end check of every widget type, in a real Chrome:
//   1. the builder connects to a dummy-mode Worker,
//   2. it generates the snippet for each widget type,
//   3. the snippet runs on a page of its own, like a website,
//   4. the result must match the builder's preview, with no raw {tags},
//   5. a second visit with the Worker blocked shows the browser's last copy.
// Then the widgets for signed-in guests, as iframes from the Worker on a page
// of another site: one sign-in fills every one of them.
// Needs the Worker (npm run dev in the kit, with HOSPITABLE_PAT=dummy) and
// the builder (npm run dev) running, with the Worker's WIDGET_URL pointing at the
// builder's /hosp/widget.js (node dev.mjs does both). Set CHROME_PATH if Chrome lives elsewhere.

import puppeteer from 'puppeteer-core';

const BUILDER = process.env.BUILDER || 'http://127.0.0.1:5173/';
const WORKER = process.env.WORKER || 'http://127.0.0.1:8787';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const widgetSrc = new URL('/hosp/widget.js', BUILDER).href;

// The guest check's page (localhost) frames the Worker (127.0.0.1): two sites, both on this machine.
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--disable-features=LocalNetworkAccessChecks'] });
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
const types = await page.$$eval('[role="listbox"][aria-label="Widget"] .type', (els) => els.map((e) => e.dataset.type));
const guestTypes = await page.$$eval('[role="listbox"][aria-label="For signed-in guests"] .type', (els) => els.map((e) => e.dataset.type));
if (types.length !== 16 || guestTypes.length !== 8) {
  console.log(`Expected 16 widget types and 8 for signed-in guests, found ${types.length} and ${guestTypes.length}`);
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

// Widgets for signed-in guests: signed out first, then one sign-in fills them all.
{
  const site = `http://localhost:${new URL(BUILDER).port || 80}/__guest-e2e`;
  const frames = guestTypes.map((t) => `<iframe id="${t}" src="${WORKER}/embed/${t}?data=stay&modules=guest" style="display:block;width:100%;height:600px;border:0"></iframe>`).join('');
  const p = await browser.newPage();
  p.on('pageerror', (e) => errors.push(`guest page: ${e.message}`));
  await p.setRequestInterception(true);
  p.on('request', (r) => (r.url() === site ? r.respond({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body>${frames}</body></html>` }) : r.continue()));
  await p.goto(site, { waitUntil: 'networkidle0' });
  const frameOf = async (t) => (await p.$(`#${t}`)).contentFrame();
  const shown = async (t) => (await frameOf(t)).evaluate((fn) => {
    const el = document.querySelector('[data-hosp]');
    return { state: el?.getAttribute('data-hosp-state'), text: el ? new Function('el', `return (${fn})(el)`)(el) : '' };
  }, visible.toString());
  const login = await frameOf('guest-login');
  await login.waitForFunction(() => document.querySelector('[data-hosp]')?.shadowRoot?.querySelector('form'), { timeout: 15000 });
  const out = await shown('door-code');
  await login.evaluate(() => {
    const f = document.querySelector('[data-hosp]').shadowRoot.querySelector('form');
    f.elements.code.value = 'HM4CXJ4KPX';
    f.elements.check.value = 'Moore';
  });
  await (await login.evaluateHandle(() => document.querySelector('[data-hosp]').shadowRoot.querySelector('button[type=submit]'))).click();
  await new Promise((r) => setTimeout(r, 2500));
  const hostKeys = await p.evaluate(() => Object.keys(localStorage));
  const problems = [];
  if (!out.text.includes('Sign in with your booking')) problems.push('door code showed something before signing in');
  if (hostKeys.length) problems.push(`the website's own storage got ${hostKeys.join(', ')}`);
  for (const t of guestTypes) {
    const got = await shown(t);
    if (got.state !== 'live') problems.push(`${t} is ${got.state}`);
    if (/Sign in with your booking|Find your booking/.test(got.text)) problems.push(`${t} still signed out`);
    if (/\{[#^/]?[a-z_][\w.]*\}/i.test(got.text)) problems.push(`${t} shows a raw {tag}`);
  }
  if (!(await shown('door-code')).text.includes('4711')) problems.push('no door code on arrival day');
  console.log(`${problems.length ? '✗' : '✓'} ${guestTypes.length} guest widgets: one sign-in fills every frame${problems.length ? '\n    ' + problems.join('\n    ') : ''}`);
  if (problems.length) failed++;
  await p.close();
}

await browser.close();
if (errors.length) console.log(errors.join('\n'));
console.log(failed || errors.length ? `\n${failed} widget(s) failed` : '\nAll widgets match their preview.');
process.exit(failed || errors.length ? 1 : 0);
