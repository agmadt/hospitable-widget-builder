<script setup lang="ts">
const props = defineProps<{ label: string; id: string; min: number; max: number; unit?: string }>();
const model = defineModel<number>({ required: true });
</script>

<template>
  <div class="f">
    <label :for="props.id">{{ props.label }}</label>
    <div class="range">
      <input :id="props.id" v-model.number="model" type="range" :min="props.min" :max="props.max">
      <output :for="props.id">{{ model }}{{ props.unit ?? 'px' }}</output>
    </div>
  </div>
</template>
