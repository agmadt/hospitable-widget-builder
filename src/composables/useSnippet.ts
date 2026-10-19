import { computed } from 'vue';
import { config } from '@/config';
import { buildSnippet } from '@/lib/snippet';
import { fontLink } from '@/lib/style';
import { W } from '@/lib/widget';
import { attrs, design, needsProperty, previewData, previewOptions, runtime, starter, state, template } from '@/stores/builder';

/** The snippet for the current design, or null until a Worker is connected. */
export function useSnippet() {
  function build(widgetSrc = config.snippetWidgetSrc): string | null {
    const conn = runtime.connection;
    if (!conn || !runtime.ready) return null;
    return buildSnippet({
      hosp: W(),
      id: `hosp-${state.type}-${design.value.uid}`,
      name: starter.value.meta.name,
      template: template.value,
      data: previewData.value,
      worker: conn.worker,
      property: needsProperty.value ? state.property : '',
      attrs: attrs.value,
      displayOptions: previewOptions.value,
      fontHref: fontLink(state.style),
      widgetSrc,
      sampleMode: conn.mode === 'dummy',
      credit: location.origin + location.pathname,
    });
  }

  const snippet = computed(() => build());
  return { snippet, build };
}
