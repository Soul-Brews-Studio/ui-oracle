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
