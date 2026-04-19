import { useEffect, useState } from 'react';
import { apiUrl } from '../../host';
import { cached } from '../../cache';
import { buildNavSet, type MenuApiItem, type NavSet } from './nav-types';

const MENU_CACHE_KEY = 'header:menu';
const MENU_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Load the nav menu from /api/menu with localStorage/idb caching + fallback.
 * Returns `{ nav, loaded }` — fallback is kept until the fetch resolves (success
 * or failure). Callers can gate visibility on `loaded` to avoid a fallback→server
 * content-jump flash.
 */
export function useMenu(fallback: NavSet): { nav: NavSet; loaded: boolean } {
  const [nav, setNav] = useState<NavSet>(fallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await cached<{ items?: MenuApiItem[] }>(
          MENU_CACHE_KEY,
          MENU_CACHE_TTL_MS,
          async () => {
            const res = await fetch(apiUrl('/api/menu'));
            if (!res.ok) throw new Error(`menu ${res.status}`);
            return res.json();
          },
          { tag: 'menu' },
        );
        if (cancelled) return;
        const items: MenuApiItem[] = Array.isArray(data?.items) ? data.items : [];
        if (items.length > 0) setNav(buildNavSet(items));
      } catch {
        // Backend unreachable — keep fallback nav.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { nav, loaded };
}

/**
 * Fetch the backend's `/api/health.version` and return it for display in the
 * version chip. Returns null on failure or while loading.
 */
export function useBackendVersion(): string | null {
  const [v, setV] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/health'));
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled && typeof data.version === 'string') setV(data.version);
      } catch {
        // Ignore — version chip just won't show backend version.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return v;
}
