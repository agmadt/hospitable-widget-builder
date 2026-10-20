import { describe, expect, it, vi } from 'vitest';
import { normalizeWorker, connectWorker, cacheDuration, cachePeriod } from '@/lib/worker';
import { DEFAULT_STYLE, changedStyle } from '@/lib/style';
import { shiftCalendar, sampleData, sampleProperties } from '@/lib/sample';
import { compact, highlight, scriptJson } from '@/lib/html';

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
    expect(await connectWorker('https://w.dev', ok)).toMatchObject({ ok: true, connection: { worker: 'https://w.dev', mode: 'live', cacheMinutes: 60 } });
    const quick = vi.fn(async () => new Response(JSON.stringify({ mode: 'live', properties: [], cache_minutes: 15 })));
    expect(await connectWorker('https://w.dev', quick)).toMatchObject({ ok: true, connection: { cacheMinutes: 15 } });
    expect([0, 1, 15, 60, 120].map(cachePeriod)).toEqual(['per page view', 'per minute', 'every 15 minutes', 'per hour', 'every 2 hours']);
    expect([1, 15, 60, 240].map(cacheDuration)).toEqual(['1 minute', '15 minutes', '1 hour', '4 hours']);
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
  it('records only what the host changed', () => {
    expect(changedStyle(DEFAULT_STYLE)).toEqual({});
    expect(changedStyle({ ...DEFAULT_STYLE, accent: '#c2410c', radius: 4, card: '' })).toEqual({ accent: '#c2410c', radius: '4', card: '' });
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
