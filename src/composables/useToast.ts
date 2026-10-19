import { ref } from 'vue';

const message = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

export function useToast() {
  function toast(text: string) {
    message.value = text;
    clearTimeout(timer);
    timer = setTimeout(() => (message.value = ''), 1800);
  }
  return { message, toast };
}
