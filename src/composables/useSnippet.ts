import { computed } from 'vue';
import { config } from '@/config';
import { buildSnippet, embedUrl, iframeCode } from '@/lib/snippet';
import { T } from '@/lib/templates';
import { W } from '@/lib/widget';
import { attrs, datasets, design, needsProperty, runtime, snippetOptions, snippetStyle, starter, state, template } from '@/stores/builder';

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
      // A host-only widget names the property too, so it shares that property's request.
      property: needsProperty.value || datasets.value.includes('host') ? state.property : '',
      options: snippetOptions.value,
      style: snippetStyle.value,
      attrs: attrs.value,
      fontHref: T().fontHref(state.style),
      widgetSrc,
    });
  }

  const snippet = computed(() => build());

  /** The widget as a page of its own on the Worker, for an iframe (a link, and the iframe code). */
  const embed = computed(() => {
    const conn = runtime.connection;
    if (!conn || !runtime.ready) return null;
    const link = embedUrl({
      hosp: W(),
      type: state.type,
      template: template.value,
      worker: conn.worker,
      property: needsProperty.value ? state.property : '',
      options: snippetOptions.value,
      style: snippetStyle.value,
      attrs: attrs.value,
    });
    const height = runtime.heights?.desktop ?? starter.value.meta.height ?? 480;
    return { link, code: iframeCode(link, starter.value.meta.name, height) };
  });

  return { snippet, build, embed };
}
