const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** Light HTML highlighting for the snippet view. */
export function highlight(code: string): string {
  return escapeHtml(code)
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="c">$1</span>')
    .replace(/(&quot;[^&\n]*?&quot;)/g, '<span class="s">$1</span>')
    .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="t">$2</span>')
    .replace(/ ([\w:-]+)=(?=<span class="s">)/g, ' <span class="a">$1</span>=')
    .replace(/(\{[#^/]?[\w.]+\})/g, '<span class="p">$1</span>');
}

/**
 * The snippet's <template> goes through the browser's HTML parser, which
 * moves stray text out of tables and drops broken markup. Rendering the
 * preview from the parsed copy makes it identical to what the snippet shows.
 */
const parsed = new Map<string, string>();
export function asParsed(html: string): string {
  let out = parsed.get(html);
  if (out === undefined) {
    const t = document.createElement('template');
    t.innerHTML = html;
    out = t.innerHTML;
    if (parsed.size > 50) parsed.clear();
    parsed.set(html, out);
  }
  return out;
}

/** Drops indentation and blank lines. */
export function compact(html: string): string {
  return html
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

/** JSON that is safe inside a <script> element. */
export function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
