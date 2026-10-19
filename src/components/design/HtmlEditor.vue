<script setup lang="ts">
import { computed, ref } from 'vue';
import { body, design, previewData, previewOptions, runtime, setCustom } from '@/stores/builder';
import { W } from '@/lib/widget';
import { copyText } from '@/lib/clipboard';
import { useToast } from '@/composables/useToast';

const { toast } = useToast();
const open = ref(false);
const editor = ref<HTMLTextAreaElement>();

const code = computed({
  get: () => body.value,
  set: (html: string) => setCustom(html),
});

/** Every field the current data offers, after widget.js adds its formatted ones. */
const fields = computed(() => {
  if (!runtime.ready || !open.value) return [];
  const ctx = W().derive(previewData.value, previewOptions.value);
  return Object.keys(ctx)
    .filter((k) => !k.startsWith('_'))
    .sort()
    .map((k) => {
      const v = ctx[k];
      const list = Array.isArray(v);
      return {
        key: k,
        list,
        label: list ? `{#${k}}…{/${k}}` : `{${k}}`,
        tag: list ? `{#${k}}{/${k}}` : `{${k}}`,
        hint: list ? `${(v as unknown[]).length} item(s)` : v && typeof v === 'object' ? 'object' : String(v ?? '').slice(0, 120),
      };
    });
});

function insert(tag: string) {
  const el = editor.value;
  if (el) {
    el.focus();
    el.setRangeText(tag, el.selectionStart, el.selectionEnd, 'end');
    setCustom(el.value);
  }
  copyText(tag).then(() => toast(`Copied ${tag}`));
}

function onTab(e: KeyboardEvent) {
  const el = e.target as HTMLTextAreaElement;
  el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end');
  setCustom(el.value);
}
</script>

<template>
  <details class="group" :open="open" @toggle="open = ($event.target as HTMLDetailsElement).open">
    <summary><h2>Advanced: edit the HTML</h2></summary>
    <p class="hint">
      The template is plain HTML. <code>{field}</code> inserts a value, <code>{#list}…{/list}</code> repeats,
      <code>{#flag}…{/flag}</code> shows only when there is a value, <code>{^flag}…{/flag}</code> only when there isn't.
    </p>
    <textarea
      ref="editor"
      v-model="code"
      class="code"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      aria-label="Template HTML"
      rows="14"
      @keydown.tab.exact.prevent="onTab"
    />
    <div class="row">
      <button class="btn small ghost" type="button" :disabled="design.custom === null" @click="setCustom(null)">Reset to the starter template</button>
      <span class="muted small">{{ design.custom !== null ? 'Edited by you' : 'Starter template with your options' }}</span>
    </div>
    <div class="field-ref">
      <h3>Fields you can use</h3>
      <p class="hint">Click one to insert it. Values come from the data in the preview.</p>
      <div class="chips">
        <button v-for="f in fields" :key="f.key" type="button" class="chip" :class="{ list: f.list }" :title="f.hint" @click="insert(f.tag)">{{ f.label }}</button>
      </div>
    </div>
  </details>
</template>
