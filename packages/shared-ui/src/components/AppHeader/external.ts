import type { NavItem } from './nav-types';
import { selfServedOrigin } from '../../host';

/** Host name shown in the "opens another site" tooltip. */
export function externalHost(href: string): string {
  try { return new URL(href).host; } catch { return href; }
}

/**
 * Sibling studios this bundle also ships as an in-app route. When arra serves
 * the Studio itself (no buildwithoracle subdomains around it), these nav items
 * stay in the app instead of bouncing to another site.
 */
const IN_APP_ROUTES: Record<string, string> = { 'canvas.buildwithoracle.com': '/canvas' };

/** Studios whose pages this bundle carries itself (studio pages, vector playground/compare, canvas). */
const IN_APP_STUDIOS = new Set(['studio.buildwithoracle.com', 'vector.buildwithoracle.com', ...Object.keys(IN_APP_ROUTES)]);

/**
 * Served by an arra backend: does this nav item leave the app? Only sibling
 * studios this bundle does not carry (feed, forum, schedule) do. Before this,
 * every item bounced to the public studio.buildwithoracle.com, because the
 * page was neither the studio nor the vector host.
 */
export function leavesSelfServedApp(item: Pick<NavItem, 'studio'>): boolean {
  return !!item.studio && !IN_APP_STUDIOS.has(item.studio);
}

export function keepInApp(items: NavItem[]): NavItem[] {
  if (!selfServedOrigin()) return items;
  return items.map((item) => {
    const route = item.studio ? IN_APP_ROUTES[item.studio] : undefined;
    return route ? { ...item, path: route, studio: undefined } : item;
  });
}
