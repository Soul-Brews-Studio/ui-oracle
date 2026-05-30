import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { CrossOriginResolver, NavItem } from './nav-types';
import { isActiveNav } from './nav-types';

interface NavDisclosureProps {
  item: NavItem;
  crossOriginHref: CrossOriginResolver;
  /** Combined single-origin bundle mode. Opt-in; default false. */
  combinedMode?: boolean;
  /** In-app href resolver for combined bundles. When provided, in-app
   *  <Link>s target inAppHref(item) instead of item.path. Opt-in. */
  inAppHref?: (item: NavItem) => string;
}

/**
 * Parent nav item with a submenu panel. Desktop: hover opens. Mobile
 * (coarse pointer / ≤640px): tap the chevron to toggle. The parent label
 * itself navigates to `item.path` (or its cross-origin href) so a Canvas
 * parent with `studio` lands at the studio root.
 */
export function NavDisclosure({ item, crossOriginHref, combinedMode = false, inAppHref }: NavDisclosureProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isCoarse, setIsCoarse] = useState(false);

  // In combined single-origin bundles, resolve in-app targets via inAppHref.
  const inApp = combinedMode && inAppHref ? inAppHref : undefined;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: none), (max-width: 640px)');
    const sync = () => setIsCoarse(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const children = item.children ?? [];
  const parentHref = crossOriginHref(item);
  const hasRealPath = item.path && item.path !== '#';
  const parentActive = inApp
    ? isActiveNav(location, item, { ignoreHostGate: true })
    : isActiveNav(location, item);
  const anyActive = parentActive
    || children.some((c) =>
      inApp ? isActiveNav(location, c, { ignoreHostGate: true }) : isActiveNav(location, c),
    );

  const labelClass = `px-2.5 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
    anyActive
      ? 'bg-accent/15 text-accent font-semibold border border-accent/20'
      : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
  }`;

  const renderParentLabel = () => {
    if (!hasRealPath) {
      return (
        <button
          type="button"
          className={`${labelClass} bg-transparent cursor-pointer font-[inherit]`}
          onClick={() => isCoarse && setOpen((v) => !v)}
        >
          {item.label} <span aria-hidden="true">▸</span>
        </button>
      );
    }
    if (parentHref) {
      return (
        <a href={parentHref} className={labelClass} aria-current={parentActive ? 'page' : undefined}>
          {item.label} <span aria-hidden="true">▸</span>
        </a>
      );
    }
    return (
      <Link to={inApp ? inApp(item) : item.path} className={labelClass} aria-current={parentActive ? 'page' : undefined}>
        {item.label} <span aria-hidden="true">▸</span>
      </Link>
    );
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => !isCoarse && setOpen(true)}
      onMouseLeave={() => !isCoarse && setOpen(false)}
    >
      <span className="inline-flex items-center">
        {renderParentLabel()}
        {isCoarse && hasRealPath && (
          <button
            type="button"
            aria-label={`Toggle ${item.label} submenu`}
            aria-expanded={open}
            className="px-2 py-1.5 text-[13px] text-text-secondary hover:text-accent bg-transparent border-none cursor-pointer"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true">{open ? '▾' : '▸'}</span>
          </button>
        )}
      </span>
      {children.length > 0 && (
        <>
          <div className="absolute top-full left-0 right-0 h-2" aria-hidden="true" />
          <div
            className={`absolute top-[calc(100%+4px)] left-0 bg-bg-card/95 backdrop-blur-xl border border-border rounded-xl p-1 min-w-[180px] z-[200] transition-all duration-150 ease-out ${
              open
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 -translate-y-1 pointer-events-none'
            }`}
            style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)' }}
            role="menu"
          >
            {children.map((child) => {
              const href = crossOriginHref(child);
              const childActive = inApp
                ? isActiveNav(location, child, { ignoreHostGate: true })
                : isActiveNav(location, child);
              const childClass = `block px-3 py-2 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                childActive
                  ? 'bg-accent/15 text-accent font-semibold'
                  : 'text-text-secondary hover:bg-white/5 hover:text-accent'
              }`;
              if (href) {
                return (
                  <a
                    key={href}
                    href={href}
                    className={childClass}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                    aria-current={childActive ? 'page' : undefined}
                  >
                    {child.label}
                  </a>
                );
              }
              return (
                <Link
                  key={child.path}
                  to={inApp ? inApp(child) : child.path}
                  className={childClass}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  aria-current={childActive ? 'page' : undefined}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
