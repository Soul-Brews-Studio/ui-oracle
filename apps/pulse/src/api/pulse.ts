// Pulse status API — fetches the status snapshot via same-origin /api/status.
// In production the worker.ts proxies to http://76.13.221.42/maw/pulse/status.json.
// In dev, vite.config.ts proxies the same path. A ?status=<url> override is
// kept for testing against alternate deployments; falls back to bundled mock
// data when no upstream is reachable.

import { mockStatus } from '../data/mock';

const STORAGE_KEY = 'pulse-status-url';
const STATUS_TIMEOUT_MS = 5000;
const DEFAULT_STATUS_PATH = '/api/status';
const DEFAULT_PING_PATH = '/api/ping';

export type ServiceState = 'up' | 'down' | 'unknown';

export interface ServiceCheck {
  id: string;
  name: string;
  url?: string;
  state: ServiceState;
  latencyMs?: number | null;
  expected?: string;
  actual?: string;
  note?: string;
}

export interface AlertEntry {
  ts: string;
  severity: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export interface DailyRollup {
  date: string;
  passed: number;
  failed: number;
}

export interface PulseStatus {
  generatedAt: string;
  server: string;
  services: ServiceCheck[];
  recentAlerts: AlertEntry[];
  uptime7d: DailyRollup[];
  meta: {
    source: 'live' | 'mock';
    version: string;
    note?: string;
  };
}

function resolveOverrideUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get('status');
  if (urlParam) {
    localStorage.setItem(STORAGE_KEY, urlParam);
    const clean = new URL(window.location.href);
    clean.searchParams.delete('status');
    window.history.replaceState({}, '', clean.toString());
    return urlParam;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export async function ping(): Promise<boolean> {
  const override = resolveOverrideUrl();
  const url = override ?? DEFAULT_PING_PATH;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getPulseStatus(): Promise<PulseStatus> {
  const override = resolveOverrideUrl();
  const url = override ?? DEFAULT_STATUS_PATH;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(STATUS_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as PulseStatus;
    return { ...data, meta: { ...data.meta, source: 'live' } };
  } catch (e) {
    return {
      ...mockStatus,
      meta: {
        ...mockStatus.meta,
        source: 'mock',
        note: `Live status fetch failed (${(e as Error).message}) — showing bundled mock data.`,
      },
    };
  }
}
