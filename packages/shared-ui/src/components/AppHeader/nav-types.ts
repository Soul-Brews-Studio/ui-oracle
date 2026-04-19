import type { Location } from 'react-router-dom';

export type NavItem = { path: string; label: string; studio?: string };

export type NavSet = { main: NavItem[]; tools: NavItem[] };

export type MenuApiItem = {
  path: string;
  label: string;
  group?: string;
  order?: number;
  studio?: string;
};

/**
 * Given a NavItem and the current host context, return a cross-origin `href`
 * when navigation should leave this bundle, or null for in-app `<Link>` routing.
 */
export type CrossOriginResolver = (item: NavItem) => string | null;

export function isActivePath(location: Location, path: string): boolean {
  return location.pathname === path.split('?')[0];
}

export function buildNavSet(items: MenuApiItem[]): NavSet {
  const main: Array<NavItem & { order: number }> = [];
  const tools: Array<NavItem & { order: number }> = [];
  for (const item of items) {
    if (!item || typeof item.path !== 'string' || typeof item.label !== 'string') continue;
    const bucket =
      item.group === 'tools' ? tools : item.group === 'main' ? main : null;
    if (!bucket) continue;
    const entry: NavItem & { order: number } = {
      path: item.path,
      label: item.label,
      order: typeof item.order === 'number' ? item.order : 999,
    };
    if (typeof item.studio === 'string' && item.studio) entry.studio = item.studio;
    bucket.push(entry);
  }
  const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;
  main.sort(byOrder);
  tools.sort(byOrder);
  const strip = ({ path, label, studio }: NavItem & { order: number }): NavItem =>
    studio ? { path, label, studio } : { path, label };
  const mainItems = main.map(strip);
  return {
    main: mainItems.some((n) => n.path === '/' && !n.studio)
      ? mainItems
      : [{ path: '/', label: 'Overview' }, ...mainItems],
    tools: tools.map(strip),
  };
}
