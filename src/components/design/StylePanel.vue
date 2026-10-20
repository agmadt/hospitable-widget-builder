<script setup lang="ts">
import { computed } from 'vue';
import ColorField from '@/components/ui/ColorField.vue';
import RangeField from '@/components/ui/RangeField.vue';
import { PRESETS } from '@/lib/style';
import { T } from '@/lib/templates';
import { applyPreset, state } from '@/stores/builder';

const FONTS = T().FONTS;
// A heading can't follow the website's font on its own: that font is only
// inherited by text that sets none, and the widget's text sets one.
const HEADING_FONTS = Object.fromEntries(Object.entries(FONTS).filter(([key]) => key !== 'site'));

const GOOGLE = 'google:';

/** The font select shows "Other Google font" for any "google:Name" value; the name has its own field. */
function fontField(key: 'font' | 'headingFont') {
  return {
    choice: computed({
      get: () => (state.style[key].startsWith(GOOGLE) ? GOOGLE : state.style[key]),
      set: (v: string) => {
        state.style[key] = v === GOOGLE ? GOOGLE : v;
      },
    }),
    name: computed({
      get: () => state.style[key].slice(GOOGLE.length),
      set: (v: string) => {
        state.style[key] = GOOGLE + v.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 40);
      },
    }),
  };
}
const font = fontField('font');
const heading = fontField('headingFont');
</script>

<template>
  <div class="presets" aria-label="Theme presets">
    <button v-for="(p, i) in PRESETS" :key="p.name" type="button" class="preset" @click="applyPreset(i)">
      <i :style="{ background: `linear-gradient(135deg, ${p.style.accent} 50%, ${p.style.background} 50%)` }" />{{ p.name }}
    </button>
  </div>
  <div class="fields">
    <ColorField id="s-accent" v-model="state.style.accent" label="Accent color" />
    <ColorField id="s-text" v-model="state.style.text" label="Text color" />
    <ColorField id="s-background" v-model="state.style.background" label="Background" />
    <div class="f">
      <label for="s-font">Font</label>
      <select id="s-font" v-model="font.choice.value">
        <option v-for="(f, key) in FONTS" :key="key" :value="key">{{ f[0] }}</option>
        <option :value="GOOGLE">Other Google font…</option>
      </select>
      <p v-if="state.style.font === 'site'" class="muted small">
        The widget uses your website's font on WordPress, Squarespace, Webflow and pages you build yourself. Wix embeds can't see your site's fonts, so on Wix pick your font instead. The preview shows a stand-in.
      </p>
    </div>
    <div v-if="font.choice.value === GOOGLE" class="f">
      <label for="s-font-name">Google font name</label>
      <input id="s-font-name" v-model.lazy="font.name.value" type="text" placeholder="Playfair Display" autocomplete="off" spellcheck="false">
      <p class="muted small">Type it exactly as on <a href="https://fonts.google.com" target="_blank" rel="noopener">fonts.google.com</a>.</p>
    </div>
    <div class="f">
      <label for="s-heading">Heading font</label>
      <select id="s-heading" v-model="heading.choice.value">
        <option value="same">Same as text</option>
        <option v-for="(f, key) in HEADING_FONTS" :key="key" :value="key">{{ f[0] }}</option>
        <option :value="GOOGLE">Other Google font…</option>
      </select>
    </div>
    <div v-if="heading.choice.value === GOOGLE" class="f">
      <label for="s-heading-name">Google font name for headings</label>
      <input id="s-heading-name" v-model.lazy="heading.name.value" type="text" placeholder="Lora" autocomplete="off" spellcheck="false">
    </div>
    <RangeField id="s-radius" v-model="state.style.radius" label="Corner radius" :min="0" :max="28" />
    <RangeField id="s-space" v-model="state.style.space" label="Spacing" :min="8" :max="28" />
    <div class="f">
      <label for="s-card">Card style</label>
      <select id="s-card" v-model="state.style.card">
        <option value="card-border">Thin border</option>
        <option value="card-shadow">Soft shadow</option>
        <option value="">Flat</option>
      </select>
    </div>
  </div>
</template>
