/**
 * Host resolution — ported from oracle-studio / maw-ui (local.drizzle.studio pattern).
 *
 *   ?host=localhost:47778           → http://localhost:47778 (saved, URL cleaned)
 *   ?host=http://oracle-world:47778 → explicit
 *   ?host=https://mba.wg:47778      → TLS
 *
 * No stored host → DEFAULT_HOST (http://localhost:47778).
 *
 * Unified across studio + vector + canvas apps.
 */

const STORAGE_KEY = 'oracle-studio-host';
const RECENT_KEY = 'oracle-studio-host-recent';
const RECENT_LIMIT = 8;

// Backend host default. The studio is a thin client whose :47778 backend runs
// on the user's OWN machine, so the default is ALWAYS localhost:47778. Two
// overrides still win, in order:
//   1. import.meta.env.VITE_DEFAULT_HOST — build-time pin for a deployment.
//   2. a stored / `?host=` value — see `hostParam` below.
// For LAN / multi-machine setups (e.g. a WireGuard peer at m5.wg, a bare IP),
// point at the backend explicitly via `?host=http://m5.wg:47778` (persisted) or
// a VITE_DEFAULT_HOST build pin — the default no longer derives from the page.
const ENV_DEFAULT =
  typeof import.meta !== 'undefined' &&
  (import.meta as { env?: { VITE_DEFAULT_HOST?: string } }).env?.VITE_DEFAULT_HOST;
const DEFAULT_HOST: string = ENV_DEFAULT || 'http://localhost:47778';

const params =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const urlHost = params.get('host');

if (urlHost && typeof window !== 'undefined') {
  localStorage.setItem(STORAGE_KEY, urlHost);
  addRecentHost(urlHost);
  const url = new URL(window.location.href);
  url.searchParams.delete('host');
  window.location.replace(url.toString());
}

let storedHost = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
// Self-heal: a stored host pointing at a deployed public domain (e.g. a stale
// "app.buildwithoracle.com:47778" left by an older build, or any *.workers.dev)
// can never be a real :47778 backend — drop it and fall back to localhost.
if (storedHost && /(?:\.buildwithoracle\.com|\.workers\.dev)/i.test(storedHost)) {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  storedHost = null;
}
const hostParam = storedHost ?? DEFAULT_HOST;

export const isRemote = !!storedHost;
export const isDefault = !storedHost;
export const activeHost: string = hostParam;

export function getStoredHost(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
}

export function setStoredHost(host: string): void {
  localStorage.setItem(STORAGE_KEY, host);
  addRecentHost(host);
}

export function clearStoredHost(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRecentHosts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentHost(host: string): void {
  const recent = getRecentHosts().filter((h) => h !== host);
  recent.unshift(host);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
}

function resolveHost(): { httpProto: string; wsProto: string; host: string } {
  if (hostParam.startsWith('https://')) {
    return {
      httpProto: 'https:',
      wsProto: 'wss:',
      host: hostParam.slice('https://'.length).replace(/\/+$/, ''),
    };
  }
  if (hostParam.startsWith('http://')) {
    return {
      httpProto: 'http:',
      wsProto: 'ws:',
      host: hostParam.slice('http://'.length).replace(/\/+$/, ''),
    };
  }
  // Bare host:port — default to http because arra-oracle-v3 serves plain HTTP.
  return { httpProto: 'http:', wsProto: 'ws:', host: hostParam.replace(/\/+$/, '') };
}

/** Build a full URL for fetch(). Accepts an `/api/...` path and prepends the configured host. */
export function apiUrl(path: string): string {
  const r = resolveHost();
  return `${r.httpProto}//${r.host}${path}`;
}

/** WebSocket URL builder. */
export function wsUrl(path: string): string {
  const r = resolveHost();
  return `${r.wsProto}//${r.host}${path}`;
}

/** Human-readable host label for UI (`localhost:47778 (default)` or `mba.wg:47778`). */
export function hostLabel(): string {
  const r = resolveHost();
  return isDefault ? `${r.host} (default)` : r.host;
}

/** True when the current page is served from a vector.* hostname. */
export function isVectorHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.includes('vector.');
}

/** True when the current page is served from the studio bundle's prod hosts (studio.* or local.*). */
export function isStudioHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h.startsWith('studio.') || h.startsWith('local.');
}

/** True when the current page is served from a canvas.* hostname. */
export function isCanvasHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.includes('canvas.');
}
