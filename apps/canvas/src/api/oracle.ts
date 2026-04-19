import { apiUrl } from './host';
import { cached } from '../lib/cache';
export { apiUrl, hostLabel, activeHost, isDefault, isRemote } from './host';

export const API_BASE = apiUrl('/api');

const ONE_HOUR = 60 * 60 * 1000;

export interface Stats {
  [key: string]: unknown;
}

export async function getStats(): Promise<Stats> {
  return cached('stats', ONE_HOUR, async () => {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return res.json();
  }, { tag: 'stats' });
}

/** Ping the backend — used by the header status chip. */
export async function ping(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}
