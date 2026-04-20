import { apiUrl } from './host';
import { cached } from '../lib/cache';
export { apiUrl } from './host';

export const API_BASE = apiUrl('/api');

const ONE_HOUR = 60 * 60 * 1000;

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
  return cached(`list:${type}:${qs}`, ONE_HOUR, async () => {
    const res = await fetch(`${API_BASE}/list?${qs}`);
    return res.json();
  }, { tag: `list:${type}` });
}
