import { describe, expect, it } from 'vitest';
import { attrOptions, changedOptions, displayOptions } from '@/lib/templates';
import { buildSnippet, type SnippetInput } from '@/lib/snippet';
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
