import { apiUrl } from './host';
import { cached } from '../lib/cache';
export { apiUrl, hostLabel, activeHost, isDefault, isRemote } from './host';

export const API_BASE = apiUrl('/api');

const TEN_MIN = 10 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

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

export interface SearchResult {
  results: Document[];
  total: number;
  query: string;
}

export async function search(
  query: string,
  type: string = 'all',
  limit: number = 20,
  mode: 'hybrid' | 'fts' | 'vector' = 'hybrid',
  model?: string,
): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, type, limit: String(limit), mode });
  if (model) params.set('model', model);
  const qs = params.toString();
  return cached(`search:${qs}`, TEN_MIN, async () => {
    const res = await fetch(`${API_BASE}/search?${qs}`);
    if (!res.ok) throw new Error(`search ${res.status}`);
    return res.json();
  }, { tag: 'search' });
}

export interface VectorEmbedder {
  model: string;
  dim?: number;
  count?: number;
  enabled?: boolean;
}

export interface Stats {
  vectors?: VectorEmbedder[];
  [key: string]: unknown;
}

export async function getStats(): Promise<Stats> {
  return cached('stats', ONE_HOUR, async () => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return res.json();
  }, { tag: 'stats' });
}

export interface CompareResponse {
  query: string;
  byModel: Record<string, { results: Document[]; elapsed_ms: number }>;
  agreement: {
    top1: number;
    top5_jaccard: number;
    avg_rank_shift: number;
    shared_ids: string[];
  };
}

export async function compareSearch({
  query,
  models,
  limit = 20,
}: {
  query: string;
  models: string[];
  limit?: number;
}): Promise<CompareResponse> {
  const params = new URLSearchParams({
    q: query,
    models: models.join(','),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/compare?${params}`);
  if (!res.ok) throw new Error(`compare ${res.status}`);
  return res.json();
}

export interface MenuItem {
  path: string;
  label: string;
  group: 'main' | 'tools' | 'admin' | 'hidden';
  order: number;
  icon?: string;
  studio?: string | null;
  access?: 'public' | 'auth';
  source: 'api' | 'page' | 'plugin';
  added?: boolean;
  hidden?: boolean;
}

export async function getMenu({ host }: { host?: string } = {}): Promise<MenuItem[]> {
  const qs = host ? `?host=${encodeURIComponent(host)}` : '';
  const key = `menu:${host ?? ''}`;
  return cached(key, TEN_MIN, async () => {
    const res = await fetch(`${API_BASE}/menu${qs}`);
    if (!res.ok) throw new Error(`menu ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.items) ? (data.items as MenuItem[]) : [];
  }, { tag: 'menu' });
}

/** Ping the backend — used by BackendGate for soft-mode detection. */
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
