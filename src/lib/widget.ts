import { config } from '@/config';
import type { HospWidgets, WidgetModule } from '@/types';

/** The builder renders every widget type, so it loads every module up front. */
export const ALL_MODULES: WidgetModule[] = ['analyze', 'calendar', 'reviews', 'lightbox', 'pager'];

let loading: Promise<HospWidgets> | null = null;

/** Loads widget.js and its modules once: the same code the snippet uses, so the preview is the real thing. */
export function loadWidget(src = config.previewWidgetSrc): Promise<HospWidgets> {
  loading ??= new Promise<HospWidgets>((resolve, reject) => {
    if (window.HospWidgets) return resolve(window.HospWidgets);
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => (window.HospWidgets ? resolve(window.HospWidgets) : reject(new Error(`${src} loaded but did not start`)));
    s.onerror = () => {
      loading = null;
      reject(new Error(`Could not load widget.js from ${src}`));
    };
    document.head.appendChild(s);
  }).then(async (hosp) => {
    await hosp.need(ALL_MODULES);
    return hosp;
  });
  return loading;
}

/** The loaded API. Only call after loadWidget() resolved. */
export function W(): HospWidgets {
  if (!window.HospWidgets) throw new Error('widget.js is not loaded yet');
  return window.HospWidgets;
}
