import type { NavItem } from '@ui-oracle/shared-ui';

/**
 * Maps the cross-origin `studio` host on each NavItem to the in-app base path
 * used by the combined bundle. Items without a `studio` host resolve against
 * the empty base (i.e. their `path` is used verbatim).
 */
export const SUBDOMAIN_TO_BASE: Record<string, string> = {
  'studio.buildwithoracle.com': '/studio',
  'vector.buildwithoracle.com': '/vector',
  'canvas.buildwithoracle.com': '/canvas',
  'feed.buildwithoracle.com': '/feed',
  'forum.buildwithoracle.com': '/forum',
  'schedule.buildwithoracle.com': '/schedule',
  'indexer.buildwithoracle.com': '/indexer',
};

/**
 * In-app href resolver for the combined bundle. Translates a NavItem into a
 * same-origin path: base (from its `studio` host) + the item's path, with any
 * `query` appended as `?k=v`.
 */
export function inAppHref(item: NavItem): string {
  const base = (item.studio ? SUBDOMAIN_TO_BASE[item.studio] : undefined) ?? '';
  let href = base + item.path;

  if (item.query) {
    const entries = Object.entries(item.query);
    if (entries.length > 0) {
      const sep = href.includes('?') ? '&' : '?';
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      href = `${href}${sep}${qs}`;
    }
  }

  return href;
}
