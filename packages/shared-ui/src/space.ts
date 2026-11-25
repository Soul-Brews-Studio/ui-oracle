/**
 * The chosen space (#3110): which notes Studio pages show — "all", "self" (this machine), or "hub:<name>".
 * Kept in localStorage so every page and every app in the bundle agrees; changes are broadcast.
 */
const KEY = 'arra-space';
const EVENT = 'arra-space-change';

export function getSpace(): string {
  try { return localStorage.getItem(KEY) || 'all'; } catch { return 'all'; }
}

export function setSpace(space: string): void {
  try { space === 'all' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, space); } catch { /* private mode */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: space }));
}

export function onSpaceChange(fn: (space: string) => void): () => void {
  const h = () => fn(getSpace());
  window.addEventListener(EVENT, h);
  window.addEventListener('storage', h);
  return () => { window.removeEventListener(EVENT, h); window.removeEventListener('storage', h); };
}

/** `&space=...` for search/list calls, or '' for all. */
export function spaceParam(): string {
  const s = getSpace();
  return s === 'all' ? '' : `&space=${encodeURIComponent(s)}`;
}

/**
 * Tenant (#3110): one arra holding several oracles' memories (neo, nexus, mother, pulse...).
 * The chosen tenant rides on every API request as X-Oracle-Tenant; picking a space clears it.
 */
const TENANT_KEY = 'arra-tenant';

export function getTenant(): string {
  try { return localStorage.getItem(TENANT_KEY) || ''; } catch { return ''; }
}

export function setTenant(tenant: string): void {
  try { tenant ? localStorage.setItem(TENANT_KEY, tenant) : localStorage.removeItem(TENANT_KEY); } catch { /* private mode */ }
}

/** Wrap fetch once so every request to an /api path carries the tenant header (pages need no change). */
export function installTenantFetch(): void {
  if (typeof window === 'undefined' || (window as { __arraTenantFetch?: boolean }).__arraTenantFetch) return;
  (window as { __arraTenantFetch?: boolean }).__arraTenantFetch = true;
  const original = window.fetch.bind(window);
  const wrapped = (input: RequestInfo | URL, init?: RequestInit) => {
    const tenant = getTenant();
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!tenant || !/\/api\//.test(url) || /\/api\/(v1\/)?(tenants|arra\/spaces)/.test(url)) return original(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set('X-Oracle-Tenant', tenant);
    return original(input, { ...init, headers });
  };
  window.fetch = Object.assign(wrapped, original) as typeof fetch;
}

installTenantFetch();
