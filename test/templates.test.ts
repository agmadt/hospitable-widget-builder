import { describe, expect, it } from 'vitest';
import { attrOptions, changedOptions, displayOptions } from '@/lib/templates';
import { buildSnippet, embedUrl, iframeCode, type SnippetInput } from '@/lib/snippet';
import type { HospWidgets, TemplateMeta } from '@/types';

const meta: TemplateMeta = {
  name: 'Reviews',
  options: [
    { key: 'heading', label: 'Heading', type: 'text', default: 'What guests say' },
    { key: 'layout', label: 'Layout', type: 'select', default: 'carousel' },
    { key: 'min-rating', label: 'Minimum rating', type: 'select', default: '4', target: 'attr' },
    { key: 'reviews-limit', label: 'Show at most', type: 'number', default: '9', target: 'attr' },
    { key: 'review-ids', label: 'Picked', type: 'reviews', default: '', target: 'attr' },
  ],
};

describe('options', () => {
  it('puts display choices in attributes, skipping empty ones', () => {
    const attrs = attrOptions(meta, { 'min-rating': '0', 'reviews-limit': '6', 'review-ids': '' });
    expect(attrs).toEqual({ 'reviews-limit': '6' });
    expect(displayOptions(attrs)).toEqual({ reviewsLimit: '6' });
  });

  it('records only template options the host changed', () => {
    expect(changedOptions(meta, { heading: 'What guests say', layout: 'cards', 'min-rating': '5' })).toEqual({ layout: 'cards' });
  });
});

describe('snippet', () => {
  const hosp = {
    analyze: () => ({ fields: [], datasets: ['property', 'reviews'] }),
    plan: () => ['reviews', 'pager'],
  } as unknown as HospWidgets;
  const base: SnippetInput = {
    hosp,
    type: 'reviews',
    template: '<style>x</style><section>{#reviews}{text}{/reviews}</section>',
    custom: null,
    id: 'hosp-reviews-ab12',
    worker: 'https://w.example.workers.dev',
    property: 'p1',
    options: 'layout=cards',
    style: 'accent=%23c2410c',
    attrs: { 'reviews-limit': '6' },
    fontHref: '',
    widgetSrc: 'https://cdn.jsdelivr.net/gh/agmadt/hospitable-widgets@1/widget/widget.min.js',
  };

  it('is one element and one script for a starter template', () => {
    expect(buildSnippet(base)).toBe(
      '<div data-hosp="reviews" data-hosp-worker="https://w.example.workers.dev" data-hosp-property="p1" data-hosp-data="property,reviews" data-hosp-modules="reviews,pager" data-hosp-options="layout=cards" data-hosp-style="accent=%23c2410c" data-hosp-reviews-limit="6"></div>\n' +
        '<script src="https://cdn.jsdelivr.net/gh/agmadt/hospitable-widgets@1/widget/widget.min.js" defer></script>',
    );
  });

  it('leaves out what is default', () => {
    expect(buildSnippet({ ...base, options: '', style: '', attrs: {} })).not.toMatch(/data-hosp-(options|style|reviews-limit)/);
  });

  it('carries hand-edited HTML in a <template>', () => {
    const out = buildSnippet({ ...base, custom: '<section>mine</section>', fontHref: 'https://fonts.googleapis.com/css2?family=Inter' });
    expect(out.split('\n')[0]).toBe('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">');
    expect(out).toContain('<template id="hosp-reviews-ab12">');
    expect(out).toContain('data-hosp-template="hosp-reviews-ab12"');
    expect(out).not.toContain('data-hosp="');
    expect(out).not.toContain('data-hosp-options');
  });
});

describe('embed', () => {
  const hosp = (datasets: string[], modules: string[]) => ({ analyze: () => ({ fields: [], datasets }), plan: () => modules }) as unknown as HospWidgets;
  const base = { template: '', worker: 'https://w.example.workers.dev', property: 'p1', options: 'heading=Inside%20the%20villa', style: 'accent=%23c2410c', attrs: { 'amenities-limit': '8' } };

  it('puts a snippet’s choices in the embed page’s query', () => {
    const url = embedUrl({ ...base, hosp: hosp(['property'], ['templates']), type: 'amenities' });
    expect(url).toBe('https://w.example.workers.dev/embed/amenities?property=p1&data=property&modules=&options=heading%3DInside%2520the%2520villa&style=accent%3D%2523c2410c&amenities-limit=8');
    // The Worker reads the query back into exactly the snippet's attribute values.
    const q = new URL(url).searchParams;
    expect([q.get('options'), q.get('style')]).toEqual(['heading=Inside%20the%20villa', 'accent=%23c2410c']);
  });

  it('names no property for a guest widget: the booking decides', () => {
    const url = embedUrl({ ...base, hosp: hosp(['stay'], ['guest']), type: 'door-code', options: '', style: '', attrs: {} });
    expect(url).toBe('https://w.example.workers.dev/embed/door-code?data=stay&modules=guest');
  });

  it('writes an iframe that can copy, at the measured height', () => {
    expect(iframeCode('https://w.example.workers.dev/embed/wifi?data=stay&modules=guest', 'Wi-Fi "home"', 279.4)).toBe(
      '<iframe src="https://w.example.workers.dev/embed/wifi?data=stay&amp;modules=guest" title="Wi-Fi &quot;home&quot;" loading="lazy" allow="clipboard-write" style="display:block;width:100%;height:279px;border:0"></iframe>',
    );
  });
});
