import { Link, useLocation } from 'react-router-dom';
import { isSubNavItemActive } from './SubNav-active';

export type SubNavItem = { path: string; label: string; icon?: string };

interface Props {
  items: SubNavItem[];
  /** If false, render nothing. Use to host-gate (e.g. only on vector.*). */
  enabled?: boolean;
}

/**
 * Host-neutral sub-nav tab strip, rendered below the main AppHeader.
 * Caller is responsible for host gating via `enabled`.
 */
export function SubNav({ items, enabled = true }: Props) {
  const location = useLocation();
  if (!enabled) return null;

  const currentSearch =
    typeof window !== 'undefined' ? window.location.search : '';

  return (
    <div
      className="sticky top-[92px] z-40 backdrop-blur-xl"
      style={{
        background: 'rgba(10, 10, 15, 0.55)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      <nav className="flex items-center gap-1.5 px-6 py-2 max-w-[1400px] mx-auto overflow-x-auto">
        {items.map((it) => {
          const active = isSubNavItemActive(it.path, location.pathname, currentSearch);
          return (
            <Link
              key={it.path}
              to={it.path}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-accent/15 text-accent font-semibold border border-accent/25'
                  : 'text-text-secondary hover:bg-bg-card hover:text-accent border border-transparent'
              }`}
            >
              {it.icon && <span aria-hidden>{it.icon}</span>}
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
