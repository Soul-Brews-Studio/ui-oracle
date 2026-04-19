import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActivePath } from './nav-types';
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
        if (href) {
          return (
            <a
              key={href}
              href={href}
              className="px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent"
            >
              {item.label}
            </a>
          );
        }
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
              isActivePath(location, item.path)
                ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
                : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
