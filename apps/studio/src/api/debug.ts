/**
 * HUGINN debug API — the two backend streams the /__debug page consumes.
 *
 * These endpoints are owned by arra-oracle-v3 and may not exist yet. Both
 * helpers resolve to `{ unavailable: true }` (never throw) on 404/network
 * error, so the page can show a clean "waiting on arra-oracle-v3" state and
 * light up automatically the moment the endpoints ship.
 *
 * Proposed contracts (flagged to arra-oracle-v3):
 *   GET /api/debug/actions?limit=&since=&type=  → merged *_log row stream
 *   GET /api/debug/errors?limit=&since=         → indexing_status.error + failures
 */
import { API_BASE } from './oracle';

export interface DebugAction {
  id: number;
  ts: string;
  /** activity | search | learn | trace | supersede | consult | … */
  type: string;
  summary: string;
  duration_ms?: number;
  meta?: Record<string, unknown>;
}

export interface DebugError {
  id: number;
  ts: string;
  /** indexing_status | search_log | … */
  source: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface Unavailable {
  unavailable: true;
}

export function isUnavailable(v: unknown): v is Unavailable {
  return !!v && typeof v === 'object' && (v as Unavailable).unavailable === true;
}

interface StreamOpts {
  limit?: number;
  since?: string;
  type?: string;
}

function buildParams(opts?: StreamOpts): string {
  const p = new URLSearchParams();
  if (opts?.limit) p.set('limit', String(opts.limit));
  if (opts?.since) p.set('since', opts.since);
  if (opts?.type) p.set('type', opts.type);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function getDebugActions(
  opts?: StreamOpts,
): Promise<{ actions: DebugAction[]; next_since?: string } | Unavailable> {
  try {
    const res = await fetch(`${API_BASE}/debug/actions${buildParams(opts)}`);
    if (!res.ok) return { unavailable: true };
    return await res.json();
  } catch {
    return { unavailable: true };
  }
}

export async function getDebugErrors(
  opts?: StreamOpts,
): Promise<{ errors: DebugError[]; next_since?: string } | Unavailable> {
  try {
    const res = await fetch(`${API_BASE}/debug/errors${buildParams(opts)}`);
    if (!res.ok) return { unavailable: true };
    return await res.json();
  } catch {
    return { unavailable: true };
  }
}
