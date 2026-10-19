<script setup lang="ts">
import { computed } from 'vue';
import type { TemplateOption } from '@/types';
import { isHttpsUrl, isOn } from '@/lib/templates';
import ReviewPicker from './ReviewPicker.vue';
import TopicNames from './TopicNames.vue';

const props = defineProps<{ option: TemplateOption; modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

const id = computed(() => `o-${props.option.key}`);
const value = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v),
});
const checked = computed({
  get: () => isOn(props.modelValue),
  set: (v: boolean) => emit('update:modelValue', v ? 'on' : 'off'),
});
const badUrl = computed(() => {
  if (props.option.type !== 'url' && props.option.type !== 'pattern') return false;
  const v = props.modelValue.trim();
  return !!v && v !== 'https://' && !(props.option.type === 'url' ? isHttpsUrl(v) : /^https:\/\/\S+\.\S+/.test(v));
});
</script>

<template>
  <div v-if="option.type === 'toggle'" class="f">
    <label :for="id">{{ option.label }}</label>
    <span class="switch"><input :id="id" v-model="checked" type="checkbox"><span /></span>
    <p v-if="option.hint" class="hint" style="margin: 0; grid-column: 1 / -1">{{ option.hint }}</p>
  </div>

  <div v-else-if="option.type === 'select'" class="f">
    <label :for="id">{{ option.label }}</label>
    <select :id="id" v-model="value">
      <option v-for="[v, label] in option.choices" :key="v" :value="v">{{ label }}</option>
    </select>
  </div>

  <div v-else-if="option.type === 'number'" class="f">
    <label :for="id">{{ option.label }}</label>
    <input :id="id" v-model="value" type="number" :min="option.min ?? 0" :max="option.max ?? 999">
  </div>

  <div v-else-if="option.type === 'textarea'" class="f stack">
    <label :for="id">{{ option.label }}</label>
    <textarea :id="id" v-model="value" rows="3" />
  </div>

  <div v-else-if="option.type === 'reviews'" class="f stack">
    <span class="label">{{ option.label }}</span>
    <p class="hint" style="margin: 0">Tick the reviews to show, in the order you tick them. Leave all unticked to use the filters above.</p>
    <ReviewPicker v-model="value" />
  </div>

  <div v-else-if="option.type === 'topics'" class="f stack">
    <span class="label">{{ option.label }}</span>
    <TopicNames v-model="value" />
    <p v-if="option.hint" class="hint" style="margin: 0">{{ option.hint }}</p>
  </div>

  <div v-else class="f stack">
    <label :for="id">{{ option.label }}</label>
    <input
      :id="id"
      v-model="value"
      :type="option.type === 'url' || option.type === 'pattern' ? 'url' : 'text'"
      :placeholder="option.type === 'pattern' ? 'https://yoursite.com/stay/{id}' : undefined"
    >
    <div v-if="badUrl" class="warn">Use a full address starting with https://</div>
    <p v-if="option.hint" class="hint" style="margin: 0">{{ option.hint }}</p>
  </div>
</template>
