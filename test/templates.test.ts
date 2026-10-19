import { describe, expect, it } from 'vitest';
import { STARTERS, applyOptions, attrOptions, defaults, displayOptions, optionText, parseTemplate } from '@/lib/templates';
import { WIDGET_TYPES } from '@/lib/catalog';

describe('starter templates', () => {
  it('has one valid starter per widget type', () => {
    for (const t of WIDGET_TYPES) {
      const s = STARTERS[t.id];
      expect(s, t.id).toBeDefined();
      expect(s.meta.name).toBeTruthy();
      expect(s.body).not.toMatch(/<!--hw/);
    }
    expect(Object.keys(STARTERS)).toHaveLength(WIDGET_TYPES.length);
  });

  it('leaves no builder tags behind with default options', () => {
    for (const t of WIDGET_TYPES) {
      const s = STARTERS[t.id];
      expect(applyOptions(s.body, defaults(s.meta, { card: 'card-border' }), s.meta), t.id).not.toMatch(/\[\[/);
    }
  });

  it('never puts a template tag where the HTML parser would mangle it', () => {
    // Inside a start tag, a tag outside quotes is read as an attribute name and torn apart
    // (<details {#_first}open{/_first}> used to come out as an empty "Details" box).
    for (const t of WIDGET_TYPES) {
      for (const tag of STARTERS[t.id].body.match(/<[a-zA-Z][^<>]*>/g) ?? []) {
        expect(tag.replace(/"[^"]*"|'[^']*'/g, '""'), `${t.id}: ${tag}`).not.toMatch(/\{[#^/]?[\w.]+\}/);
      }
    }
  });

  it('never puts template tags directly between table rows', () => {
    // The HTML parser moves such text out of the table; tags there must sit in <!-- -->.
    for (const t of WIDGET_TYPES) {
      expect(STARTERS[t.id].body, t.id).not.toMatch(/<(tr|thead|tbody|table)[^>]*>\s*\{[#^/]/);
    }
  });
});

describe('applyOptions', () => {
  const meta = parseTemplate('<!--hw {"name":"T","options":[{"key":"title","label":"T","type":"text"},{"key":"link","label":"L","type":"url"}]} -->x').meta;

  it('fills values and sections', () => {
    const body = '[[#show]]A[[/show]][[^show]]B[[/show]][[#layout=grid]]G[[/layout=grid]][[^layout=grid]]N[[/layout=grid]]';
    expect(applyOptions(body, { show: 'on', layout: 'grid' })).toBe('AG');
    expect(applyOptions(body, { show: 'off', layout: 'list' })).toBe('BN');
  });

  it('handles nested sections', () => {
    expect(applyOptions('[[#a]]1[[#b]]2[[/b]]3[[/a]]', { a: 'on', b: 'off' })).toBe('13');
  });

  it('escapes typed text so it cannot become HTML or a template tag', () => {
    const out = applyOptions('<h2>[[title]]</h2>', { title: '<b>{property_name}</b> & co' }, meta);
    expect(out).toContain('&lt;b&gt;');
    expect(out).toContain('&amp; co');
    expect(out).not.toMatch(/\{property_name\}/);
  });

  it("turns an option's own tokens into template tags", () => {
    const tokens = { count: 'amenity_count', more: 'amenities_more' };
    expect(optionText('Show all {count} amenities', 'text', tokens)).toBe('Show all {amenity_count} amenities');
    expect(optionText('+ {more} more', 'text', tokens)).toBe('+ {amenities_more} more');
    expect(optionText('{property_name}', 'text', tokens)).toBe('{\u200Bproperty_name}');
  });

  it('only lets https links through', () => {
    expect(optionText('javascript:alert(1)', 'url')).toBe('#');
    expect(optionText('http://example.com', 'url')).toBe('#');
    expect(optionText('https://example.com/book?a=1&b=2', 'url')).toBe('https://example.com/book?a=1&amp;b=2');
    expect(optionText('https://site.com/stay/{id}', 'pattern')).toBe('https://site.com/stay/{id}');
  });
});

describe('display choices', () => {
  it('turns attr options into data-hosp-* attributes, skipping empty ones', () => {
    const meta = STARTERS.reviews.meta;
    const attrs = attrOptions(meta, defaults(meta, { 'min-rating': '0', 'reviews-limit': '6' }));
    expect(attrs).toEqual({ 'reviews-sort': 'newest', 'reviews-limit': '6' });
    expect(displayOptions(attrs)).toEqual({ reviewsSort: 'newest', reviewsLimit: '6' });
  });
});
