<script setup lang="ts">
import { computed } from 'vue';
import { previewData } from '@/stores/builder';

/** JSON of { "Hospitable's topic name": "name on the website" }. */
const model = defineModel<string>({ required: true });

const topics = computed(() => ((previewData.value.guide as { title: string }[] | undefined) ?? []).map((t) => t.title));
const names = computed<Record<string, string>>(() => {
  try {
    return JSON.parse(model.value || '{}') as Record<string, string>;
  } catch {
    return {};
  }
});

function rename(topic: string, name: string) {
  const next = { ...names.value };
  if (name.trim() && name.trim() !== topic) next[topic] = name.trim();
  else delete next[topic];
  model.value = Object.keys(next).length ? JSON.stringify(next) : '';
}
</script>

<template>
  <p v-if="!topics.length" class="hint">No public topics in the data yet.</p>
  <div v-else class="topics">
    <label v-for="t in topics" :key="t">
      <span>{{ t }}</span>
      <input type="text" :value="names[t] ?? ''" :placeholder="t" :aria-label="`Name for ${t}`" @input="rename(t, ($event.target as HTMLInputElement).value)">
    </label>
  </div>
</template>

<style scoped>
.topics { display: grid; gap: 8px; }
.topics label { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 10px; align-items: center; }
.topics span { font-size: 12.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
