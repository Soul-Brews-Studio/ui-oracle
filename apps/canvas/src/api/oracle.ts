import { apiUrl } from './host';
import { cached } from '../lib/cache';
export { apiUrl, hostLabel, activeHost, isDefault, isRemote } from './host';

export const API_BASE = apiUrl('/api');

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const TEN_MIN = 10 * 60 * 1000;

export interface Document {
  id: string;
  type: string;
  content?: string;
  source_file: string;
  concepts: string[];
  project?: string;
  source?: string;
  score?: number;
  distance?: number;
  model?: string;
  created_at?: string;
}

export interface MapDocument {
  id: string;
  type: string;
  source_file: string;
  concepts: string[];
  chunk_ids?: string[];
  project: string | null;
  x: number;
  y: number;
  z?: number;
  created_at: string | null;
}

export interface OracleProject {
  project: string;
  docs: number;
  types: number;
  last_indexed: number;
}

export interface OracleIdentity {
  oracle_name: string;
  source: string;
  last_seen: number;
  actions: number;
}

export interface Stats {
  total?: number;
  by_type?: Record<string, number>;
  by_type_files?: Record<string, number>;
  last_indexed?: string;
  vectors?: Array<{
    key: string;
    model: string;
    collection: string;
    count: number;
    enabled: boolean;
  }>;
  [key: string]: unknown;
}

export interface SearchResult {
  results: Document[];
  total: number;
  query: string;
}

export async function getStats(): Promise<Stats> {
  return cached('stats', ONE_HOUR, async () => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return res.json();
  }, { tag: 'stats' });
}

export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getMap(): Promise<{ documents: MapDocument[]; total: number }> {
  const res = await fetch(`${API_BASE}/map`);
  return res.json();
}

export async function getMap3d(model?: string): Promise<{ documents: MapDocument[]; total: number; pca_info?: unknown }> {
  const params = model ? `?model=${encodeURIComponent(model)}` : '';
  const key = `map3d:${model ?? 'default'}`;
  return cached(key, ONE_DAY, async () => {
    const res = await fetch(`${API_BASE}/map3d${params}`);
    return res.json();
  }, { tag: 'map3d', store: 'idb' });
}

export async function getOracles(): Promise<{
  identities: OracleIdentity[];
  projects: OracleProject[];
  total_projects: number;
  total_identities: number;
}> {
  return cached('oracles', ONE_DAY, async () => {
    const res = await fetch(`${API_BASE}/oracles`);
    return res.json();
  }, { tag: 'oracles' });
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
    return res.json();
  }, { tag: 'search' });
}
