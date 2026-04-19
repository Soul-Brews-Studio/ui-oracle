import { useEffect, useState } from 'react';
import { apiUrl } from '../../host';
import { cached } from '../../cache';
import { buildNavSet, type MenuApiItem, type NavSet } from './nav-types';

const MENU_CACHE_KEY = 'header:menu';
const MENU_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Load the nav menu from /api/menu with localStorage/idb caching + fallback.
 * Returns the fallback until the fetch completes, then swaps in the server's list.
 */
export function useMenu(fallback: NavSet): NavSet {
  const [nav, setNav] = useState<NavSet>(fallback);

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
        const items: MenuApiItem[] = Array.isArray(data?.items) ? data.items : [];
        if (cancelled || items.length === 0) return;
        setNav(buildNavSet(items));
      } catch {
        // Backend unreachable — keep fallback nav.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return nav;
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
