<script setup lang="ts">
const props = defineProps<{ label: string; id: string }>();
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <div class="f">
    <label :for="props.id">{{ props.label }}</label>
    <span class="switch"><input :id="props.id" v-model="model" type="checkbox"><span /></span>
  </div>
</template>
