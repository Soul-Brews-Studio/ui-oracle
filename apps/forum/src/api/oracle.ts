import { apiUrl } from './host';
import { cached } from '../lib/cache';
export { apiUrl } from './host';

export const API_BASE = apiUrl('/api');

const ONE_HOUR = 60 * 60 * 1000;

/**
 * Host-scope every cache key with API_BASE. Without this, switching `?host=`
 * (a full page reload, so API_BASE is re-resolved fresh) would still read a
 * cache entry written by the previous backend — the key describes the query,
 * not which backend wrote the entry. (Found via multi-instance testing —
 * reported by Muninn, 2026-07-25.)
 */
function hk(key: string): string {
  return `${API_BASE}::${key}`;
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export interface Document {
  id: string;
  type: 'principle' | 'learning' | 'retro';
  content: string;
  source_file: string;
  concepts: string[];
  project?: string;
  source?: 'fts' | 'vector' | 'hybrid';
  score?: number;
  distance?: number;
  model?: string;
  created_at?: string;
}

export async function list(type: string = 'all', limit: number = 20, offset: number = 0): Promise<{ results: Document[]; total: number }> {
  const params = new URLSearchParams({ type, limit: String(limit), offset: String(offset) });
  const qs = params.toString();
  return cached(hk(`list:${type}:${qs}`), ONE_HOUR, async () => {
    const res = await fetch(`${API_BASE}/list?${qs}`);
    return res.json();
  }, { tag: `list:${type}` });
}
