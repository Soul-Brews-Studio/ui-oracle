/**
 * Host resolution — ported from oracle-studio / maw-ui (local.drizzle.studio pattern).
 *
 *   ?host=localhost:47778           → http://localhost:47778 (saved, URL cleaned)
 *   ?host=http://oracle-world:47778 → explicit
 *   ?host=https://mba.wg:47778      → TLS
 *
 * No stored host → DEFAULT_HOST (http://localhost:47778).
 */

const STORAGE_KEY = 'vector-oracle-studio-host';
const RECENT_KEY = 'vector-oracle-studio-host-recent';
const RECENT_LIMIT = 8;
const DEFAULT_HOST = 'http://localhost:47778';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const urlHost = params.get('host');

if (urlHost && typeof window !== 'undefined') {
  localStorage.setItem(STORAGE_KEY, urlHost);
  addRecentHost(urlHost);
  const url = new URL(window.location.href);
  url.searchParams.delete('host');
  window.location.replace(url.toString());
}

const storedHost = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
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
    return { httpProto: 'https:', wsProto: 'wss:', host: hostParam.slice('https://'.length).replace(/\/+$/, '') };
  }
  if (hostParam.startsWith('http://')) {
    return { httpProto: 'http:', wsProto: 'ws:', host: hostParam.slice('http://'.length).replace(/\/+$/, '') };
  }
  return { httpProto: 'http:', wsProto: 'ws:', host: hostParam.replace(/\/+$/, '') };
}

export function apiUrl(path: string): string {
  const r = resolveHost();
  return `${r.httpProto}//${r.host}${path}`;
}

export function hostLabel(): string {
  const r = resolveHost();
  return isDefault ? `${r.host} (default)` : r.host;
}
