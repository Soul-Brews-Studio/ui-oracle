import { useEffect, useState } from 'react';
import { apiUrl } from '../../host';
import { cached } from '../../cache';
import { buildNavSet, type MenuApiItem, type NavSet } from './nav-types';

// v2: 2026-04-20 — Forum child moved to forum.buildwithoracle.com
const MENU_CACHE_KEY = 'header:menu:v2';
const MENU_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Load the nav menu from /api/menu with localStorage/idb caching + fallback.
 * Returns `{ nav, loaded }` — fallback is kept until the fetch resolves (success
 * or failure). Callers can gate visibility on `loaded` to avoid a fallback→server
 * content-jump flash.
 */
export function useMenu(
  fallback: NavSet,
  options: { skipFetch?: boolean } = {},
): { nav: NavSet; loaded: boolean } {
  const [nav, setNav] = useState<NavSet>(fallback);
  const [loaded, setLoaded] = useState(options.skipFetch === true);

  useEffect(() => {
    if (options.skipFetch) return;
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
        if (items.length > 0) {
          const built = buildNavSet(items);
          // Keep fallback when backend returns too few main items — common when
          // the DB seed only has tools-group rows. The fallback is the curated
          // menu; a sparse DB response shouldn't erase it.
          const mainCount = built.main.filter((n) => !(n.path === '/' && n.label === 'Overview' && !n.studio)).length;
          if (mainCount >= fallback.main.length - 1) {
            setNav(built);
          }
        }
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
