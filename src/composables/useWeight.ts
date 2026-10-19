import { computed, ref } from 'vue';
import { needs } from '@/lib/snippet';
import { W } from '@/lib/widget';
import { runtime, template } from '@/stores/builder';

// widget/sizes.json in the kit: each file's download size (minified + gzip),
// kept up to date by the kit's CI. It sits next to widget.js on jsDelivr.
const sizes = ref<Record<string, number> | null>(null);
let asked = false;

function loadSizes() {
  if (asked || !runtime.ready) return;
  asked = true;
  fetch(`${W().base.dir}sizes.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => (sizes.value = s))
    .catch(() => {});
}

/** What the current widget costs a website: JavaScript downloaded and Worker requests per view. */
export function useWeight() {
  return computed(() => {
    if (!runtime.ready) return null;
    loadSizes();
    const n = needs(W(), template.value);
    const files = [{ name: 'widget.js', size: sizes.value?.['widget.js'] }].concat(
      n.modules.filter((m) => m !== 'analyze').map((m) => ({ name: m, size: sizes.value?.[`modules/${m}.js`] })),
    );
    const total = files.every((f) => typeof f.size === 'number') ? files.reduce((t, f) => t + (f.size ?? 0), 0) : null;
    return { files, total, requests: n.requests };
  });
}
