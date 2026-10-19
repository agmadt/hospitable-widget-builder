import { describe, expect, it, vi } from 'vitest';
import { normalizeWorker, connectWorker } from '@/lib/worker';
import { fontLink, onAccent, styleCss, DEFAULT_STYLE } from '@/lib/style';
import { shiftCalendar, sampleData, sampleProperties } from '@/lib/sample';
import { compact, highlight, scriptJson } from '@/lib/html';
import { minimize } from '@/lib/snippet';

describe('worker address', () => {
  it('accepts what hosts paste', () => {
    expect(normalizeWorker('hospitable-widgets.rina.workers.dev')).toBe('https://hospitable-widgets.rina.workers.dev');
    expect(normalizeWorker(' https://x.rina.workers.dev/demo?a=1 ')).toBe('https://x.rina.workers.dev');
    expect(normalizeWorker('http://x.rina.workers.dev')).toBe('https://x.rina.workers.dev');
    expect(normalizeWorker('http://127.0.0.1:8787')).toBe('http://127.0.0.1:8787');
    expect(normalizeWorker('not an address')).toBe('');
    expect(normalizeWorker('')).toBe('');
  });

  it('reads properties, token problems and dead addresses', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify({ mode: 'live', properties: [{ id: 'p1' }], status: { token: 'ok' } })));
    expect(await connectWorker('https://w.dev', ok)).toMatchObject({ ok: true, connection: { worker: 'https://w.dev', mode: 'live' } });
    const rejected = vi.fn(async () => new Response(JSON.stringify({ error: 'unavailable', token: 'rejected' }), { status: 503 }));
    expect(await connectWorker('https://w.dev', rejected)).toEqual({ ok: false, reason: 'token', token: 'rejected' });
    const dead = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await connectWorker('https://w.dev', dead)).toEqual({ ok: false, reason: 'unreachable' });
    const other = vi.fn(async () => new Response('{"hello":1}'));
    expect(await connectWorker('https://w.dev', other)).toEqual({ ok: false, reason: 'not-a-worker', status: 200 });
  });
});

describe('style', () => {
  it('picks readable text on the accent color', () => {
    expect(onAccent('#0f766e')).toBe('#ffffff');
    expect(onAccent('#fbbf24')).toBe('#111111');
  });

  it('writes the --hw-* variables and Google Fonts link', () => {
    expect(styleCss(DEFAULT_STYLE)).toMatch(/^:host\{--hw-accent:#0f766e;.*--hw-radius:16px;/);
    expect(fontLink(DEFAULT_STYLE)).toBe('');
    expect(fontLink({ ...DEFAULT_STYLE, font: 'inter', headingFont: 'lora' })).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:wght@400;600;700&display=swap',
    );
  });
});

describe('sample data', () => {
  it('moves the sample calendar to start today', () => {
    const days = [{ date: '2026-01-01', available: true, price: 1, min_stay: 1 }, { date: '2026-01-02', available: false, price: null, min_stay: 1 }];
    const out = shiftCalendar(days, new Date(2026, 4, 10));
    expect(out.map((d) => d.date)).toEqual(['2026-05-10', '2026-05-11']);
  });

  it('merges only the data sets asked for', () => {
    const d = sampleData(sampleProperties[1].id, ['property', 'host']);
    expect(d.property_name).toBe(sampleProperties[1].property_name);
    expect(d.host_name).toBeTruthy();
    expect(d.reviews).toBeUndefined();
    expect(d.sample_data).toBe(true);
  });
});

describe('html helpers', () => {
  it('keeps JSON safe inside <script>', () => {
    expect(scriptJson({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });

  it('compacts and highlights', () => {
    expect(compact('  <a>\n\n   <b>  \n')).toBe('<a>\n<b>');
    expect(highlight('<div data-x="1">{name}</div>')).toContain('<span class="p">{name}</span>');
  });
});

describe('snapshot minimizing', () => {
  it('keeps only fields that change the output', () => {
    const render = (d: Record<string, unknown>) => `${d.a ?? ''}|${d.b ?? ''}`;
    expect(minimize({ a: 1, b: 2, c: 3, sample_data: true }, render)).toEqual({ a: 1, b: 2, sample_data: true });
  });
});
