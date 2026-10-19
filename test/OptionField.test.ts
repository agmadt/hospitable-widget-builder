import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import OptionField from '@/components/design/OptionField.vue';

describe('OptionField', () => {
  it('turns a toggle into "on" and "off"', async () => {
    const w = mount(OptionField, { props: { option: { key: 'grouped', label: 'Group', type: 'toggle' }, modelValue: 'off' } });
    await w.find('input[type="checkbox"]').setValue(true);
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['on']);
  });

  it('warns about links that are not https', async () => {
    const w = mount(OptionField, { props: { option: { key: 'button_url', label: 'Link', type: 'url' }, modelValue: 'http://example.com' } });
    expect(w.find('.warn').exists()).toBe(true);
    await w.setProps({ modelValue: 'https://example.com/book' });
    expect(w.find('.warn').exists()).toBe(false);
  });

  it('renders select choices', () => {
    const w = mount(OptionField, {
      props: { option: { key: 'layout', label: 'Layout', type: 'select', choices: [['grid', 'Grid'], ['list', 'List']] }, modelValue: 'list' },
    });
    expect((w.find('select').element as HTMLSelectElement).value).toBe('list');
    expect(w.findAll('option').map((o) => o.text())).toEqual(['Grid', 'List']);
  });
});
