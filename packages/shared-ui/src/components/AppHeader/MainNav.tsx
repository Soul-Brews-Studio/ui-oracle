import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActiveInApp, isActiveNav } from './nav-types';
import { NavDisclosure } from './NavDisclosure';

interface MainNavProps {
  items: NavItem[];
  crossOriginHref: CrossOriginResolver;
  /** Combined single-origin bundle mode. Opt-in; default false. */
  combinedMode?: boolean;
  /** In-app href resolver for combined bundles. When provided, the in-app
   *  <Link> targets inAppHref(item) instead of item.path. Opt-in. */
  inAppHref?: (item: NavItem) => string;
}

/**
 * Top-level nav items. Renders either internal `<Link>` or cross-origin `<a>`
 * based on `crossOriginHref(item)`. Items with `children` render a disclosure
 * panel (hover desktop, tap mobile). Fully host-agnostic.
 */
export function MainNav({ items, crossOriginHref, combinedMode = false, inAppHref }: MainNavProps) {
  const location = useLocation();

  // In combined single-origin bundles, resolve in-app targets via inAppHref.
  const inApp = combinedMode && inAppHref ? inAppHref : undefined;

  return (
    <>
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          return (
            <NavDisclosure
              key={item.path + ':' + item.label}
              item={item}
              crossOriginHref={crossOriginHref}
              combinedMode={combinedMode}
              inAppHref={inAppHref}
            />
          );
        }
        const to = inApp ? inApp(item) : item.path;
        // Combined bundle: never bounce cross-origin — stay in-app via inApp(item).
        const href = inApp ? null : crossOriginHref(item);
        const active = inApp
          ? isActiveInApp(location.pathname, to)
          : isActiveNav(location, item);
        const cls = `px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
          active
            ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
            : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
        }`;
        if (href) {
          return (
            <a key={href} href={href} className={cls} aria-current={active ? 'page' : undefined}>
              {item.label}
            </a>
          );
        }
        return (
          <Link key={item.path} to={to} className={cls} aria-current={active ? 'page' : undefined}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
