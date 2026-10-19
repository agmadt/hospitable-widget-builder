<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ label: string; id: string }>();
const model = defineModel<string>({ required: true });

// The hex box only commits valid colors, so typing "#12" doesn't flash the preview.
const draft = ref(model.value);
watch(model, (v) => (draft.value = v));

function commit() {
  if (/^#[0-9a-f]{6}$/i.test(draft.value.trim())) model.value = draft.value.trim().toLowerCase();
  else draft.value = model.value;
}
</script>

<template>
  <div class="f">
    <label :for="props.id">{{ props.label }}</label>
    <div class="color">
      <input :id="props.id" v-model="model" type="color">
      <input v-model="draft" type="text" maxlength="7" :aria-label="`${props.label} hex value`" @change="commit" @keydown.enter="commit">
    </div>
  </div>
</template>
