<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DisplayOptions, WidgetData } from '@/types';
import { W } from '@/lib/widget';

const props = defineProps<{ template: string; data: WidgetData; options: DisplayOptions; state: string; ready: boolean }>();
const emit = defineEmits<{ heights: [{ desktop: number; mobile: number }] }>();

const el = ref<HTMLElement>();
const measureBox = ref<HTMLElement>();
let measureTimer: ReturnType<typeof setTimeout> | undefined;

function render() {
  if (!props.ready || !el.value) return;
  W().renderTo(el.value, props.template, props.data, props.options, props.state);
  clearTimeout(measureTimer);
  measureTimer = setTimeout(measure, 350);
}

/** Renders off-screen at typical embed widths, so hosts know what height to give the embed. */
function measure() {
  const box = measureBox.value;
  if (!box || !props.ready) return;
  const heights = { desktop: 0, mobile: 0 };
  for (const [name, width] of [['desktop', 980], ['mobile', 360]] as const) {
    const probe = document.createElement('div');
    probe.style.width = `${width}px`;
    box.appendChild(probe);
    W().renderTo(probe, props.template, props.data, props.options, 'measure');
    heights[name] = Math.ceil((probe.getBoundingClientRect().height + 16) / 10) * 10;
    probe.remove();
  }
  emit('heights', heights);
}

watch(() => [props.template, props.data, props.options, props.ready], render, { flush: 'post' });
watch(el, render);
// Web fonts change heights once they arrive.
const onFonts = () => measure();
onMounted(() => document.fonts?.addEventListener('loadingdone', onFonts));
onBeforeUnmount(() => {
  clearTimeout(measureTimer);
  document.fonts?.removeEventListener('loadingdone', onFonts);
});
</script>

<template>
  <div id="preview" ref="el" class="preview" />
  <div ref="measureBox" class="measure" aria-hidden="true" />
</template>
