import { apiUrl } from '@ui-oracle/shared-ui';
/** Vault time travel for the History tab (#3110): GET /api/v1/arra/history[/:sha[/note]], owner only, read-only. */

import { OwnerOnlyError } from './api';

export type EventKind = 'init' | 'share' | 'retire' | 'other';
export interface FileChange { path: string; status: 'added' | 'modified' | 'deleted' | 'renamed' }
export interface HistoryEvent { sha: string; short: string; at: string; author: string; subject: string; kind: EventKind; changes: FileChange[]; snapshots: string[] }
export interface History { vault: string; head: string | null; events: HistoryEvent[] }
export interface VaultAt { sha: string; at: string; subject: string; notes: Array<{ path: string; title: string }>; sinceThen: FileChange[] }

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
const hostFetch: Fetcher = (input, init) => fetch(typeof input === 'string' ? apiUrl(input) : input, init);

async function get<T>(path: string, fetcher: Fetcher): Promise<T> {
  const res = await fetcher(path, { headers: { accept: 'application/json' } });
  if (res.status === 403) throw new OwnerOnlyError();
  const body = await res.json().catch(() => ({})) as T & { ok?: boolean; error?: string };
  if (!res.ok || body.ok === false) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

export function createHistoryApi(fetcher: Fetcher = hostFetch) {
  return {
    history: () => get<History>('/api/v1/arra/history', fetcher),
    at: (sha: string) => get<VaultAt>(`/api/v1/arra/history/${sha}`, fetcher),
    note: (sha: string, path: string) => get<{ markdown: string }>(`/api/v1/arra/history/${sha}/note?path=${encodeURIComponent(path)}`, fetcher).then((r) => r.markdown),
  };
}

export type HistoryApi = ReturnType<typeof createHistoryApi>;
export const historyApi = createHistoryApi();
