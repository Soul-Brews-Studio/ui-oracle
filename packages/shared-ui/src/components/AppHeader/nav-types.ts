import type { Location } from 'react-router-dom';

export type NavItem = {
  path: string;
  label: string;
  studio?: string;
  query?: Record<string, string>;
  children?: NavItem[];
};

export type NavSet = { main: NavItem[]; tools: NavItem[] };

export type MenuApiItem = {
  id?: string;
  parentId?: string | null;
  path: string;
  label: string;
  group?: string;
  order?: number;
  studio?: string;
  query?: Record<string, string>;
};

/**
 * Given a NavItem and the current host context, return a cross-origin `href`
 * when navigation should leave this bundle, or null for in-app `<Link>` routing.
 */
export type CrossOriginResolver = (item: NavItem) => string | null;

export function isActivePath(location: Location, path: string): boolean {
  return location.pathname === path.split('?')[0];
}

// Three-gate active check: host (if studio-scoped), path (always), query (if set).
// studio is a HOST GATE — it scopes *where* the item can be active, not *whether*
// the path matters. Previously, a matching host short-circuited to `true` and
// caused every studio-scoped item to light up on the same origin regardless of
// pathname (Overview + Search both active on studio.*/ etc.).
export function isActiveNav(
  location: Location,
  item: { path: string; studio?: string; query?: Record<string, string> },
  opts?: { ignoreHostGate?: boolean; base?: string },
): boolean {
  const ignoreHostGate = opts?.ignoreHostGate === true;
  if (item.studio && !ignoreHostGate) {
    if (typeof window === 'undefined') return false;
    const hostMatch = window.location.hostname === item.studio
      || window.location.hostname.endsWith('.' + item.studio);
    if (!hostMatch) return false;
  }

  const itemPath = ignoreHostGate
    ? (opts?.base ?? '') + item.path.split('?')[0]
    : item.path.split('?')[0];
  if (location.pathname !== itemPath) return false;

  if (item.query) {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(item.query)) {
      if (params.get(k) !== v) return false;
    }
  }
  return true;
}

type OrderedNavItem = NavItem & { order: number };

export function buildNavSet(items: MenuApiItem[]): NavSet {
  const main: OrderedNavItem[] = [];
  const tools: OrderedNavItem[] = [];
  const byId = new Map<string, OrderedNavItem>();
  const childrenByParent = new Map<string, OrderedNavItem[]>();

  for (const item of items) {
    if (!item || typeof item.path !== 'string' || typeof item.label !== 'string') continue;
    const entry: OrderedNavItem = {
      path: item.path,
      label: item.label,
      order: typeof item.order === 'number' ? item.order : 999,
    };
    if (typeof item.studio === 'string' && item.studio) entry.studio = item.studio;
    if (item.query && typeof item.query === 'object') {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(item.query)) {
        if (typeof k === 'string' && typeof v === 'string') clean[k] = v;
      }
      if (Object.keys(clean).length > 0) entry.query = clean;
    }

    if (typeof item.id === 'string' && item.id) byId.set(item.id, entry);

    if (typeof item.parentId === 'string' && item.parentId) {
      const bucket = childrenByParent.get(item.parentId) ?? [];
      bucket.push(entry);
      childrenByParent.set(item.parentId, bucket);
      continue;
    }

    const topBucket =
      item.group === 'tools' ? tools : item.group === 'main' ? main : null;
    if (!topBucket) continue;
    topBucket.push(entry);
  }

  // Attach children to their parents (by id). Unresolved parents are dropped.
  for (const [parentId, kids] of childrenByParent.entries()) {
    const parent = byId.get(parentId);
    if (!parent) continue;
    kids.sort(byOrder);
    parent.children = kids.map(strip);
  }

  main.sort(byOrder);
  tools.sort(byOrder);

  const mainItems = main.map(strip);
  return {
    // Prepend a default Overview only when NO Overview exists. Prior check also
    // required `!n.studio` which caused duplicate Overview when gist items carry
    // `studio: 'studio.buildwithoracle.com'` — match by label only.
    main: mainItems.some((n) => n.label === 'Overview')
      ? mainItems
      : [{ path: '/', label: 'Overview' }, ...mainItems],
    tools: tools.map(strip),
  };
}

function byOrder(a: { order: number }, b: { order: number }) {
  return a.order - b.order;
}

function strip(entry: OrderedNavItem): NavItem {
  const out: NavItem = { path: entry.path, label: entry.label };
  if (entry.studio) out.studio = entry.studio;
  if (entry.query) out.query = entry.query;
  if (entry.children) out.children = entry.children;
  return out;
}
