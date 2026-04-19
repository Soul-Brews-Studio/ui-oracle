import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActiveNav } from './nav-types';
import { NavDisclosure } from './NavDisclosure';

interface MainNavProps {
  items: NavItem[];
  crossOriginHref: CrossOriginResolver;
}

/**
 * Top-level nav items. Renders either internal `<Link>` or cross-origin `<a>`
 * based on `crossOriginHref(item)`. Items with `children` render a disclosure
 * panel (hover desktop, tap mobile). Fully host-agnostic.
 */
export function MainNav({ items, crossOriginHref }: MainNavProps) {
  const location = useLocation();

  return (
    <>
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          return (
            <NavDisclosure
              key={item.path + ':' + item.label}
              item={item}
              crossOriginHref={crossOriginHref}
            />
          );
        }
        const href = crossOriginHref(item);
        const active = isActiveNav(location, item);
        const cls = `px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
          active
            ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
            : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
        }`;
        if (href) {
          return (
            <a key={href} href={href} className={cls}>
              {item.label}
            </a>
          );
        }
        return (
          <Link key={item.path} to={item.path} className={cls}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
