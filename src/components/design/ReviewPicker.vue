<script setup lang="ts">
import { computed } from 'vue';
import { previewData } from '@/stores/builder';

interface Review {
  id: string;
  rating: number | null;
  text: string | null;
  guest_name: string;
  date: string | null;
}

const model = defineModel<string>({ required: true });

const reviews = computed(() => ((previewData.value.reviews as Review[] | undefined) ?? []).filter((r) => r.text));
const picked = computed(() => model.value.split(',').filter(Boolean));

function toggle(id: string, on: boolean) {
  const ids = picked.value.filter((x) => x !== id);
  if (on) ids.push(id);
  model.value = ids.join(',');
}
</script>

<template>
  <p v-if="!reviews.length" class="hint">No reviews with text to pick from yet.</p>
  <div v-else class="review-pick">
    <label v-for="r in reviews" :key="r.id">
      <input type="checkbox" :checked="picked.includes(r.id)" @change="toggle(r.id, ($event.target as HTMLInputElement).checked)">
      <div>
        <small>
          {{ '★'.repeat(r.rating ?? 0) }} · {{ r.guest_name }} · {{ r.date }}
          <template v-if="picked.includes(r.id)"> · #{{ picked.indexOf(r.id) + 1 }}</template>
        </small>
        <span class="txt">{{ r.text }}</span>
      </div>
    </label>
  </div>
</template>
