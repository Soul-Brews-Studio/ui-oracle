import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActiveInApp, isActiveNav } from './nav-types';

interface ToolsDropdownProps {
  items: NavItem[];
  crossOriginHref: CrossOriginResolver;
  label?: string;
  /** Combined single-origin bundle mode. Opt-in; default false. */
  combinedMode?: boolean;
  /** In-app href resolver for combined bundles. When provided, the in-app
   *  <Link> targets inAppHref(item) instead of item.path. Opt-in. */
  inAppHref?: (item: NavItem) => string;
}

/**
 * Hover-triggered "Tools ▾" dropdown. Renders internal or cross-origin links
 * via `crossOriginHref(item)`.
 */
export function ToolsDropdown({ items, crossOriginHref, label = 'Tools ▾', combinedMode = false, inAppHref }: ToolsDropdownProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // In combined single-origin bundles, resolve in-app targets via inAppHref.
  const inApp = combinedMode && inAppHref ? inAppHref : undefined;

  const anyActive = items.some((t) =>
    inApp ? isActiveInApp(location.pathname, inApp(t)) : isActiveNav(location, t),
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 bg-transparent border-none cursor-pointer font-[inherit] ${
          anyActive
            ? 'bg-bg-card text-accent'
            : 'text-text-secondary hover:bg-bg-card hover:text-accent'
        }`}
      >
        {label}
      </button>
      <div className="absolute top-full left-0 right-0 h-2" aria-hidden="true" />
      <div
        className={`absolute top-[calc(100%+4px)] right-0 bg-bg-card/95 backdrop-blur-xl border border-border rounded-xl p-1 min-w-[180px] z-[200] transition-all duration-150 ease-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
        style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}
        role="menu"
      >
        {items.map((item) => {
          // Combined bundle: never bounce cross-origin — stay in-app via inApp(item).
          const href = inApp ? null : crossOriginHref(item);
          const active = inApp
            ? isActiveInApp(location.pathname, inApp(item))
            : isActiveNav(location, item);
          const cls = `block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
            active
              ? 'bg-accent/15 text-accent font-semibold'
              : 'text-text-secondary hover:bg-white/5 hover:text-accent'
          }`;
          if (href) {
            return (
              <a key={href} href={href} className={cls} onClick={() => setOpen(false)} role="menuitem" aria-current={active ? 'page' : undefined}>
                {item.label}
              </a>
            );
          }
          const to = inApp ? inApp(item) : item.path;
          return (
            <Link key={item.path} to={to} className={cls} onClick={() => setOpen(false)} role="menuitem" aria-current={active ? 'page' : undefined}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
