<script setup lang="ts">
import ColorField from '@/components/ui/ColorField.vue';
import RangeField from '@/components/ui/RangeField.vue';
import { FONTS, PRESETS } from '@/lib/style';
import { applyPreset, state } from '@/stores/builder';
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
      <select id="s-font" v-model="state.style.font">
        <option v-for="(f, key) in FONTS" :key="key" :value="key">{{ f.label }}</option>
      </select>
    </div>
    <div class="f">
      <label for="s-heading">Heading font</label>
      <select id="s-heading" v-model="state.style.headingFont">
        <option value="same">Same as text</option>
        <option v-for="(f, key) in FONTS" :key="key" :value="key">{{ f.label }}</option>
      </select>
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
