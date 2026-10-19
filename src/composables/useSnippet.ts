import { computed } from 'vue';
import { config } from '@/config';
import { buildSnippet } from '@/lib/snippet';
import { T } from '@/lib/templates';
import { W } from '@/lib/widget';
import { attrs, design, needsProperty, runtime, snippetOptions, snippetStyle, state, template } from '@/stores/builder';

/** The snippet for the current design, or null until a Worker is connected. */
export function useSnippet() {
  function build(widgetSrc = config.snippetWidgetSrc): string | null {
    const conn = runtime.connection;
    if (!conn || !runtime.ready) return null;
    return buildSnippet({
      hosp: W(),
      type: state.type,
      template: template.value,
      custom: design.value.custom,
      id: `hosp-${state.type}-${design.value.uid}`,
      worker: conn.worker,
      property: needsProperty.value ? state.property : '',
      options: snippetOptions.value,
      style: snippetStyle.value,
      attrs: attrs.value,
      fontHref: T().fontHref(state.style),
      widgetSrc,
    });
  }

  const snippet = computed(() => build());
  return { snippet, build };
}
