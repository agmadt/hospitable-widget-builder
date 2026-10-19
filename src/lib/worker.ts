import type { Connection, PropertySummary, TokenState, WorkerStatus } from '@/types';

/** "my-worker.me.workers.dev/anything" → "https://my-worker.me.workers.dev". Empty when it isn't an address. */
export function normalizeWorker(input: string): string {
  let v = String(input || '').trim();
  if (!v) return '';
  if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
  try {
    const u = new URL(v);
    if (!u.hostname.includes('.') && !['localhost'].includes(u.hostname)) return '';
    if (u.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(u.hostname)) u.protocol = 'https:';
    return u.origin;
  } catch {
    return '';
  }
}

export type ConnectResult =
  | { ok: true; connection: Connection }
  | { ok: false; reason: 'unreachable' }
  | { ok: false; reason: 'token'; token: TokenState }
  | { ok: false; reason: 'not-a-worker'; status: number };

interface PropertiesResponse {
  mode: 'live' | 'dummy';
  properties?: PropertySummary[];
  status?: WorkerStatus | null;
  token?: TokenState;
}

/** Asks a Worker for its properties and token status. Never throws. */
export async function connectWorker(worker: string, fetchImpl: typeof fetch = fetch): Promise<ConnectResult> {
  let res: Response;
  let body: PropertiesResponse;
  try {
    res = await fetchImpl(`${worker}/api/properties?for=builder`, { cache: 'no-store' });
    body = (await res.json()) as PropertiesResponse;
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
  if (res.status === 503) return { ok: false, reason: 'token', token: body.token ?? 'unknown' };
  if (!res.ok || !Array.isArray(body.properties)) return { ok: false, reason: 'not-a-worker', status: res.status };
  return { ok: true, connection: { worker, mode: body.mode === 'dummy' ? 'dummy' : 'live', properties: body.properties, status: body.status ?? null } };
}

export const TOKEN_HELP: Record<TokenState, { title: string; text: string; fix?: string[] }> = {
  ok: { title: '', text: '' },
  rejected: {
    title: 'Hospitable rejected your token',
    text: 'It may have expired (tokens last one year) or been deleted.',
    fix: [
      'In Hospitable, go to <b>Apps → API access → Access tokens</b> and create a new token with <b>Read</b> permission.',
      'In Cloudflare, open <b>Workers &amp; Pages</b> → your Worker → <b>Settings → Variables and Secrets</b>.',
      'Edit <b>HOSPITABLE_PAT</b>, paste the new token and deploy. Then connect again.',
    ],
  },
  forbidden: {
    title: 'Your token is missing a permission',
    text: "Create a token with <b>Read</b> permission and replace <b>HOSPITABLE_PAT</b> in your Worker's settings.",
  },
  missing: {
    title: 'Your Worker has no token yet',
    text: "Add <b>HOSPITABLE_PAT</b> under your Worker's <b>Settings → Variables and Secrets</b> in Cloudflare, or type <code>dummy</code> to use sample data.",
  },
  unknown: {
    title: 'Hospitable could not be reached',
    text: 'This is usually temporary. Wait a minute and connect again.',
  },
};
